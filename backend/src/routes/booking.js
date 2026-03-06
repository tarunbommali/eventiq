const express = require("express");
const bookingRouter = express.Router();

const Booking = require("../models/booking");
const Event = require("../models/event");
const RecommendationLog = require("../models/recommendationLog");
const { userAuth } = require("../middleware/userAuth");
const { lockMultipleSeats, unlockMultipleSeats } = require("../services/seatLock");

// POST /booking/:eventId - Create a booking (dual logic: seat-based vs general)
bookingRouter.post("/:eventId", userAuth, async (req, res) => {
  const { eventId } = req.params;
  const { noOfTickets, seats, quantity } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already booked
    const alreadyBooked = await Booking.findOne({
      user: req.user._id,
      event: eventId,
      status: { $ne: "cancelled" },
    });

    if (alreadyBooked) {
      return res.status(400).json({ message: "Already booked this event" });
    }

    let bookingData = {
      user: req.user._id,
      event: eventId,
      status: "confirmed",
    };

    // ========== SEAT-BASED BOOKING ==========
    if (event.eventType === "seat") {
      if (!seats || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ message: "Please select at least one seat" });
      }

      if (seats.length > 6) {
        return res.status(400).json({ message: "Maximum 6 seats per booking" });
      }

      // Acquire distributed Redis locks for multi-seat consistency
      const lockResult = await lockMultipleSeats(eventId, seats, req.user._id.toString());
      if (!lockResult.success) {
        return res.status(409).json({
          message: `Seats already locked by another user: ${lockResult.failedSeats.join(", ")}`,
        });
      }

      // Atomic seat removal using findOneAndUpdate with $pullAll and $expr
      // Ensures all requested seats exist in availableSeats before removing — prevents race conditions
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $expr: {
            $setIsSubset: [seats, "$availableSeats"],
          },
        },
        { $pullAll: { availableSeats: seats } },
        { new: true }
      );

      // Release distributed locks after DB update
      await unlockMultipleSeats(eventId, seats, req.user._id.toString());

      if (!updatedEvent) {
        return res.status(400).json({
          message: "One or more selected seats are no longer available",
        });
      }

      bookingData.seats = seats;
      bookingData.quantity = seats.length;
      bookingData.noOfTickets = seats.length;

    // ========== GENERAL / ONLINE BOOKING ==========
    } else {
      const ticketCount = quantity || noOfTickets || 1;

      if (ticketCount < 1 || ticketCount > 6) {
        return res.status(400).json({ message: "Tickets must be between 1 and 6" });
      }

      // Atomic capacity check + increment (prevents race conditions)
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          $expr: {
            $or: [
              { $eq: ["$totalCapacity", 0] }, // unlimited capacity
              { $lte: [{ $add: ["$bookedCount", ticketCount] }, "$totalCapacity"] },
            ],
          },
        },
        { $inc: { bookedCount: ticketCount } },
        { new: true }
      );

      if (!updatedEvent) {
        return res.status(400).json({
          message: `Not enough spots remaining`,
        });
      }

      bookingData.quantity = ticketCount;
      bookingData.noOfTickets = ticketCount;
    }

    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Log for ML recommendations
    try {
      await RecommendationLog.create({
        userId: req.user._id,
        eventId: eventId,
        booked: true,
      });
    } catch (logErr) {
      console.error("RecommendationLog error (non-blocking):", logErr.message);
    }

    res.status(201).json({ message: "Booking successful", booking: newBooking });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /booking/:bookingId/cancel - Cancel a booking
bookingRouter.post("/:bookingId/cancel", userAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the booking owner can cancel" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Atomic status update — prevents double-cancel race condition
    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, status: { $ne: "cancelled" } },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Atomically restore seats/capacity to the event
    if (updatedBooking.seats && updatedBooking.seats.length > 0) {
      // Seat-based: push seats back atomically
      await Event.findByIdAndUpdate(updatedBooking.event, {
        $push: { availableSeats: { $each: updatedBooking.seats, $sort: 1 } },
      });
    } else {
      // General/online: decrement booked count atomically
      const ticketCount = updatedBooking.quantity || updatedBooking.noOfTickets || 1;
      await Event.findByIdAndUpdate(updatedBooking.event, {
        $inc: { bookedCount: -ticketCount },
      });
    }

    res.status(200).json({ message: "Booking cancelled", booking: updatedBooking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /booking/:bookingId - Get a single booking by ID
bookingRouter.get("/:bookingId", userAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate({
      path: "event",
      populate: { path: "createdBy", select: "name profilePhotoUrl role" },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /booking - Get all bookings for the logged-in user (paginated)
bookingRouter.get("/", userAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = { user: req.user._id };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ bookedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: "event",
          populate: { path: "createdBy", select: "name profilePhotoUrl role" },
        }),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      message: "User bookings fetched successfully",
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = bookingRouter;

const express = require("express");
const eventRouter = express.Router();
const Event = require("../models/event");
const Booking = require("../models/booking");
const { userAuth } = require("../middleware/userAuth");
const { roleAuth } = require("../middleware/roleAuth");
const { validateEvent } = require("../utils/validation");

// GET /events - Public route to get all events with optional filters & pagination
eventRouter.get("/", async (req, res) => {
  try {
    const { category, city, eventType, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (city) {
      // Escape special regex characters to prevent ReDoS
      const escapedCity = city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.city = { $regex: escapedCity, $options: "i" };
    }
    if (eventType) filter.eventType = eventType;
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name profilePhotoUrl role"),
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// GET /events/my-events - Get events created by the logged-in organizer/admin
eventRouter.get("/my-events", userAuth, roleAuth("organizer", "admin"), async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ date: -1 })
      .populate("createdBy", "name profilePhotoUrl role");
    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching hosted events:", error);
    res.status(500).json({ message: "Error fetching your events" });
  }
});

// GET /events/:eventId - Get single event details
eventRouter.get("/:eventId", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate(
      "createdBy",
      "name profilePhotoUrl role"
    );
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ event });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Error fetching event" });
  }
});

// POST /events - Create a new event (requires auth, organizer or admin role)
eventRouter.post("/", userAuth, roleAuth("organizer", "admin"), async (req, res) => {
  const {
    title,
    description,
    eventType,
    category,
    location,
    city,
    date,
    time,
    price,
    bannerUrl,
    totalSeats,
    totalCapacity,
  } = req.body;

  // Server-side validation using shared validator
  const validationErrors = validateEvent({ title, description, location, date, time });
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors: validationErrors });
  }

  try {
    const eventData = {
      title,
      description,
      location,
      date,
      time,
      createdBy: req.user._id,
      eventType: eventType || "general",
      category: category || "General",
      city: city || "",
      price: price || 0,
      bannerUrl: bannerUrl || "",
    };

    // Set up seat/capacity based on event type
    if (eventType === "seat" && totalSeats) {
      eventData.totalSeats = totalSeats;
      // Available seats: array [1, 2, 3, ..., totalSeats]
      eventData.availableSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
    } else if (eventType === "general" || eventType === "online") {
      eventData.totalCapacity = totalCapacity || 100;
      eventData.bookedCount = 0;
    }

    const newEvent = new Event(eventData);
    await newEvent.save();

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event" });
  }
});

// PUT /events/:eventId - Update event (organizer who created it, or admin)
eventRouter.put("/:eventId", userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only creator or admin can update
    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the event creator or admin can update this event" });
    }

    const allowedUpdates = [
      "title", "description", "location", "city", "date", "time",
      "price", "bannerUrl", "category", "totalCapacity",
    ];
    const updates = Object.keys(req.body);
    updates.forEach((key) => {
      if (allowedUpdates.includes(key)) {
        event[key] = req.body[key];
      }
    });

    await event.save();
    res.status(200).json({ message: "Event updated", event });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Error updating event" });
  }
});

// DELETE /events/:eventId - Delete event (organizer who created it, or admin)
eventRouter.delete("/:eventId", userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner = event.createdBy && event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the event creator or admin can delete this event" });
    }

    // Check for active (non-cancelled) bookings before deleting
    const activeBookings = await Booking.countDocuments({
      event: req.params.eventId,
      status: { $ne: "cancelled" },
    });
    if (activeBookings > 0) {
      return res.status(400).json({
        message: `Cannot delete event with ${activeBookings} active booking(s). Cancel all bookings first.`,
      });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    // Also delete associated bookings (cancelled ones)
    await Booking.deleteMany({ event: req.params.eventId });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event" });
  }
});

// POST /events/:eventId/like - Like an event (atomic operations to prevent race conditions)
eventRouter.post("/:eventId/like", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if already liked
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const alreadyLiked = event.likes.some((id) => id.toString() === userId.toString());

    let updatedEvent;
    if (alreadyLiked) {
      // Remove like atomically
      updatedEvent = await Event.findByIdAndUpdate(
        req.params.eventId,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Add like + remove from dislikes atomically
      updatedEvent = await Event.findByIdAndUpdate(
        req.params.eventId,
        { $addToSet: { likes: userId }, $pull: { dislikes: userId } },
        { new: true }
      );
    }

    res.status(200).json({
      likes: updatedEvent.likes.length,
      dislikes: updatedEvent.dislikes.length,
      userLiked: !alreadyLiked,
      userDisliked: false,
    });
  } catch (error) {
    console.error("Error liking event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /events/:eventId/dislike - Dislike an event (atomic operations to prevent race conditions)
eventRouter.post("/:eventId/dislike", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const alreadyDisliked = event.dislikes.some((id) => id.toString() === userId.toString());

    let updatedEvent;
    if (alreadyDisliked) {
      // Remove dislike atomically
      updatedEvent = await Event.findByIdAndUpdate(
        req.params.eventId,
        { $pull: { dislikes: userId } },
        { new: true }
      );
    } else {
      // Add dislike + remove from likes atomically
      updatedEvent = await Event.findByIdAndUpdate(
        req.params.eventId,
        { $addToSet: { dislikes: userId }, $pull: { likes: userId } },
        { new: true }
      );
    }

    res.status(200).json({
      likes: updatedEvent.likes.length,
      dislikes: updatedEvent.dislikes.length,
      userLiked: false,
      userDisliked: !alreadyDisliked,
    });
  } catch (error) {
    console.error("Error disliking event:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /events/:eventId/booked-users - Get list of users who booked this event (host only)
eventRouter.get("/:eventId/booked-users", userAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only the host or admin can see booked users
    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the event host can view booked users" });
    }

    const bookings = await Booking.find({ event: req.params.eventId }).populate(
      "user",
      "name email phoneNumber profilePhotoUrl"
    );

    const bookedUsers = bookings.map((b) => ({
      bookingId: b._id,
      noOfTickets: b.noOfTickets || b.quantity,
      seats: b.seats,
      status: b.status,
      bookedAt: b.bookedAt,
      user: b.user,
    }));

    res.status(200).json({ bookedUsers });
  } catch (error) {
    console.error("Error fetching booked users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /events/:eventId/available-seats - Get available seats for seat-based events
eventRouter.get("/:eventId/available-seats", async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.eventType !== "seat") {
      return res.status(400).json({ message: "This event is not seat-based" });
    }

    res.status(200).json({
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
    });
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = eventRouter;

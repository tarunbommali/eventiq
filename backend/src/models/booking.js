const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  // For seat-based events: array of selected seat numbers
  seats: {
    type: [Number],
    default: [],
  },
  // For general/online events: number of tickets
  quantity: {
    type: Number,
    default: 1,
  },
  // Legacy field (kept for backward compatibility)
  noOfTickets: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "confirmed",
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for query performance
bookingSchema.index({ user: 1, event: 1 });  // duplicate-booking check
bookingSchema.index({ user: 1 });             // user's bookings list
bookingSchema.index({ event: 1 });            // event's bookings list

module.exports = mongoose.model("Booking", bookingSchema);

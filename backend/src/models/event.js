const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ["seat", "general", "online"],
      default: "general",
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    // For seat-based events
    totalSeats: {
      type: Number,
      default: 0,
    },
    availableSeats: {
      type: [Number],
      default: [],
    },
    // For general/online events
    totalCapacity: {
      type: Number,
      default: 0,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Indexes for query performance
eventSchema.index({ date: 1 });                    // sort/filter by date
eventSchema.index({ category: 1, city: 1 });        // filtered event listings
eventSchema.index({ createdBy: 1 });                // organizer's events
eventSchema.index({ eventType: 1 });                // filter by event type

module.exports = mongoose.model("Event", eventSchema);

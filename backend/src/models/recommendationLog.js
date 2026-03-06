const mongoose = require("mongoose");

const recommendationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  clicked: {
    type: Boolean,
    default: false,
  },
  booked: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast queries by user
recommendationLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("RecommendationLog", recommendationLogSchema);

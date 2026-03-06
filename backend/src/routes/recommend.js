const express = require("express");
const recommendRouter = express.Router();
const axios = require("axios");
const { userAuth } = require("../middleware/userAuth");
const RecommendationLog = require("../models/recommendationLog");
const Event = require("../models/event");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_API_KEY = process.env.ML_API_KEY || "";

// GET /recommend - Get personalized recommendations for the logged-in user
recommendRouter.get("/", userAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Try ML service first
    try {
      const mlResponse = await axios.get(`${ML_SERVICE_URL}/recommend/${userId}`, {
        timeout: 5000,
        headers: ML_API_KEY ? { "X-API-Key": ML_API_KEY } : {},
      });

      if (mlResponse.data && mlResponse.data.recommended_event_ids) {
        const events = await Event.find({
          _id: { $in: mlResponse.data.recommended_event_ids },
        }).populate("createdBy", "name profilePhotoUrl role");

        return res.status(200).json({
          source: "ml",
          events,
        });
      }
    } catch (mlErr) {
      console.warn("ML service unavailable, using fallback:", mlErr.message);
    }

    // Fallback: recommend based on user's preferred categories + popular events
    let events;

    if (req.user.preferredCategories && req.user.preferredCategories.length > 0) {
      // Use aggregation with $size to sort by likes count (dot-notation sort on array length is a no-op)
      events = await Event.aggregate([
        {
          $match: {
            category: { $in: req.user.preferredCategories },
            date: { $gte: new Date() },
          },
        },
        { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $sort: { likesCount: -1, date: 1 } },
        { $limit: 10 },
      ]);

      // Populate createdBy after aggregation
      if (events.length > 0) {
        events = await Event.populate(events, {
          path: "createdBy",
          select: "name profilePhotoUrl role",
        });
      }
    }

    // If no category-based results, show popular upcoming events
    if (!events || events.length === 0) {
      events = await Event.find({ date: { $gte: new Date() } })
        .sort({ date: 1 })
        .limit(10)
        .populate("createdBy", "name profilePhotoUrl role");
    }

    res.status(200).json({
      source: "fallback",
      events,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /recommend/log - Log a recommendation interaction (click)
recommendRouter.post("/log", userAuth, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    await RecommendationLog.create({
      userId: req.user._id,
      eventId,
      clicked: true,
    });

    res.status(201).json({ message: "Interaction logged" });
  } catch (error) {
    console.error("Recommendation log error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = recommendRouter;

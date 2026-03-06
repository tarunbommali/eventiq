require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("../src/config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ── Startup env validation ──────────────────────────────────────────
const requiredEnvVars = ["JWT_SECRET", "MONGODB_URL"];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// ── Security middleware ─────────────────────────────────────────────
app.use(helmet());            // Sets secure HTTP headers
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));  // Explicit body size limit

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

app.use(globalLimiter);


const PORT = process.env.PORT || 3000;

const authRouter = require("../src/routes/auth");
const eventRouter = require("../src/routes/event");
const bookingRouter = require("../src/routes/booking");
const uploadRouter = require("../src/routes/upload");
const recommendRouter = require("../src/routes/recommend");


const allowedOrigins = [
  "http://localhost:5173",
  "https://basic-activity-booking-app.netlify.app",
  "https://basic-activity-booking-app-02p3.onrender.com",
  "https://basic-activity-booking-app-theta.vercel.app",
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};



app.use(cors(corsOptions));
app.use("/", authRouter);                   // Auth routes
app.use("/events", eventRouter);
app.use("/booking", bookingRouter);
app.use("/upload", uploadRouter);
app.use("/recommend", recommendRouter);

// Health check endpoint (for container orchestration)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// ── 404 catch-all handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: "Internal server error" });
});

// Connect to MongoDB and optionally Redis, then start the server
connectDB()
  .then(async () => {
    console.log("MongoDB connection established successfully");

    // Try connecting Redis (non-blocking)
    try {
      const { connectRedis } = require("../src/config/redis");
      await connectRedis();
    } catch (err) {
      console.warn("Redis not configured, seat locking will use fallback:", err.message);
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// ── Graceful shutdown ───────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error during shutdown:", err.message);
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

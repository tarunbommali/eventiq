const express = require("express");
const authRouter = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { userAuth } = require("../middleware/userAuth");
const { validateSignup } = require("../utils/validation");
const rateLimit = require("express-rate-limit");

// Rate limiter applied only to login and signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

// Helper to build user response object
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  profilePhotoUrl: user.profilePhotoUrl,
  role: user.role,
  preferredCategories: user.preferredCategories,
});

// REGISTER USER
authRouter.post("/signup", authLimiter, async (req, res) => {
  const { name, email, phoneNumber, password, role, preferredCategories } = req.body;

  // Comprehensive server-side validation
  const validationErrors = validateSignup({ name, email, phoneNumber, password });
  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({ message: "Validation failed", errors: validationErrors });
  }

  // Only allow valid roles from signup (never allow "admin" from client)
  const allowedRoles = ["user", "organizer"];
  const userRole = allowedRoles.includes(role) ? role : "user";

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      password: hashedPassword,
      role: userRole,
      preferredCategories: Array.isArray(preferredCategories) ? preferredCategories : [],
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse(newUser),
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN USER
authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = await user.getJWT();

    // Set token in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.status(200).json({
      message: "Login successful",
      user: userResponse(user),
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /me - Check if user is authenticated
authRouter.get("/me", userAuth, async (req, res) => {
  try {
    res.status(200).json({ user: userResponse(req.user) });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /logout - Clear cookie and log out
authRouter.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// GET /profile - Get user profile
authRouter.get("/profile", userAuth, async (req, res) => {
  try {
    res.status(200).json({ user: userResponse(req.user) });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /profile - Update user profile
authRouter.patch("/profile", userAuth, async (req, res) => {
  const allowedUpdates = ["name", "phoneNumber", "preferredCategories"];
  const updates = Object.keys(req.body);
  const isValid = updates.every((key) => allowedUpdates.includes(key));

  if (!isValid) {
    return res.status(400).json({ message: "Only name, phoneNumber and preferredCategories can be updated" });
  }

  // Validate name if provided
  if (req.body.name !== undefined) {
    if (typeof req.body.name !== "string" || req.body.name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
  }

  // Validate phoneNumber if provided
  if (req.body.phoneNumber !== undefined) {
    const validator = require("validator");
    if (!validator.isMobilePhone(String(req.body.phoneNumber), "any")) {
      return res.status(400).json({ message: "A valid phone number is required" });
    }
  }

  // Validate preferredCategories if provided
  if (req.body.preferredCategories !== undefined) {
    if (!Array.isArray(req.body.preferredCategories)) {
      return res.status(400).json({ message: "preferredCategories must be an array" });
    }
  }

  try {
    updates.forEach((key) => {
      req.user[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
    });
    await req.user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse(req.user),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = authRouter;

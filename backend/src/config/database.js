const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGODB_URL = process.env.MONGODB_URL;
  if (!MONGODB_URL) {
    throw new Error("MONGODB_URL is not defined. Check your .env file.");
  }
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
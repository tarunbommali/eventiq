const express = require("express");
const uploadRouter = express.Router();
const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, S3_BUCKET_NAME } = require("../config/s3");
const { userAuth } = require("../middleware/userAuth");
const path = require("path");

// Multer config - store in memory for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

// POST /upload/profile-photo - Upload profile photo to S3
uploadRouter.post(
  "/profile-photo",
  userAuth,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const key = `profile-photos/${req.user._id}-${Date.now()}${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });

      await s3Client.send(command);

      const photoUrl = `https://${S3_BUCKET_NAME}.s3.${
        process.env.AWS_REGION || "ap-south-1"
      }.amazonaws.com/${key}`;

      // Update user's profilePhotoUrl in DB
      req.user.profilePhotoUrl = photoUrl;
      await req.user.save();

      res.status(200).json({
        message: "Profile photo uploaded successfully",
        profilePhotoUrl: photoUrl,
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res
        .status(500)
        .json({ message: "Error uploading photo", error: error.message });
    }
  }
);

module.exports = uploadRouter;

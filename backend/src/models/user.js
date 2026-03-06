const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email format: " + value);
        }
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isMobilePhone(value, "any")) {
          throw new Error("Invalid phone number: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Password is not strong enough.");
        }
      },
    },
    profilePhotoUrl: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "organizer", "admin"],
      default: "user",
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// JWT method
userSchema.methods.getJWT = function () {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// Password validation method
userSchema.methods.validatePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

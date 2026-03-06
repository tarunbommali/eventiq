const validator = require("validator");

/**
 * Sanitize a string for use in MongoDB $regex to prevent ReDoS attacks.
 * Escapes all special regex characters.
 */
const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Validate signup input.
 * Returns an object of field-level errors (empty = valid).
 */
const validateSignup = ({ name, email, phoneNumber, password }) => {
  const errors = {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  if (!email || !validator.isEmail(String(email))) {
    errors.email = "A valid email is required";
  }
  if (!phoneNumber || !validator.isMobilePhone(String(phoneNumber), "any")) {
    errors.phoneNumber = "A valid phone number is required";
  }
  if (!password || typeof password !== "string") {
    errors.password = "Password is required";
  } else if (!validator.isStrongPassword(password)) {
    errors.password =
      "Password must be 8+ chars with uppercase, lowercase, number, and symbol";
  }

  return errors;
};

/**
 * Validate event creation input.
 */
const validateEvent = ({ title, description, location, date, time }) => {
  const errors = {};

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    errors.title = "Title must be at least 2 characters";
  }
  if (!description || typeof description !== "string") {
    errors.description = "Description is required";
  }
  if (!location || typeof location !== "string") {
    errors.location = "Location is required";
  }
  if (!date) {
    errors.date = "Date is required";
  }
  if (!time || typeof time !== "string") {
    errors.time = "Time is required";
  }

  return errors;
};

module.exports = { escapeRegex, validateSignup, validateEvent };

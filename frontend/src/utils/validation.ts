// ── Validation helpers for client-side form validation ──────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,15}$/;

export interface FieldError {
  [key: string]: string;
}

// ── Login / Signup ──────────────────────────────────────────────────

export const validateLogin = (email: string, password: string): FieldError => {
  const errors: FieldError = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";

  if (!password.trim()) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[A-Z]/.test(password)) errors.password = "Password must include an uppercase letter";
  else if (!/[a-z]/.test(password)) errors.password = "Password must include a lowercase letter";
  else if (!/[0-9]/.test(password)) errors.password = "Password must include a number";
  else if (!/[^A-Za-z0-9]/.test(password)) errors.password = "Password must include a special character";

  return errors;
};

export const validateSignup = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): FieldError => {
  const errors = validateLogin(data.email, data.password);

  if (!data.name.trim()) errors.name = "Name is required";
  else if (data.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!data.phone.trim()) errors.phone = "Phone number is required";
  else if (!PHONE_RE.test(data.phone)) errors.phone = "Enter a valid phone number";

  return errors;
};

// ── Host Event ──────────────────────────────────────────────────────

export const validateEvent = (data: {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  eventType: string;
  totalSeats: string;
  totalCapacity: string;
  price: string;
}): FieldError => {
  const errors: FieldError = {};

  if (!data.title.trim()) errors.title = "Title is required";
  else if (data.title.trim().length < 3) errors.title = "Title must be at least 3 characters";

  if (!data.description.trim()) errors.description = "Description is required";
  else if (data.description.trim().length < 10)
    errors.description = "Description must be at least 10 characters";

  if (!data.location.trim()) errors.location = "Location is required";

  if (!data.date) errors.date = "Date is required";
  else if (new Date(data.date) < new Date(new Date().toDateString()))
    errors.date = "Date cannot be in the past";

  if (!data.time) errors.time = "Time is required";

  if (data.eventType === "seat" && data.totalSeats) {
    const seats = Number(data.totalSeats);
    if (isNaN(seats) || seats < 1) errors.totalSeats = "Seats must be a positive number";
    else if (seats > 10000) errors.totalSeats = "Maximum 10,000 seats";
  }

  if ((data.eventType === "general" || data.eventType === "online") && data.totalCapacity) {
    const cap = Number(data.totalCapacity);
    if (isNaN(cap) || cap < 1) errors.totalCapacity = "Capacity must be a positive number";
  }

  if (data.price) {
    const price = Number(data.price);
    if (isNaN(price) || price < 0) errors.price = "Price must be 0 or more";
  }

  return errors;
};

// ── Profile Edit ────────────────────────────────────────────────────

export const validateProfileEdit = (data: {
  name: string;
  phoneNumber: string;
}): FieldError => {
  const errors: FieldError = {};
  if (!data.name.trim()) errors.name = "Name is required";
  else if (data.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

  if (!data.phoneNumber.trim()) errors.phoneNumber = "Phone number is required";
  else if (!PHONE_RE.test(data.phoneNumber))
    errors.phoneNumber = "Enter a valid phone number";

  return errors;
};

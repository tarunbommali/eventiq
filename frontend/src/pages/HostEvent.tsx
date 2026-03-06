/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { BACKEND_URL } from "../utils/constants";
import { validateEvent } from "../utils/validation";
import type { FieldError } from "../utils/validation";
import { useAuth } from "../context/AuthContext";

const HostEvent = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const isAuthorized = user?.role === "organizer" || user?.role === "admin";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "general",
    category: "",
    location: "",
    city: "",
    date: "",
    time: "",
    price: "",
    totalSeats: "",
    totalCapacity: "",
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationErrors = validateEvent(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);
      const payload: any = { ...formData };
      if (payload.price) payload.price = Number(payload.price);
      if (payload.totalSeats) payload.totalSeats = Number(payload.totalSeats);
      if (payload.totalCapacity) payload.totalCapacity = Number(payload.totalCapacity);
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") delete payload[k];
      });

      await axios.post(`${BACKEND_URL}events`, payload, {
        withCredentials: true,
      });
      setSuccess("Event created successfully!");
      setFormData({
        title: "", description: "", eventType: "general", category: "",
        location: "", city: "", date: "", time: "", price: "", totalSeats: "", totalCapacity: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating event. Make sure you have organizer/admin role.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field?: string) =>
    `w-full px-4 py-3 bg-[#0f0f1a] border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors ${
      field && fieldErrors[field] ? "border-red-500/60" : "border-gray-700"
    }`;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8 text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in with an organizer account to host events.</p>
          <Link to="/login" className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8 text-center max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">Only organizers and admins can host events. Your current role is <span className="text-rose-400 font-medium">{user?.role || "user"}</span>.</p>
          <Link to="/" className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-white">
          Host <span className="text-rose-400">Event</span>
        </h1>
        <p className="text-gray-400 mt-1">Create a new event for your audience</p>
      </div>

      {/* Host New Event Form */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Create New Event</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
            <input name="title" type="text" placeholder="Enter event title" value={formData.title} onChange={handleChange} className={inputClass("title")} />
            {fieldErrors.title && <p className="text-red-400 text-xs mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea name="description" placeholder="Describe your event..." value={formData.description} onChange={handleChange} rows={3} className={inputClass("description")} />
            {fieldErrors.description && <p className="text-red-400 text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Event Type</label>
              <select name="eventType" value={formData.eventType} onChange={handleChange} className={inputClass()}>
                <option value="general">General (Capacity)</option>
                <option value="seat">Seat-based</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <input name="category" type="text" placeholder="e.g., Music, Tech" value={formData.category} onChange={handleChange} className={inputClass()} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Venue / Location</label>
              <input name="location" type="text" placeholder="Event venue" value={formData.location} onChange={handleChange} className={inputClass("location")} />
              {fieldErrors.location && <p className="text-red-400 text-xs mt-1">{fieldErrors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
              <input name="city" type="text" placeholder="City" value={formData.city} onChange={handleChange} className={inputClass()} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
              <input name="date" type="date" value={formData.date} onChange={handleChange} className={inputClass("date")} />
              {fieldErrors.date && <p className="text-red-400 text-xs mt-1">{fieldErrors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Time</label>
              <input name="time" type="time" value={formData.time} onChange={handleChange} className={inputClass("time")} />
              {fieldErrors.time && <p className="text-red-400 text-xs mt-1">{fieldErrors.time}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ticket Price</label>
            <input name="price" type="number" placeholder="0 = Free" value={formData.price} onChange={handleChange} className={inputClass("price")} min="0" />
            {fieldErrors.price && <p className="text-red-400 text-xs mt-1">{fieldErrors.price}</p>}
          </div>

          {formData.eventType === "seat" && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Total Seats</label>
              <input name="totalSeats" type="number" placeholder="Number of seats" value={formData.totalSeats} onChange={handleChange} className={inputClass("totalSeats")} min="1" />
              {fieldErrors.totalSeats && <p className="text-red-400 text-xs mt-1">{fieldErrors.totalSeats}</p>}
            </div>
          )}
          {(formData.eventType === "general" || formData.eventType === "online") && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Total Capacity</label>
              <input name="totalCapacity" type="number" placeholder="Max attendees" value={formData.totalCapacity} onChange={handleChange} className={inputClass("totalCapacity")} min="1" />
              {fieldErrors.totalCapacity && <p className="text-red-400 text-xs mt-1">{fieldErrors.totalCapacity}</p>}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20 cursor-pointer">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                Creating...
              </span>
            ) : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HostEvent;


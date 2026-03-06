/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

interface EventType {
  _id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  date: string;
  eventType?: string;
  category?: string;
  price?: number;
  city?: string;
  likes?: string[];
  dislikes?: string[];
  createdBy?: {
    _id: string;
    name: string;
    profilePhotoUrl: string;
  };
}

interface Booking {
  _id: string;
  noOfTickets: number;
  seats?: number[];
  quantity?: number;
  status?: string;
  bookedAt: string;
  event: EventType;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}booking`, {
          withCredentials: true,
        });
        setBookings(response.data.bookings);
      } catch (err) {
        console.error(err);
        setError("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(bookingId);
    try {
      await axios.post(`${BACKEND_URL}booking/${bookingId}/cancel`, {}, { withCredentials: true });
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case "confirmed": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "cancelled": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "pending": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      default: return "bg-gray-700/50 text-gray-300 border-gray-600/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Your Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">{"\uD83C\uDFAB"}</p>
            <p className="text-gray-400 text-lg">No bookings yet</p>
            <Link to="/" className="text-rose-400 hover:underline text-sm mt-2 inline-block">Browse Events</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings
              .filter((booking) => booking.event)
              .map((booking) => {
                const isCancelled = booking.status === "cancelled";
                const eventDate = new Date(booking.event.date);
                return (
                  <div
                    key={booking._id}
                    className={`bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden transition-all ${
                      isCancelled ? "opacity-60" : "hover:border-gray-700"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Date sidebar */}
                      <div className="md:w-24 bg-[#16213e] flex md:flex-col items-center justify-center p-4 gap-2 md:gap-0 border-b md:border-b-0 md:border-r border-gray-800">
                        <span className="text-rose-400 text-xs font-bold uppercase">
                          {eventDate.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-white text-2xl font-bold">
                          {eventDate.getDate()}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {eventDate.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <Link
                              to={`/events/${booking.event._id}`}
                              className="text-lg font-semibold text-white hover:text-rose-400 transition-colors"
                            >
                              {booking.event.title}
                            </Link>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(booking.status)}`}>
                                {booking.status || "confirmed"}
                              </span>
                              {booking.event.eventType && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  booking.event.eventType === "seat" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                                  booking.event.eventType === "online" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                                  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}>
                                  {booking.event.eventType}
                                </span>
                              )}
                              {booking.event.category && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
                                  {booking.event.category}
                                </span>
                              )}
                            </div>
                          </div>
                          {booking.event.price !== undefined && booking.event.price > 0 && (
                            <span className="text-rose-400 font-bold text-lg whitespace-nowrap">
                              {"\u20B9"}{booking.event.price}
                            </span>
                          )}
                        </div>

                        {/* Details row */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {booking.event.location}{booking.event.city ? `, ${booking.event.city}` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {booking.event.time}
                          </span>
                        </div>

                        {/* Booking details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          {booking.seats && booking.seats.length > 0 ? (
                            <span className="text-purple-300">
                              {"\uD83E\uDE91"} Seats: {booking.seats.sort((a, b) => a - b).join(", ")}
                            </span>
                          ) : (
                            <span className="text-emerald-300">
                              {"\uD83C\uDFAB"} {booking.quantity || booking.noOfTickets} ticket(s)
                            </span>
                          )}
                          {booking.bookedAt && (
                            <span className="text-gray-500 text-xs">
                              Booked: {new Date(booking.bookedAt).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-gray-600 text-xs font-mono">
                            #{booking._id.slice(-8)}
                          </span>

                          {/* Cancel Button */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              disabled={cancellingId === booking._id}
                              className="ml-auto px-4 py-1.5 rounded-lg text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {cancellingId === booking._id ? "Cancelling..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;

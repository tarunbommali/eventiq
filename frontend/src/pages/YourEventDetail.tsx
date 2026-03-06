/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

interface EventType {
  _id: string;
  title: string;
  description: string;
  eventType?: string;
  category?: string;
  location: string;
  city?: string;
  date: string;
  time: string;
  price?: number;
  totalSeats?: number;
  totalCapacity?: number;
  bookedCount?: number;
  availableSeats?: number[];
  createdBy?: {
    _id: string;
    name: string;
    profilePhotoUrl: string;
  };
}

interface BookingType {
  _id: string;
  noOfTickets: number;
  quantity?: number;
  seats?: number[];
  status?: string;
  user: string;
  event: string;
  bookedAt: string;
}

interface BookedUser {
  bookingId: string;
  noOfTickets: number;
  seats?: number[];
  status?: string;
  bookedAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    profilePhotoUrl: string;
  };
}

const YourEventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const isAuthorized = user?.role === "organizer" || user?.role === "admin";

  const [event, setEvent] = useState<EventType | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");

  const [bookingId, setBookingId] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingType | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bookedUsers, setBookedUsers] = useState<BookedUser[]>([]);
  const [bookedUsersLoading, setBookedUsersLoading] = useState(false);
  const [bookedUsersError, setBookedUsersError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setEventLoading(true);
        const response = await axios.get(`${BACKEND_URL}events/${id}`, {
          withCredentials: true,
        });
        setEvent(response.data.event || response.data);
      } catch (err: any) {
        setEventError(err?.response?.data?.message || "Event not found");
      } finally {
        setEventLoading(false);
      }
    };
    if (id && isAuthorized) fetchEvent();
  }, [id, isAuthorized]);

  useEffect(() => {
    const fetchBookedUsers = async () => {
      try {
        setBookedUsersLoading(true);
        const response = await axios.get(`${BACKEND_URL}events/${id}/booked-users`, {
          withCredentials: true,
        });
        setBookedUsers(response.data.bookedUsers);
      } catch (err: any) {
        setBookedUsersError(err?.response?.data?.message || "Failed to load attendees");
      } finally {
        setBookedUsersLoading(false);
      }
    };
    if (id && isAuthorized) fetchBookedUsers();
  }, [id, isAuthorized]);

  const handleBookingSearch = async () => {
    if (!bookingId.trim()) {
      setBookingError("Please enter a booking ID.");
      return;
    }
    setBookingError("");
    setBookingResult(null);
    try {
      setBookingLoading(true);
      const response = await axios.get(`${BACKEND_URL}booking/${bookingId}`, {
        withCredentials: true,
      });
      setBookingResult(response.data.booking);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || "Booking not found.");
    } finally {
      setBookingLoading(false);
    }
  };

  const inputClass = () =>
    `w-full px-4 py-3 bg-[#0f0f1a] border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors border-gray-700`;

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
          <h2 className="text-xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in with an organizer account to view event details.</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">Only organizers and admins can manage events.</p>
          <Link to="/" className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">{eventError || "The event you're looking for doesn't exist."}</p>
          <Link to="/events/mine" className="inline-block px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 transition-all">
            Back to Your Events
          </Link>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const totalBooked = event.eventType === "seat"
    ? (event.totalSeats || 0) - (event.availableSeats?.length || 0)
    : (event.bookedCount || 0);
  const totalCapacity = event.eventType === "seat"
    ? (event.totalSeats || 0)
    : (event.totalCapacity || 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to="/events/mine" className="hover:text-rose-400 transition-colors">Your Events</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-gray-300 truncate">{event.title}</span>
      </div>

      {/* Event Header Card */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              {event.createdBy?.profilePhotoUrl ? (
                <img src={event.createdBy.profilePhotoUrl} alt={event.createdBy.name} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
                  {event.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <span className="text-sm text-gray-400">{event.createdBy?.name || "Unknown Host"}</span>
                {isPast && <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Ended</span>}
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{event.title}</h1>
            <p className="text-gray-400 leading-relaxed">{event.description}</p>

            {/* Badges */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {event.eventType && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  event.eventType === "seat" ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" :
                  event.eventType === "online" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" :
                  "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}>
                  {event.eventType}
                </span>
              )}
              {event.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600">
                  {event.category}
                </span>
              )}
              {event.price !== undefined && event.price > 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                  ₹{event.price}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  Free
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#0f0f1a] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Location
            </div>
            <p className="text-white text-sm font-medium">{event.location}</p>
            {event.city && <p className="text-gray-500 text-xs">{event.city}</p>}
          </div>
          <div className="bg-[#0f0f1a] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Date & Time
            </div>
            <p className="text-white text-sm font-medium">{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
            <p className="text-gray-500 text-xs">{event.time}</p>
          </div>
          <div className="bg-[#0f0f1a] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Capacity
            </div>
            <p className="text-white text-sm font-medium">{totalBooked} / {totalCapacity}</p>
            <p className="text-gray-500 text-xs">{occupancyPercent}% filled</p>
          </div>
        </div>

        {/* Capacity bar */}
        {totalCapacity > 0 && (
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  event.eventType === "seat"
                    ? "bg-gradient-to-r from-rose-500 to-pink-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500"
                }`}
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{event.eventType === "seat" ? "Seats" : "Spots"} booked</span>
              <span>{totalCapacity - totalBooked} remaining</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-600 mt-4 font-mono">Event ID: {event._id}</p>
      </div>

      {/* Search Booking by ID */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Search Booking</h2>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Enter Booking ID" value={bookingId} onChange={(e) => setBookingId(e.target.value)} className={inputClass()} />
          <button onClick={handleBookingSearch} disabled={bookingLoading} className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer">
            {bookingLoading ? "Searching..." : "Search"}
          </button>
        </div>
        {bookingError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{bookingError}</p>
          </div>
        )}
        {bookingResult && (
          <div className="mt-4 p-4 bg-[#0f0f1a] rounded-xl border border-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Booking ID</span>
              <span className="text-gray-200 text-sm font-mono">{bookingResult._id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Tickets</span>
              <span className="text-white font-semibold">{bookingResult.noOfTickets}</span>
            </div>
            {bookingResult.seats && bookingResult.seats.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Seats</span>
                <span className="text-rose-400 font-semibold">{bookingResult.seats.join(", ")}</span>
              </div>
            )}
            {bookingResult.status && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bookingResult.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : bookingResult.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>{bookingResult.status}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Booked At</span>
              <span className="text-gray-300 text-sm">{new Date(bookingResult.bookedAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Attendees List */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Attendees</h2>
            {!bookedUsersLoading && <p className="text-gray-500 text-xs">{bookedUsers.length} booking{bookedUsers.length !== 1 ? "s" : ""}</p>}
          </div>
        </div>

        {bookedUsersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-[#0f0f1a] rounded-lg">
                <div className="w-10 h-10 bg-gray-700/50 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-700/50 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : bookedUsersError ? (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{bookedUsersError}</p>
          </div>
        ) : bookedUsers.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="text-gray-400">No attendees yet.</p>
            <p className="text-gray-500 text-sm">Bookings will appear here once users register.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookedUsers.map((bu) => (
              <div key={bu.bookingId} className="flex items-center gap-3 p-4 bg-[#0f0f1a] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                {bu.user.profilePhotoUrl ? (
                  <img src={bu.user.profilePhotoUrl} alt={bu.user.name} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {bu.user.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{bu.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{bu.user.email}</p>
                  {bu.user.phoneNumber && <p className="text-xs text-gray-500">{bu.user.phoneNumber}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-rose-400">{bu.noOfTickets} ticket{bu.noOfTickets > 1 ? "s" : ""}</p>
                  {bu.seats && bu.seats.length > 0 && (
                    <p className="text-xs text-purple-400">Seats: {bu.seats.join(", ")}</p>
                  )}
                  {bu.status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${bu.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" : bu.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {bu.status}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(bu.bookedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourEventDetail;

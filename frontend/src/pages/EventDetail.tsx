/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  time: string;
  date: string;
  price?: number;
  bannerUrl?: string;
  totalSeats?: number;
  availableSeats?: number[];
  totalCapacity?: number;
  bookedCount?: number;
  createdBy?: {
    _id: string;
    name: string;
    profilePhotoUrl: string;
    role?: string;
  };
  likes?: string[];
  dislikes?: string[];
}

// Deterministic gradient from string
const getGradient = (str: string) => {
  const gradients = [
    "from-rose-600 via-pink-600 to-purple-700",
    "from-violet-600 via-indigo-600 to-blue-700",
    "from-cyan-600 via-teal-600 to-emerald-700",
    "from-amber-600 via-orange-600 to-red-700",
    "from-fuchsia-600 via-pink-500 to-rose-700",
    "from-blue-600 via-cyan-500 to-teal-600",
    "from-emerald-600 via-green-500 to-lime-600",
    "from-indigo-600 via-purple-500 to-pink-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Booking state
  const [tickets, setTickets] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [msg, setMsg] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Reactions
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}events/${eventId}`, {
          withCredentials: true,
        });
        const e = response.data.event || response.data;
        setEvent(e);
        setLikesCount(e.likes?.length || 0);
        setDislikesCount(e.dislikes?.length || 0);
        setAvailableSeats(e.availableSeats || []);
      } catch {
        setError("Event not found");
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">{error || "Event not found"}</p>
        <Link to="/" className="text-rose-400 hover:text-rose-300 underline">Back to Home</Link>
      </div>
    );
  }

  const isSeatBased = event.eventType === "seat";
  const isGeneral = event.eventType === "general" || !event.eventType;
  const isOnline = event.eventType === "online";
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const gradient = getGradient(event.title + (event.category || ""));

  const handleBooking = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    try {
      setBookingLoading(true);
      const payload: any = {};
      if (isSeatBased) {
        if (selectedSeats.length === 0) {
          setMsg("Please select at least one seat");
          setBookingLoading(false);
          return;
        }
        payload.seats = selectedSeats;
      } else {
        payload.noOfTickets = tickets;
        payload.quantity = tickets;
      }
      const response = await axios.post(
        `${BACKEND_URL}booking/${event._id}`,
        payload,
        { withCredentials: true }
      );
      setMsg(response.data.message || "Booking successful!");
      if (isSeatBased) {
        setAvailableSeats((prev) => prev.filter((s) => !selectedSeats.includes(s)));
        setSelectedSeats([]);
        setShowSeatPicker(false);
      }
    } catch (error: any) {
      setMsg(error?.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleSeat = (seat: number) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seat));
    } else if (selectedSeats.length < 6) {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const response = await axios.post(`${BACKEND_URL}events/${event._id}/like`, {}, { withCredentials: true });
      setLikesCount(response.data.likes);
      setDislikesCount(response.data.dislikes);
      setUserLiked(response.data.userLiked);
      setUserDisliked(response.data.userDisliked);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const response = await axios.post(`${BACKEND_URL}events/${event._id}/dislike`, {}, { withCredentials: true });
      setLikesCount(response.data.likes);
      setDislikesCount(response.data.dislikes);
      setUserLiked(response.data.userLiked);
      setUserDisliked(response.data.userDisliked);
    } catch (err: any) {
      console.error(err);
    }
  };

  const totalPrice = isSeatBased
    ? (event.price || 0) * selectedSeats.length
    : (event.price || 0) * tickets;

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Hero Banner */}
      <div className="relative">
        {event.bannerUrl ? (
          <div className="relative h-64 md:h-96">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/60 to-transparent" />
          </div>
        ) : (
          <div className={`h-64 md:h-96 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
            </div>
          </div>
        )}

        {/* Back button */}
        <Link
          to="/"
          className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-black/70 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  isSeatBased ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                  isOnline ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {(event.eventType || "general").charAt(0).toUpperCase() + (event.eventType || "general").slice(1)}
                </span>
                {event.category && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/30">
                    {event.category}
                  </span>
                )}
                {isPast && (
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    Past Event
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard icon="📅" label="Date" value={eventDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} />
              <InfoCard icon="🕒" label="Time" value={event.time} />
              <InfoCard icon="📍" label="Venue" value={`${event.location}${event.city ? `, ${event.city}` : ""}`} />
              <InfoCard
                icon="💰"
                label="Price"
                value={event.price && event.price > 0 ? `₹${event.price}` : "Free"}
              />
            </div>

            {/* Description */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">About This Event</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Host Info */}
            {event.createdBy && (
              <div className="bg-[#1a1a2e] rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">Event Organizer</h2>
                <div className="flex items-center gap-4">
                  {event.createdBy.profilePhotoUrl ? (
                    <img
                      src={event.createdBy.profilePhotoUrl}
                      alt={event.createdBy.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                      {event.createdBy.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium text-lg">{event.createdBy.name}</p>
                    <p className="text-gray-400 text-sm capitalize">{event.createdBy.role || "Organizer"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Like / Dislike */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  userLiked
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                    : "bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 hover:text-rose-300"
                }`}
              >
                <svg className="w-5 h-5" fill={userLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {likesCount}
              </button>
              <button
                onClick={handleDislike}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                  userDisliked
                    ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
                    : "bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-blue-500/40 hover:text-blue-300"
                }`}
              >
                <svg className="w-5 h-5" fill={userDisliked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                {dislikesCount}
              </button>
            </div>
          </div>

          {/* Right: Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6 sticky top-24 space-y-5">
              <h3 className="text-lg font-semibold text-white">Book Tickets</h3>

              {/* Capacity Info */}
              {isSeatBased && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Available Seats</span>
                  <span className="text-white font-medium">{availableSeats.length} / {event.totalSeats}</span>
                </div>
              )}
              {(isGeneral || isOnline) && event.totalCapacity && event.totalCapacity > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Spots Left</span>
                  <span className="text-white font-medium">
                    {event.totalCapacity - (event.bookedCount || 0)} / {event.totalCapacity}
                  </span>
                </div>
              )}

              {!isLoggedIn ? (
                <div className="text-center space-y-4 py-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <svg className="w-10 h-10 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-gray-400 text-sm mb-3">Please sign in to book tickets for this event</p>
                    <Link
                      to="/login"
                      className="inline-block w-full py-3 rounded-xl font-semibold text-white text-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all"
                    >
                      Sign In to Book
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Seat Picker */}
                  {isSeatBased && (
                    <div>
                      <button
                        onClick={() => setShowSeatPicker(!showSeatPicker)}
                        className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30"
                      >
                        {showSeatPicker ? "Hide Seat Map" : "🪑 Select Seats"}
                      </button>
                      {showSeatPicker && (
                        <div className="mt-4 p-4 bg-[#0f0f1a] rounded-lg border border-gray-700">
                          <div className="text-center mb-3">
                            <div className="w-3/4 mx-auto h-2 bg-gray-600 rounded-full mb-1" />
                            <p className="text-xs text-gray-500">SCREEN</p>
                          </div>
                          <p className="text-xs text-gray-400 mb-3">
                            Selected: {selectedSeats.length} / 6 max
                          </p>
                          <div className="grid grid-cols-8 gap-1.5">
                            {Array.from({ length: event.totalSeats || 0 }, (_, i) => i + 1).map((seat) => {
                              const isAvailable = availableSeats.includes(seat);
                              const isSelected = selectedSeats.includes(seat);
                              return (
                                <button
                                  key={seat}
                                  onClick={() => isAvailable && toggleSeat(seat)}
                                  disabled={!isAvailable}
                                  className={`aspect-square rounded text-xs font-mono cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                      : isAvailable
                                      ? "bg-[#1a1a2e] border border-gray-600 text-gray-300 hover:border-rose-500/50 hover:bg-rose-500/10"
                                      : "bg-gray-800 text-gray-600 cursor-not-allowed"
                                  }`}
                                >
                                  {seat}
                                </button>
                              );
                            })}
                          </div>
                          {/* Legend */}
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a1a2e] border border-gray-600 inline-block" /> Available</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Selected</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800 inline-block" /> Booked</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ticket Selector */}
                  {!isSeatBased && (
                    <div>
                      <label className="text-sm text-gray-400 block mb-2">Number of Tickets</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setTickets(Math.max(1, tickets - 1))}
                          className="w-10 h-10 rounded-lg bg-[#0f0f1a] border border-gray-700 text-white flex items-center justify-center cursor-pointer hover:border-rose-500/50 transition-colors text-lg"
                        >
                          −
                        </button>
                        <span className="text-2xl font-bold text-white w-10 text-center">{tickets}</span>
                        <button
                          onClick={() => setTickets(Math.min(6, tickets + 1))}
                          className="w-10 h-10 rounded-lg bg-[#0f0f1a] border border-gray-700 text-white flex items-center justify-center cursor-pointer hover:border-rose-500/50 transition-colors text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">
                        {isSeatBased
                          ? `${selectedSeats.length} seat(s) × ₹${event.price || 0}`
                          : `${tickets} ticket(s) × ₹${event.price || 0}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-lg">Total</span>
                      <span className="text-rose-400 font-bold text-2xl">
                        {totalPrice > 0 ? `₹${totalPrice}` : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || isPast}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white text-lg cursor-pointer transition-all ${
                      isPast
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
                    } disabled:opacity-50`}
                  >
                    {bookingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Booking...
                      </span>
                    ) : isPast ? (
                      "Event Ended"
                    ) : isSeatBased ? (
                      `Book ${selectedSeats.length} Seat(s)`
                    ) : (
                      "Book Now"
                    )}
                  </button>

                  {/* Message */}
                  {msg && (
                    <p className={`text-sm text-center rounded-lg p-3 ${
                      msg.toLowerCase().includes("success") || msg.toLowerCase().includes("successful")
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}>
                      {msg}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
};

/* Reusable info card */
const InfoCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
    <span className="text-2xl">{icon}</span>
    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</p>
    <p className="text-white text-sm font-medium mt-0.5">{value}</p>
  </div>
);

export default EventDetail;

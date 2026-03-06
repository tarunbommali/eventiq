import axios from "axios";
import { Link } from "react-router-dom";
import { BACKEND_URL } from "../utils/constants";

export interface EventType {
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

const EventCard = ({ event, isRecommendation = false }: { event: EventType; isRecommendation?: boolean }) => {
  const logRecommendationClick = async () => {
    if (!isRecommendation) return;
    try {
      await axios.post(`${BACKEND_URL}recommend/log`, { eventId: event._id }, { withCredentials: true });
    } catch { /* Non-critical */ }
  };

  const gradient = getGradient(event.title + (event.category || ""));
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const isSeatBased = event.eventType === "seat";
  const isOnline = event.eventType === "online";
  const spotsLeft = isSeatBased
    ? event.availableSeats?.length || 0
    : (event.totalCapacity || 0) - (event.bookedCount || 0);

  return (
    <Link
      to={`/events/${event._id}`}
      onClick={logRecommendationClick}
      className="group block bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 hover:border-rose-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1"
    >
      {/* Banner / Gradient */}
      <div className="relative h-44 overflow-hidden">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-6xl opacity-20">
              {isOnline ? "\uD83C\uDF10" : isSeatBased ? "\uD83D\uDCBA" : "\uD83C\uDFAA"}
            </span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
            event.price && event.price > 0
              ? "bg-black/50 text-white"
              : "bg-emerald-500/80 text-white"
          }`}>
            {event.price && event.price > 0 ? `\u20B9${event.price}` : "FREE"}
          </span>
        </div>

        {/* Event type badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            isSeatBased ? "bg-purple-500/70 text-white" :
            isOnline ? "bg-blue-500/70 text-white" :
            "bg-emerald-500/70 text-white"
          }`}>
            {(event.eventType || "general").charAt(0).toUpperCase() + (event.eventType || "general").slice(1)}
          </span>
        </div>

        {isPast && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-red-600/80 px-4 py-1 rounded-full">ENDED</span>
          </div>
        )}

        {/* Date overlay */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
          <p className="text-rose-400 text-xs font-bold uppercase">
            {eventDate.toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className="text-white text-lg font-bold leading-tight">
            {eventDate.getDate()}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Category */}
        {event.category && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
            {event.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-white font-semibold text-base line-clamp-2 group-hover:text-rose-400 transition-colors">
          {event.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}{event.city ? `, ${event.city}` : ""}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-gray-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{event.time}</span>
        </div>

        {/* Footer: Likes + Spots */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {event.likes && event.likes.length > 0 && (
              <span className="flex items-center gap-1">{"\u2764\uFE0F"} {event.likes.length}</span>
            )}
          </div>
          {spotsLeft > 0 && !isPast && (
            <span className={`text-xs font-medium ${spotsLeft <= 10 ? "text-amber-400" : "text-gray-400"}`}>
              {spotsLeft <= 10 ? `\uD83D\uDD25 ${spotsLeft} left` : `${spotsLeft} spots`}
            </span>
          )}
        </div>

        {/* Recommendation badge */}
        {isRecommendation && (
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <span>{"\u2728"}</span> AI Recommended
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;

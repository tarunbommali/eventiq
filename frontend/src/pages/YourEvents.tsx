import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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

const YourEvents = () => {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const isAuthorized = user?.role === "organizer" || user?.role === "admin";

  const [hostedEvents, setHostedEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchHostedEvents = async () => {
      try {
        setEventsLoading(true);
        const response = await axios.get(`${BACKEND_URL}events/my-events`, {
          withCredentials: true,
        });
        setHostedEvents(response.data.events);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setEventsLoading(false);
      }
    };
    if (isAuthorized) fetchHostedEvents();
  }, [isAuthorized]);

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
          <p className="text-gray-400 mb-6">Please sign in with an organizer account to view your events.</p>
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
          <p className="text-gray-400 mb-6">Only organizers and admins can view hosted events. Your current role is <span className="text-rose-400 font-medium">{user?.role || "user"}</span>.</p>
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
          Your <span className="text-rose-400">Events</span>
        </h1>
        <p className="text-gray-400 mt-1">Manage your hosted events & track attendees</p>
      </div>

      {/* Hosted Events List */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">All Hosted Events</h2>
        </div>

        {eventsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-[#0f0f1a] rounded-xl p-4 space-y-3">
                <div className="h-4 bg-gray-700/50 rounded w-1/3" />
                <div className="h-3 bg-gray-700/50 rounded w-2/3" />
                <div className="h-3 bg-gray-700/50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : hostedEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3"></p>
            <p className="text-gray-400">No events hosted yet.</p>
            <p className="text-gray-500 text-sm mt-1">
              Head over to <Link to="/events/new" className="text-rose-400 hover:text-rose-300 underline">Host Event</Link> to create your first event!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {hostedEvents.map((event) => {
              const isPast = new Date(event.date) < new Date();
              return (
                <Link
                  key={event._id}
                  to={`/events/mine/${event._id}`}
                  className={`block bg-[#0f0f1a] border rounded-xl p-5 transition-all hover:border-rose-500/50 hover:shadow-md hover:shadow-rose-500/5 ${isPast ? "border-gray-800 opacity-75" : "border-gray-700"}`}
                >
                  {/* Host info */}
                  <div className="flex items-center gap-3 mb-3">
                    {event.createdBy?.profilePhotoUrl ? (
                      <img src={event.createdBy.profilePhotoUrl} alt={event.createdBy.name} className="w-9 h-9 rounded-full object-cover border border-gray-700" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
                        {event.createdBy?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-sm text-gray-400 font-medium">{event.createdBy?.name || "Unknown Host"}</span>
                    {isPast && <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Ended</span>}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white group-hover:text-rose-400 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>

                  {/* Badges */}
                  <div className="flex gap-2 mt-3 flex-wrap">
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
                    {event.price !== undefined && event.price > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                        ₹{event.price}
                      </span>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.location}{event.city ? `  ${event.city}` : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Capacity */}
                  {event.eventType === "seat" && event.totalSeats && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Seats Available</span>
                        <span className="text-gray-300">{event.availableSeats?.length || 0} / {event.totalSeats}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all" style={{ width: `${((event.availableSeats?.length || 0) / event.totalSeats) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  {event.eventType !== "seat" && event.totalCapacity && event.totalCapacity > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Spots Available</span>
                        <span className="text-gray-300">{event.totalCapacity - (event.bookedCount || 0)} / {event.totalCapacity}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${((event.totalCapacity - (event.bookedCount || 0)) / event.totalCapacity) * 100}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Arrow indicator */}
                  <div className="flex items-center justify-end mt-3 text-rose-400 text-sm font-medium">
                    View Details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourEvents;

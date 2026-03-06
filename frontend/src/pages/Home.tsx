/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import EventCard from "../components/EventCard";

const EVENTS_PER_PAGE = 12;

const CATEGORY_PILLS = ["All", "Music", "Tech", "Sports", "Art", "Food", "Comedy", "Workshop", "Conference"];

const Home = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [eventType, setEventType] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      if (eventType) params.append("eventType", eventType);
      params.append("page", String(pageNum));
      params.append("limit", String(EVENTS_PER_PAGE));

      const response = await axios.get(`${BACKEND_URL}events?${params.toString()}`, {
        withCredentials: true,
      });
      setEvents(response.data.events);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages || 1);
        setTotal(response.data.pagination.total || 0);
        setPage(response.data.pagination.page || 1);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}recommend`, {
        withCredentials: true,
      });
      setRecommendations(response.data.events || []);
    } catch {
      console.log("Recommendations not available");
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEvents(1);
    fetchRecommendations();
  }, []);

  // Re-fetch when filters change (reset to page 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchEvents(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, eventType]);

  if (error && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">{error}</p>
          <button onClick={() => fetchEvents(1)} className="text-rose-400 hover:underline cursor-pointer">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Hero / Search Section */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Discover <span className="text-rose-500">Events</span>
          </h1>
          <p className="text-gray-400 text-sm mb-6">Find and book the best events near you</p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#0f0f1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
              />
            </div>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[#0f0f1a] border border-gray-700 text-gray-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="seat">Seat-based</option>
              <option value="general">General</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORY_PILLS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === "All" ? "" : cat.toLowerCase())}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all ${
                  (cat === "All" && !category) || category === cat.toLowerCase()
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                    : "bg-[#1a1a2e] text-gray-400 border border-gray-700 hover:border-rose-500/40 hover:text-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{"\u2728"}</span>
              <h2 className="text-xl font-bold text-white">Recommended for You</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">AI Powered</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.slice(0, 3).map((event: any) => (
                <EventCard key={event._id} event={event} isRecommendation />
              ))}
            </div>
          </section>
        )}

        {/* All Events */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">
              {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Events` : "Upcoming Events"}
            </h2>
            {total > 0 && (
              <span className="text-sm text-gray-500">
                {(page - 1) * EVENTS_PER_PAGE + 1}--{Math.min(page * EVENTS_PER_PAGE, total)} of {total}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a2e] rounded-xl overflow-hidden border border-gray-800 animate-pulse">
                  <div className="h-44 bg-gray-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-800 rounded w-2/3" />
                    <div className="h-3 bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">{"\uD83C\uDFAD"}</p>
              <p className="text-gray-400 text-lg">No events found</p>
              <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 mb-6">
            <button
              onClick={() => { setPage(1); fetchEvents(1); }}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 cursor-pointer transition-colors"
            >
              {"\u00AB"}
            </button>
            <button
              onClick={() => { const p = page - 1; setPage(p); fetchEvents(p); }}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-30 bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 cursor-pointer transition-colors"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-600">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => { setPage(item as number); fetchEvents(item as number); }}
                    className={`px-3.5 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                      page === item
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25 border border-rose-500"
                        : "bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() => { const p = page + 1; setPage(p); fetchEvents(p); }}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-30 bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 cursor-pointer transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => { setPage(totalPages); fetchEvents(totalPages); }}
              disabled={page === totalPages}
              className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 cursor-pointer transition-colors"
            >
              {"\u00BB"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

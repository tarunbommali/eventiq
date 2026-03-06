const Footer = () => {
  return (
    <footer className="bg-[#1a1a2e] border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
              <span className="text-rose-500">Event</span>IQ
            </h3>
            <p className="text-gray-400 text-sm">
              Intelligent event booking with AI-powered recommendations and distributed seat locking.
            </p>
          </div>
          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-rose-400 transition-colors">Browse Events</a></li>
              <li><a href="/bookings" className="hover:text-rose-400 transition-colors">My Bookings</a></li>
              <li><a href="/profile" className="hover:text-rose-400 transition-colors">Profile</a></li>
            </ul>
          </div>
          {/* Tech */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {["React", "Node.js", "MongoDB", "Redis", "FastAPI", "Docker"].map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#0f0f1a] text-gray-400 border border-gray-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-4 text-center text-sm text-gray-500">
          EventIQ &copy; {new Date().getFullYear()} | Built by Tarun
        </div>
      </div>
    </footer>
  );
};

export default Footer;

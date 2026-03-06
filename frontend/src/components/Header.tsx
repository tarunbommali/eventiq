/* eslint-disable @typescript-eslint/no-unused-vars */
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Header = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
          active
            ? "text-rose-400"
            : "text-gray-300 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-[#1a1a2e] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
              EQ
            </div>
            <span className="text-white text-lg font-bold tracking-wide">
              Event<span className="text-rose-400">IQ</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLink("/", "Home")}
            {navLink("/bookings", "My Bookings")}
            {(user?.role === "organizer" || user?.role === "admin") && (
              <>
                {navLink("/events/new", "Host Event")}
                {navLink("/events/mine", "Your Events")}
              </>
            )}

            {isLoggedIn ? (
              <>
                {navLink("/profile", "Profile")}
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-1.5 text-sm rounded-full border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="ml-2 px-5 py-1.5 text-sm rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#16213e] border-t border-gray-700 px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLink("/", "Home")}
          {navLink("/bookings", "My Bookings")}
          {(user?.role === "organizer" || user?.role === "admin") && (
            <>
              {navLink("/events/new", "Host Event")}
              {navLink("/events/mine", "Your Events")}
            </>
          )}
          {isLoggedIn ? (
            <>
              {navLink("/profile", "Profile")}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="mt-2 px-4 py-2 text-sm rounded-full border border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 px-4 py-2 text-sm rounded-full bg-rose-500 text-white text-center hover:bg-rose-600 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Header;

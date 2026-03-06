import { Link } from "react-router-dom";

const ErrorPage = () => {
  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-rose-500 mb-4">404</h1>
        <p className="text-2xl text-white font-semibold mb-2">Page Not Found</p>
        <p className="text-gray-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-500/25"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
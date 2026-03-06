/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateLogin, validateSignup } from "../utils/validation";
import type { FieldError } from "../utils/validation";

type FormData = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
};

const Login = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
  });

  const [isLogin, setIsLogin] = useState(true);
  const [errors, setErrors] = useState<FieldError>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const validate = (): FieldError => {
    if (isLogin) {
      return validateLogin(formData.email, formData.password);
    }
    return validateSignup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setMessage("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        setMessage("Login successful!");
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          password: formData.password,
          role: formData.role,
        });
        setMessage("Signup successful!");
        setIsLogin(true);
      }

      setFormData({ name: "", email: "", password: "", phone: "", role: "user" });
      setTimeout(() => navigate("/"), 1000);
    } catch (err: any) {
      if (err.response && err.response.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
      errors[field]
        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
        : "border-gray-700 focus:border-rose-500/50 focus:ring-rose-500/30"
    }`;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold">
              <span className="text-rose-500">Event</span>
              <span className="text-white">IQ</span>
            </h1>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Intelligent event booking with AI-powered recommendations
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter your name"
                  className={inputClass("name")}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email"
                className={inputClass("email")}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter your password"
                className={inputClass("password")}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className={inputClass("phone")}
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">I want to</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-gray-700 text-gray-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
                  >
                    <option value="user">Book Events (User)</option>
                    <option value="organizer">Host Events (Organizer)</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
                setErrors({});
              }}
              className="text-sm text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 text-center text-sm rounded-xl p-3 ${
            message.toLowerCase().includes("successful")
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;

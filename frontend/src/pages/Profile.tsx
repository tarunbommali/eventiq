import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateProfileEdit } from "../utils/validation";
import type { FieldError } from "../utils/validation";

const Profile = () => {
  const { user, setUser, isLoggedIn, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || "", phoneNumber: user?.phoneNumber || "" });
  const [formErrors, setFormErrors] = useState<FieldError>({});
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const navigate = useNavigate();

  // Redirect to login if not authenticated (avoids calling navigate during render)
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [authLoading, isLoggedIn, navigate]);

  if (!authLoading && !isLoggedIn) {
    return null;
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataUpload = new FormData();
    formDataUpload.append("profilePhoto", file);
    try {
      setUploading(true);
      setMessage("");
      const response = await axios.post(`${BACKEND_URL}upload/profile-photo`, formDataUpload, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => prev ? { ...prev, profilePhotoUrl: response.data.profilePhotoUrl } : prev);
      setMessage("Profile photo updated!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload profile photo");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const validationErrors = validateProfileEdit(formData);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    setFormErrors({});
    try {
      const response = await axios.patch(`${BACKEND_URL}profile`, formData, { withCredentials: true });
      setUser(response.data.user);
      setMessage("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-lg bg-[#0f0f1a] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
      formErrors[field]
        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
        : "border-gray-700 focus:border-rose-500/50 focus:ring-rose-500/30"
    }`;

  return (
    <div className="min-h-screen bg-[#0f0f1a] py-8">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-6">Your Profile</h1>

        {message && (
          <div className={`mb-4 text-sm rounded-xl p-3 text-center ${
            message.toLowerCase().includes("updated") || message.toLowerCase().includes("added") || message.toLowerCase().includes("removed")
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}>
            {message}
          </div>
        )}

        {/* Photo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            {user?.profilePhotoUrl ? (
              <img
                src={user.profilePhotoUrl}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-3 border-rose-500/40"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <label className="mt-3 cursor-pointer px-5 py-2 rounded-xl text-sm font-medium bg-[#1a1a2e] border border-gray-700 text-gray-300 hover:border-rose-500/40 hover:text-rose-300 transition-all">
            {uploading ? "Uploading..." : "Change Photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* Profile Card */}
        <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6">
          {!isEditing ? (
            <div className="space-y-4">
              <ProfileField label="Name" value={user?.name} />
              <ProfileField label="Email" value={user?.email} />
              <ProfileField label="Phone" value={user?.phoneNumber} />
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Role</span>
                <div className="mt-1">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                    user?.role === "organizer" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                    user?.role === "admin" ? "bg-red-500/20 text-red-300 border-red-500/30" :
                    "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}>
                    {user?.role || "user"}
                  </span>
                </div>
              </div>

              {/* Preferred Categories */}
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Preferred Categories</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user?.preferredCategories && user.preferredCategories.length > 0 ? (
                    user.preferredCategories.map((cat, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600/30 flex items-center gap-1.5">
                        {cat}
                        <button
                          onClick={async () => {
                            const updated = user.preferredCategories!.filter((_, idx) => idx !== i);
                            try {
                              const res = await axios.patch(`${BACKEND_URL}profile`, { preferredCategories: updated }, { withCredentials: true });
                              setUser(res.data.user);
                              setMessage("Category removed");
                            } catch { setMessage("Failed to remove"); }
                          }}
                          className="text-gray-500 hover:text-red-400 cursor-pointer transition-colors"
                        >{"\u00D7"}</button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-600">None set</p>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Music, Tech..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0f0f1a] border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-rose-500/50"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newCategory.trim()) {
                        e.preventDefault();
                        const updated = [...(user?.preferredCategories || []), newCategory.trim()];
                        try {
                          const res = await axios.patch(`${BACKEND_URL}profile`, { preferredCategories: updated }, { withCredentials: true });
                          setUser(res.data.user);
                          setNewCategory("");
                          setMessage("Category added");
                        } catch { setMessage("Failed to add"); }
                      }
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!newCategory.trim()) return;
                      const updated = [...(user?.preferredCategories || []), newCategory.trim()];
                      try {
                        const res = await axios.patch(`${BACKEND_URL}profile`, { preferredCategories: updated }, { withCredentials: true });
                        setUser(res.data.user);
                        setNewCategory("");
                        setMessage("Category added");
                      } catch { setMessage("Failed to add"); }
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer transition-colors"
                  >Add</button>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/25 cursor-pointer transition-all"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors((p) => { const n = { ...p }; delete n.name; return n; });
                  }}
                  className={inputClass("name")}
                  required
                />
                {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f0f1a] border border-gray-800 text-gray-600 cursor-not-allowed"
                />
                <span className="text-xs text-gray-600 mt-1">Cannot be changed</span>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, phoneNumber: e.target.value });
                    if (formErrors.phoneNumber) setFormErrors((p) => { const n = { ...p }; delete n.phoneNumber; return n; });
                  }}
                  className={inputClass("phoneNumber")}
                  required
                />
                {formErrors.phoneNumber && <p className="text-red-400 text-xs mt-1">{formErrors.phoneNumber}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 cursor-pointer transition-all"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user?.name || "", phoneNumber: user?.phoneNumber || "" });
                    setMessage("");
                    setFormErrors({});
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-[#0f0f1a] border border-gray-700 text-gray-300 hover:border-gray-600 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
    <p className="text-white mt-0.5">{value || "-"}</p>
  </div>
);

export default Profile;

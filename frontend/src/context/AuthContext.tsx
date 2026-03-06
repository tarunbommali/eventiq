import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { BACKEND_URL } from "../utils/constants";

export interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  role: string;
  preferredCategories?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}me`, {
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await axios.post(
      `${BACKEND_URL}login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(res.data.user);
  };

  const signup = async (data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: string;
  }) => {
    await axios.post(`${BACKEND_URL}signup`, data);
  };

  const logout = async () => {
    await axios.post(`${BACKEND_URL}logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";
import axios from "axios";

axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

// ✅ Proper hook with return
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const response = await api.get("/user/profile");
        setUser(response.data.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/signin", { email, password });
    if (response.data.success) {
      setUser(response.data.data.user);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      
      await api.get("/auth/signout");
      setUser(null);
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const value = { user, loading, login, logout, setUser };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

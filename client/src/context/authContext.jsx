import { createContext, useState, useEffect, useContext } from "react";
import api, { setAccessToken as setGlobalToken } from "../api/axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setLocalAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAccessToken = (token) => {
    setLocalAccessToken(token);
    setGlobalToken(token);
  };

  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      setLocalAccessToken(e.detail);
    };
    const handleAuthFailed = () => {
      setLocalAccessToken(null);
      setUser(null);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('authFailed', handleAuthFailed);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('authFailed', handleAuthFailed);
    };
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const refreshResponse = await api.post("/auth/refresh");
        if (refreshResponse.data.success) {
          const token = refreshResponse.data.data.accessToken;
          setAccessToken(token);
          
          const profileResponse = await api.get("/user/profile");
          setUser(profileResponse.data.data.user);
        }
      } catch (error) {
        setUser(null);
        setAccessToken(null);
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
      const token = response.data.data.accessToken;
      setAccessToken(token);
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.get("/auth/signout");
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  const value = { user, accessToken, setAccessToken, loading, login, logout, setUser };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authContext";
import { useQueryClient } from "@tanstack/react-query";
const socketUrl = import.meta.env.VITE_SOCKET_URL;

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(socketUrl, {
      withCredentials: true,
      auth: { token: accessToken }
    });

    setSocket(newSocket);

    console.log("🔗 Socket connected for:", user.email);

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket:", newSocket.id);
      // Removed registerUser emit as we handle it on backend now via token
    });

    newSocket.on("newReport", (payload) => {
      console.log("📝 Real-time newReport received, invalidating queries:", payload);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    newSocket.on("reportOverdue", (payload) => {
      console.log("⏰ Real-time reportOverdue received, invalidating queries:", payload);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    newSocket.on("reportUpdated", (payload) => {
      console.log("📝 Real-time reportUpdated received, invalidating queries:", payload);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    });

    newSocket.on("newNotification", (payload) => {
      console.log("🔔 Real-time newNotification received, invalidating queries:", payload);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, accessToken, queryClient]); // Re-run if user or token changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

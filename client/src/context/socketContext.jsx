import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authContext";
import { useQueryClient } from "@tanstack/react-query";
const socketUrl = import.meta.env.VITE_SOCKET_URL;

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null); // use state instead of ref
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const newSocket = io(socketUrl, {
      withCredentials: true,
    });

    setSocket(newSocket);

    console.log("🔗 Socket connected for:", user.email);

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket:", newSocket.id);
      newSocket.emit("registerUser", user._id);
    });

    newSocket.on("reportOverdue", (payload) => {
      console.log("⏰ Real-time reportOverdue received, invalidating queries:", payload);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};


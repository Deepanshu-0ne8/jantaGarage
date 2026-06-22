// server.js
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './database/mongodb.js';
import { CLIENT_URL, PORT } from './config/env.js';
import { initReportWorker } from './workers/reportWorker.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Make io available to other modules if needed via app.get('io') or exported variable
app.set('io', io);
export { io };

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/env.js';
import redis from './database/redis.js';

// Middleware for Socket.io authentication
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token"));
    
    try {
      const exists = await redis.exists(`session:${decoded.sessionId}`);
      if (!exists) {
        return next(new Error("Authentication error: Session revoked or expired"));
      }

      socket.userId = decoded.userId;
      socket.sessionId = decoded.sessionId;
      socket.role = decoded.role;
      next();
    } catch (redisError) {
      console.error("Redis error during socket auth:", redisError);
      return next(new Error("Authentication error: Internal server error"));
    }
  });
});

io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id, 'User:', socket.userId);

  // Automatically join rooms based on verified token
  socket.join(socket.userId);
  socket.join('globalRoom');
  if (socket.role === 'admin') {
    socket.join('adminsRoom');
  }

  socket.on('registerUser', (data) => {
    // Kept for backward compatibility if older clients still emit it
    // We already handled joining rooms above using the verified token
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

// Start server and DB, then init worker
server.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  try {
    await connectDB();
    console.log('✅ MongoDB connected');
    initReportWorker(io); // Start the BullMQ worker (passes io so worker can emit)
  } catch (err) {
    console.error('DB connection error:', err);
  }
});


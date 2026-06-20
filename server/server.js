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

io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('registerUser', (data) => {
    let userId = data;
    let role = null;
    if (typeof data === 'object' && data !== null) {
      userId = data.userId;
      role = data.role;
    }
    if (!userId) return;
    socket.join(userId); // private room named by user id
    socket.join('globalRoom'); // common room for all users
    if (role === 'admin') {
      socket.join('adminsRoom');
    }
    console.log(`Socket ${socket.id} joined private room ${userId} and globalRoom` + (role === 'admin' ? ' and adminsRoom' : ''));
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


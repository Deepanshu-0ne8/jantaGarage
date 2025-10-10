import express from 'express';
import { PORT } from './config/env.js';
import connectDB from './database/mongodb.js';
import authRouter from './routes/auth.routes.js';
import reportRouter from './routes/report.routes.js';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.routes.js';
import cors from 'cors';
import reportRoutes from "./routes/report.routes.js";
const app = express();

app.use(
  cors({    
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true,
  })
);
  
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/user', userRouter);
app.use('/api/v1/reports', reportRouter);
app.use("/api/reports", reportRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    connectDB();
})

export default app;
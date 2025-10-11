// app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import reportRouter from './routes/report.routes.js';
import userRouter from './routes/user.routes.js';
import cors from 'cors';
import reportRoutes from "./routes/report.routes.js";
import { CLIENT_URL } from './config/env.js';

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/reports', reportRouter);
app.use("/api/reports", reportRoutes);


export default app;

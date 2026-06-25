// app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import reportRouter from './routes/report.routes.js';
import userRouter from './routes/user.routes.js';
import reportRoutes from "./routes/report.routes.js";
import { CLIENT_URL } from './config/env.js';
import { transporter } from './utils/transporter.js';

const app = express();
app.set("trust proxy", true);


app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/smtp-test", async (req, res) => {
  try {
    await transporter.verify();
    console.log("SMTP server is working");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/reports', reportRouter);


export default app;

// app.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import reportRouter from './routes/report.routes.js';
import userRouter from './routes/user.routes.js';
import reportRoutes from "./routes/report.routes.js";
import { CLIENT_URL, APP_PASS, USER_MAIL } from './config/env.js';
import nodemailer from "nodemailer";

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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: USER_MAIL,
    pass: APP_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

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

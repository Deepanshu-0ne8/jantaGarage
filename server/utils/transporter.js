import nodemailer from "nodemailer";
import { USER_MAIL, APP_PASS } from "../config/env.js";
export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: USER_MAIL,
    pass: APP_PASS,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});
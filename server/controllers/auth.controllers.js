import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'patidardeepanshu910@gmail.com',
        pass: 'dosv rzwn tchz kifx'
    }
});

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { userName, email, password, role, contact, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error("A user with this email already exists.");
            error.statusCode = 409;
            throw error;
        }

        session.startTransaction();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const user = new User({
            userName,
            email,
            role,
            contact,
            address,
            otp: otp,
            otpExpiry: otpExpiry,
            password: hashedPassword
        });
        await user.save({ session });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP is: ${otp}`
        });

        await session.commitTransaction();

        user.password = undefined;

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        }).json({
            success: true,
            message: "User created successfully, please verify your email using the OTP sent.",
            data: {
                user
            }
        });
    } catch (error) {
        
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        next(error); // Pass errors to your central error handler
    } finally {
        await session.endSession();
    }
};

export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
};

// Resend OTP
export const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: 'patidardeepanshu910@gmail.com',
            to: email,
            subject: 'Resend OTP Verification',
            text: `Your new OTP is: ${otp}`
        });

        res.json({ message: 'OTP resent successfully.' });
    } catch (error) {
        next(error);
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Explicitly select the password field if it's excluded by default in your schema.
        const user = await User.findOne({ email }).select('+password');

        // 2. Use a generic error message to prevent user enumeration attacks.
        if (!user) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            const error = new Error("Invalid credentials");
            error.statusCode = 401;
            throw error;
        }

        if (!user.isVerified) {
            const error = new Error("Please verify your email before signing in.");
            error.statusCode = 403;
            throw error;
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // 3. CRITICAL SECURITY FIX: Remove the password before sending the response.
        user.password = undefined;

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000
        }).json({
            success: true,
            message: "User signed in successfully",
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

export const signOut = async (req, res, next) => {
    try {
        // Use res.clearCookie() for a cleaner, more explicit way to log out.
        res.clearCookie("token").status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

const generateOTP = () => crypto.randomInt(100000, 999999).toString();
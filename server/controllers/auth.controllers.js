import mongoose from "mongoose";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, USER_MAIL } from "../config/env.js";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { io } from "../server.js";
import redis from "../database/redis.js";
import { sendEmail } from "../utils/sendmail.js";

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Helper to force disconnect sockets associated with a session
const disconnectSocketForSession = (sessionId) => {
    if (io) {
        // Iterate over all connected sockets and disconnect if sessionId matches
        io.sockets.sockets.forEach((socket) => {
            if (socket.sessionId === sessionId.toString()) {
                socket.disconnect(true);
            }
        });
    }
};

const disconnectAllSocketsForUser = (userId) => {
    if (io) {
        io.sockets.sockets.forEach((socket) => {
            if (socket.userId === userId.toString()) {
                socket.disconnect(true);
            }
        });
    }
};

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

        // await transporter.sendMail({
        //     from: USER_MAIL,
        //     to: email,
        //     subject: 'OTP Verification',
        //     text: `Your OTP is: ${otp}`
        // });

        await sendEmail(email, "OTP Verification", `<p>Your OTP is: ${otp}</p>`);

        await session.commitTransaction();

        res.json({
            success: true,
            message: "User created successfully, please verify your email using the OTP sent.",
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        next(error);
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

        res.json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (error) {
        next(error);
    }
};

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

        // await transporter.sendMail({
        //     from: USER_MAIL,
        //     to: email,
        //     subject: 'Resend OTP Verification',
        //     text: `Your new OTP is: ${otp}`
        // });

        await sendEmail(email, "Resend OTP Verification", `<p>Your new OTP is: ${otp}</p>`);

        res.json({
            success: true,
            message: 'OTP resent successfully.'
        });
    } catch (error) {
        next(error);
    }
}

export const signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
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

        // Parse device info
        const parser = new UAParser(req.headers["user-agent"]);
        const result = parser.getResult();
        const deviceName = result.device.model || result.os.name || "Unknown Device";

        // Create session
        const session = await Session.create({
            userId: user._id,
            refreshTokenHash: "placeholder", // will update after generating token
            deviceName: `${result.os.name || ''} ${result.os.version || ''}`.trim() || deviceName,
            browser: `${result.browser.name || ''} ${result.browser.version || ''}`.trim(),
            os: result.os.name,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });

        const refreshToken = jwt.sign(
            { userId: user._id, sessionId: session._id },
            JWT_REFRESH_SECRET || JWT_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN || '30d' }
        );

        session.refreshTokenHash = hashToken(refreshToken);
        await session.save();

        // Store in Redis (30 days = 2592000 seconds)
        await redis.set(`session:${session._id}`, 'active', 'EX', 30 * 24 * 60 * 60);

        const accessToken = jwt.sign(
            { userId: user._id, sessionId: session._id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN || '15m' }
        );

        user.password = undefined;

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000
        }).json({
            success: true,
            message: "User signed in successfully",
            data: {
                user,
                accessToken
            }
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    try {
        console.log("req.headers.cookie =", req.headers.cookie);
        console.log("req.cookies =", req.cookies);
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const session = await Session.findById(decoded.sessionId);

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: "Session invalid or expired" });
        }

        const providedTokenHash = hashToken(refreshToken);
        if (session.refreshTokenHash !== providedTokenHash) {
            // Token rotation violation or mismatch
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        // Issue new tokens (Refresh Token Rotation)
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId, sessionId: session._id },
            JWT_REFRESH_SECRET || JWT_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN || '30d' }
        );

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id, sessionId: session._id, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN || '15m' }
        );

        session.refreshTokenHash = hashToken(newRefreshToken);
        session.lastUsedAt = new Date();
        await session.save();

        // Refresh Redis key expiry
        await redis.set(`session:${session._id}`, 'active', 'EX', 30 * 24 * 60 * 60);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 30 * 24 * 60 * 60 * 1000
        }).json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid refresh token', error: error.message });
    }
};

export const signOut = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET || JWT_SECRET);
                const session = await Session.findById(decoded.sessionId);
                if (session) {
                    session.revokedAt = new Date();
                    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Hybrid TTL
                    await session.save();
                    disconnectSocketForSession(session._id);
                    // Remove from Redis
                    await redis.del(`session:${session._id}`);
                }
            } catch (err) {
                // Ignore jwt verify errors on logout
            }
        }

        res.clearCookie("refreshToken").status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const getSessions = async (req, res, next) => {
    try {
        const sessions = await Session.find({ userId: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
            .select("-refreshTokenHash")
            .sort({ lastUsedAt: -1 });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};

export const logoutDevice = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await Session.findOne({ _id: sessionId, userId: req.user._id });

        if (!session) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        session.revokedAt = new Date();
        session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Hybrid TTL
        await session.save();

        disconnectSocketForSession(session._id);
        // Remove from Redis
        await redis.del(`session:${session._id}`);

        res.json({ success: true, message: "Device logged out successfully" });
    } catch (error) {
        next(error);
    }
};

export const logoutAll = async (req, res, next) => {
    try {
        const sessions = await Session.find({ userId: req.user._id, revokedAt: null });

        for (const session of sessions) {
            session.revokedAt = new Date();
            session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Hybrid TTL
            await session.save();
            // Remove from Redis
            await redis.del(`session:${session._id}`);
        }

        disconnectAllSocketsForUser(req.user._id);

        res.clearCookie("refreshToken").json({
            success: true,
            message: "All devices logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};
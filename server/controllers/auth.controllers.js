import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { name, email, password, role, contact, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error("A user with this email already exists.");
            error.statusCode = 409;
            throw error;
        }

        session.startTransaction();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            role,
            contact,
            address,
            password: hashedPassword
        });
        await user.save({ session });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        await session.commitTransaction();

        user.password = undefined;

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000,
        }).json({
            success: true,
            message: "User created successfully",
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
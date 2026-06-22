import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import redis from "../database/redis.js";

export const authorize = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "User is not Authenticated"
            });
        }
        
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User is not Authenticated"
            });
        }

        const decode = jwt.verify(token, JWT_SECRET);
        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "Invalid Token"
            });
        }

        const exists = await redis.exists(`session:${decode.sessionId}`);
        if (!exists) {
            return res.status(401).json({
                success: false,
                message: "Session has been revoked or expired"
            });
        }

        const user = await User.findById(decode.userId).select("-password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }
        req.user = user;
        req.id = decode.userId;
        req.sessionId = decode.sessionId; // Attach sessionId
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
}
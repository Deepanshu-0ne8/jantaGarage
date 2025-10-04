import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authorize = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "User is not Authenticated"
            })
        }
        const decode = jwt.verify(token, JWT_SECRET);
        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "Invalid Token"
            })
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
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
}
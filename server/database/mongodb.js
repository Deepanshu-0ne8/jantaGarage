import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from '../config/env.js';

if(!DB_URI) {
    throw new Error("pls define MONGODB_URI environment variable inside .env.<development/production>.local");
}

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`MongoDB connected successfully in ${NODE_ENV} mode`);
        
    } catch (error) {
        console.error("Error connecting to MongoDB database", error);
        process.exit(1);
    }
}

export default connectDB;
 
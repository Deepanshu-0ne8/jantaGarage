import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/user.model.js';
import { DB_URI } from './config/env.js';

async function run() {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to DB");
        
        const email = 'testadmin@gmail.com';
        let user = await User.findOne({ email });
        if (user) {
            console.log("User already exists, making sure they are verified...");
            user.isVerified = true;
            user.role = 'admin';
            await user.save();
            console.log("Updated existing user:", email);
        } else {
            console.log("Creating new test admin user...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            user = new User({
                userName: 'testadmin',
                email: email,
                password: hashedPassword,
                role: 'admin',
                isVerified: true,
                contact: '1234567890',
                address: '123 Test St'
            });
            await user.save();
            console.log("Created test admin user:", email);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();

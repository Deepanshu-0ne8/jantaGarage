import express from 'express';
import { resendOTP, signIn, signOut, signUp, verifyOTP } from '../controllers/auth.controllers.js';

const authRouter = express.Router();

authRouter.post('/signin', signIn);

authRouter.post('/register', signUp);

authRouter.get('/signout', signOut);

authRouter.post('/resend-otp', resendOTP);

authRouter.post('/verify-otp', verifyOTP);

export default authRouter;
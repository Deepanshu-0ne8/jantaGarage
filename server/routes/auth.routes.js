import express from 'express';
import { resendOTP, signIn, signOut, signUp, verifyOTP, refresh, getSessions, logoutDevice, logoutAll } from '../controllers/auth.controllers.js';
import { authorize } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const authRouter = express.Router();

authRouter.post('/signin', authRateLimiter, signIn);

authRouter.post('/register', authRateLimiter, signUp);

authRouter.post('/refresh', authRateLimiter, refresh);

authRouter.get('/signout', signOut); // Kept GET for backward compatibility if any old links use it, though POST is better

authRouter.post('/resend-otp', resendOTP);

authRouter.post('/verify-otp', verifyOTP);

// Session management routes
authRouter.get('/sessions', authorize, getSessions);

authRouter.delete('/sessions/:sessionId', authorize, logoutDevice);

authRouter.post('/logout-all', authorize, logoutAll);

export default authRouter;
import express from 'express';
import { signIn, signOut, signUp } from '../controllers/auth.controllers.js';

const authRouter = express.Router();

authRouter.post('/signin', signIn);

authRouter.post('/register', signUp);

authRouter.get('/signout', signOut);

export default authRouter;
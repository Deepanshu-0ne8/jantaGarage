import express from 'express';

const authRouter = express.Router();

authRouter.post('/signin', (req, res, next) => { 
    res.send("Sign in route called");
});

authRouter.post('/register', (req, res, next) => { 
    res.send("Register route called");
} );

authRouter.post('/signout', (req, res, next) => { 
    res.send("Sign out route called");
});

export default authRouter;
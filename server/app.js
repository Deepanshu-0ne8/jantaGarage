import express from 'express';
import { PORT } from './config/env.js';
import connectDB from './database/mongodb.js';
import authRouter from './routes/auth.routes.js';
import reportRouter from './routes/report.routes.js';

const app = express();


app.use('/api/v1/auth', authRouter)
app.use('/api/v1/reports', reportRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    connectDB();
})

export default app;
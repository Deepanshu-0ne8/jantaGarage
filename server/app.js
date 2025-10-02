import express from 'express';
import { PORT } from './config/env.js';
import connectDB from './database/mongodb.js';

const app = express();



app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    connectDB();
})

export default app;
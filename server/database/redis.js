import Redis from 'ioredis';
import { connection } from '../config/queue.js';

// Reuse the connection config from bullmq
const redis = new Redis(connection);

redis.on('connect', () => {
  console.log('✅ Connected to Redis for Session Validation');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

export default redis;

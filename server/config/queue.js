import { Queue } from 'bullmq';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS } from './env.js';

const connection = {
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT, 10),
  ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
  ...(REDIS_TLS === 'true' ? { tls: {} } : {})
};

export const reportQueue = new Queue('reportQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for inspection
  },
});

export { connection };

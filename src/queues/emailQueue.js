const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const sendEmail = require('../utils/sendEmail');

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

const emailQueue = new Queue('emailQueue', { connection });

// Initialize the worker to process jobs from emailQueue
const worker = new Worker('emailQueue', async (job) => {
    console.log(`[Worker] Processing email job ${job.id} for ${job.data.email}`);
    try {
        await sendEmail(job.data);
        console.log(`[Worker] Successfully sent email to ${job.data.email}`);
    } catch (error) {
        console.error(`[Worker] Failed to send email to ${job.data.email}:`, error);
        throw error; // Let BullMQ handle retries
    }
}, { connection, concurrency: 5 }); // Process up to 5 emails concurrently

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error: ${err.message}`);
});

module.exports = { emailQueue };

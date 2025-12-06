import cron from 'node-cron';
import ingestionService from './IngestionService.js';

const startIngestionJob = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Triggering daily ingestion...');
        await ingestionService.run();
    });

    console.log('[Scheduler] Ingestion job scheduled (Daily at 00:00).');
};

export default startIngestionJob;

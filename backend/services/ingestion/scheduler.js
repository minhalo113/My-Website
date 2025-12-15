import cron from 'node-cron';
import ingestionService from './IngestionService.js';
import animeBlogService from '../blog/AnimeBlogService.js';

const startIngestionJob = () => {

    cron.schedule('0 0 * * *', async () => {
        console.log('[Scheduler] Triggering daily ingestion...');
        await ingestionService.run();
    });

    cron.schedule('0 9 * * *', async () => {
        console.log('[Scheduler] Triggering automated anime blog generation...');
        await animeBlogService.createBlogPost();
    });

    console.log('[Scheduler] Ingestion job scheduled (Daily at 00:00).');
    console.log('[Scheduler] Anime blog generation scheduled (Daily at 09:00).');
};

export default startIngestionJob;

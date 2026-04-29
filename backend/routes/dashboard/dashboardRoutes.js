import express from 'express'
import dashboardController from '../../controllers/dashbaord/dashboardController.js'
import authMiddleware from './../../middlewares/authMiddleware.js';

const dashboardRouter = express.Router();

dashboardRouter.get('/admin/dashboard-data', authMiddleware, dashboardController.admin_dashboard_data);
dashboardRouter.post('/admin/trigger-social-post', authMiddleware, dashboardController.trigger_social_post);
export default dashboardRouter;

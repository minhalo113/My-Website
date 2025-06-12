import express from 'express';
import contactController from '../../controllers/home/contactController.js';

const contactRouter = express.Router();

contactRouter.post('/contact', contactController.send_contact);

export default contactRouter;
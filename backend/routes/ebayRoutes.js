import ebayController from "../controllers/ebayController.js";
import express from "express";

const ebayRouter = express.Router();

ebayRouter.get('/ebay/deletion', ebayController.handleDeletionNotification);

export default ebayRouter;

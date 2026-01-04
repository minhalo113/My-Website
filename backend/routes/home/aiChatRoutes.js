import express from "express";
import { handleAiChat } from "../controllers/home/aiChatController.js";

const router = express.Router()
router.post('/ai-chat', handleAiChat)

export default router;

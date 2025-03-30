import authControllers from "../controllers/authControllers.js"
import express from "express"
import authMiddleware from '../middlewares/authMiddleware.js';
const authRouter = express.Router()

authRouter.post("/admin-login", authControllers.admin_login);
// router.get("/get-user", authMiddleware, authControllers.getUser);

export default authRouter;
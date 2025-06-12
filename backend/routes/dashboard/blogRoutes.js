import blogController from "../../controllers/dashbaord/blogController.js";
import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";

const blogRouter = express.Router();

blogRouter.post('/add_blog', authMiddleware, blogController.add_blog);
blogRouter.delete('/delete_blog/:id', authMiddleware, blogController.delete_blog);
blogRouter.get('/get_blog/:id', blogController.get_blog);
blogRouter.get('/get_blogs', blogController.get_blogs);
blogRouter.get('/automate_create_blog', authMiddleware, blogController.automate_create_blog);
blogRouter.patch('/update-blog', authMiddleware, blogController.update_blog);
blogRouter.get('/blog/adjacent/:id', blogController.get_adjacent_blog)
blogRouter.get('/recent-blogs', blogController.get_recent_blogs);

export default blogRouter;
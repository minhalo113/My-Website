import blogController from "../../controllers/dashbaord/blogController.js";
import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";

const blogRouter = express.Router();

blogRouter.post('/add_blog', authMiddleware, blogController.add_blog);
blogRouter.delete('/delete_blog/:id', authMiddleware, blogController.delete_blog);
blogRouter.get('/get_blog/:id', blogController.get_blog);
blogRouter.get('/get_blogs', blogController.get_blogs);
blogRouter.post('/automate_create_blog', authMiddleware, blogController.automate_create_blog);
blogRouter.patch('/update-blog', authMiddleware, blogController.update_blog);
blogRouter.get('/blog/adjacent/:id', blogController.get_adjacent_blog)
blogRouter.get('/recent-blogs', blogController.get_recent_blogs);
blogRouter.post('/blog/:id/comments', blogController.add_comment);
blogRouter.get('/blog/:id/comments', blogController.get_public_comments);
blogRouter.get('/blog/:id/comments/manage', authMiddleware, blogController.get_admin_comments);
blogRouter.patch('/blog/:blogId/comments/:commentId', authMiddleware, blogController.update_comment);
blogRouter.delete('/blog/:blogId/comments/:commentId', authMiddleware, blogController.delete_comment);

blogRouter.get('/get_admin_blogs', authMiddleware, blogController.get_admin_blogs);
blogRouter.get('/get_admin_blog/:id', authMiddleware, blogController.get_admin_blog);
blogRouter.patch('/update_blog_status', authMiddleware, blogController.update_blog_status);
blogRouter.post('/generate-anime-blog', authMiddleware, blogController.generate_anime_blog);

export default blogRouter;
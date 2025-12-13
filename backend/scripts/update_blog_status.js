import blogModel from "../models/blogModel.js";
import dbConnect from "../utils/db.js";

const updateBlogStatus = async () => {
    try {
        await dbConnect();
        console.log("Connected to database...");

        const result = await blogModel.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'approved' } }
        );

        console.log(`Updated ${result.modifiedCount} blogs to 'approved' status.`);
        process.exit(0);
    } catch (error) {
        console.error("Error updating blog status:", error);
        process.exit(1);
    }
};

updateBlogStatus();
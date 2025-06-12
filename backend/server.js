import express from "express"
import {MongoClient} from "mongodb"
import dotenv from "dotenv"
import process from "process"
dotenv.config();

import cors from "cors"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dbConnect from './utils/db.js';

import authRouter from "./routes/authRoutes.js";
import categoryRouter from "./routes/dashboard/categoryRoutes.js"
import productRouter from "./routes/dashboard/productRoutes.js";
import homeRouter from "./routes/home/homeRoutes.js";
import paymentRouter from "./routes/home/paymentRoutes.js";

import paymentController from "./controllers/home/paymentController.js";
import customerAuthControllerRouter from "./routes/home/customerAuthRoutes.js";
import orderRouter from "./routes/orders/orderRoutes.js";
import wishlistRouter from "./routes/home/wishlistRoutes.js";
import blogRouter from "./routes/dashboard/blogRoutes.js";

const PORT = process.env.PORT;

const app = express();

app.post(
    process.env.WEBHOOK_ENDPOINT,              
    express.raw({ type: 'application/json' }),  
    paymentController.handle_webhook,            
  );

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.70:3001'],
    credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.use("/api", authRouter)
app.use("/api", categoryRouter)
app.use("/api", productRouter)
app.use("/api", homeRouter)
app.use("/api", paymentRouter)
app.use("/api", customerAuthControllerRouter)
app.use('/api', orderRouter)
app.use('/api', wishlistRouter)
app.use('/api', blogRouter)

app.get("/", (req, res) => res.send("My backend"))
dbConnect()
app.listen(PORT, () => {
    console.log("Server is running");
})
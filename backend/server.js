import express from "express"
import dotenv from "dotenv"
import process from "process"
dotenv.config();
import http from 'http'
import {initSocket} from './socket.js'

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
import contactRouter from "./routes/home/contactRoutes.js";
import couponRouter from './routes/dashboard/couponRoutes.js';
import homeSwiperRouter from './routes/dashboard/homeSwiperRoutes.js';

const PORT = process.env.PORT || 8080;
const DASHBOARD_URL = process.env.DASHBOARD_URL
const WEB_URL = process.env.WEB_URL
const GIT_WEB_URL = process.env.GIT_WEB_URL

const app = express();

app.post(
    process.env.WEBHOOK_ENDPOINT,              
    express.raw({ type: 'application/json' }),  
    paymentController.handle_webhook,            
  );

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.1.70:3001', DASHBOARD_URL, WEB_URL, GIT_WEB_URL],
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
app.use('/api', contactRouter);
app.use('/api', couponRouter);
app.use('/api', homeSwiperRouter);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get("/", (req, res) => res.send("My backend"))
dbConnect()

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
    console.log("Server is running")
})

// app.listen(PORT, () => {
//     console.log("Server is running");
// })
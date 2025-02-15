import express from "express"
import {MongoClient} from "mongodb"
import dotenv from "dotenv"
import process from "process"
dotenv.config();

import cors from "cors"
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dbConnect from './utils/db.js';
import router from "./routes/authRoutes.js";

const PORT = process.env.PORT;
const CONNECTURI = process.env.CONNECTURI;
const DATABASENAME = process.env.DATABASENAME;

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.use("/api", router)

app.get("/", (req, res) => res.send("My backend"))
dbConnect()
app.listen(PORT, () => {
    console.log("Server is running");
})
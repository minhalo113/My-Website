import axios from "axios"
import dotenv from "dotenv"
import process from "process"
dotenv.config();

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api"
})
export default api
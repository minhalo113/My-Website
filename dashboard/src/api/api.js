import axios from "axios"
const API_CALL = process.env.API_CALL

const api = axios.create({
    baseURL: API_CALL
})
export default api
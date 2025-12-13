import axios from "axios"

const api = axios.create({
    baseURL: "https://api.afigureaday.com/api"
})
export default api
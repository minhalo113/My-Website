import axios from "axios"

const api = axios.create({
    baseURL: "https://api.ahistoryfactaday.org/api"
})
export default api
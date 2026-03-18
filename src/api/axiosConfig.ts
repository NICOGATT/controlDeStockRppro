import axios from "axios"; 

const api = axios.create({
    baseURL : "http://192.168.0.23:3000", 
    timeout : 10000,
    headers: {
        "Content-Type": "application/json",
    }
})

console.log("AXIOS BASE URL:", api.defaults.baseURL)

export default api; 

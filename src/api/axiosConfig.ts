import axios from "axios"; 

const api = axios.create({
    baseURL : "https://unprotracted-russ-unnarrative.ngrok-free.dev", 
    timeout : 10000,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning" : true
    }
})

console.log("AXIOS BASE URL:", api.defaults.baseURL)

export default api; 

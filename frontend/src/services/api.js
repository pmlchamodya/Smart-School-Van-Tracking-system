import axios from "axios";

// Replace <YOUR_IP_ADDRESS> with your computer's local IP address
const BASE_URL = "http://192.168.1.3:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace <YOUR_IP_ADDRESS> with your computer's local IP address
const BASE_URL = "http://192.168.1.3:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// This code runs before every request to add the Token
api.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = await AsyncStorage.getItem("userToken");

    // If token exists, add it to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

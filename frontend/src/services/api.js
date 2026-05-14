import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// your computer's local IP address
//const BASE_URL = "http://192.168.1.3:5000/api";
//const BASE_URL = "http://172.20.10.2:5000/api";
//const BASE_URL = "http://192.168.1.6:5000/api";
//const BASE_URL = "http://10.16.139.205:5000/api";
const BASE_URL = "http://192.168.1.5:5000/api";
//const BASE_URL = "http://10.16.128.110:5000/api";
//const BASE_URL = "http://10.16.193.244:5000/api";

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
  },
);

// --- NEW: Function to get the direct FCM Device Token ---
export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    try {
      // Get the Expo Push Token directly (this is the FCM token for Android and APNs token for iOS)
      const tokenResponse = await Notifications.getDevicePushTokenAsync();
      token = tokenResponse.data;
      console.log("FCM Device Push Token:", token);
    } catch (e) {
      console.log("Error getting push token:", e);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
};

export default api;

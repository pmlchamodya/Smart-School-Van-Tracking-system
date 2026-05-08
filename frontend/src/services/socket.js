import { io } from "socket.io-client";

// Your exact computer IP
//const SOCKET_URL = "http://192.168.1.3:5000";
//const SOCKET_URL = "http://192.168.1.100:5000";
//const SOCKET_URL = "http://172.20.10.2:5000";
const SOCKET_URL = "http://192.168.1.6:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

// --- NEW: Connection Logs for Debugging ---
socket.on("connect", () => {
  console.log("✅ FRONTEND SOCKET CONNECTED! ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("❌ FRONTEND SOCKET ERROR:", error.message);
});

export default socket;

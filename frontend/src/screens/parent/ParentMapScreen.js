import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

// --- SOCKET CONNECTION ---
// THIS IP WITH YOUR PC'S LOCAL IP ADDRESS
// const socket = io("http://192.168.1.3:5000", {
//   transports: ["websocket"],
// });
const socket = io("http://10.16.139.205:5000", {
  transports: ["websocket"],
});

const ParentMapScreen = ({ navigation }) => {
  // --- State Variables ---
  const [region, setRegion] = useState({
    latitude: 6.9271, // Default: Colombo
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Waiting for driver...");

  // --- Setup Real-time Tracking ---
  useEffect(() => {
    let driverId = null;

    const setupTracking = async () => {
      try {
        // 1. Get Parent User ID
        const userId = await AsyncStorage.getItem("userId");

        // 2. Fetch Children to find the Driver ID
        const childRes = await api.get(`/children/${userId}`);
        const children = childRes.data;

        // Check if any child has a driver assigned
        // (Assuming first child's driver for now)
        if (children.length > 0 && children[0].driver_id) {
          driverId = children[0].driver_id;
          console.log("Tracking Driver ID:", driverId);
          setStatus("Connected to Driver");

          // 3. Listen to Socket Event for this Driver
          socket.on(`receiveLocation_${driverId}`, (data) => {
            console.log("New Location Received:", data);

            // Animate map to new location
            setRegion({
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
            setLoading(false);
            setStatus("Live Tracking Active");
          });
        } else {
          setLoading(false);
          setStatus("No Driver Assigned");
          Alert.alert(
            "Notice",
            "No driver is currently assigned to your child.",
          );
        }
      } catch (error) {
        console.log("Error setup tracking:", error);
        setLoading(false);
      }
    };

    setupTracking();

    // Cleanup when leaving screen
    return () => {
      if (driverId) {
        socket.off(`receiveLocation_${driverId}`);
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region}>
        {/* Driver/Van Marker */}
        <Marker
          coordinate={region}
          title="School Van"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
            <MaterialCommunityIcons
              name="van-passenger"
              size={24}
              color="white"
            />
          </View>
        </Marker>
      </MapView>

      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      {/* Van Info Overlay */}
      <View style={styles.infoBox}>
        <Text style={styles.statusText}>Van Status: {status}</Text>
        {loading && (
          <View style={{ flexDirection: "row", marginTop: 5 }}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.timeText}> Waiting for signal...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  infoBox: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statusText: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  timeText: { fontSize: 14, color: "#6B7280" },
});

export default ParentMapScreen;

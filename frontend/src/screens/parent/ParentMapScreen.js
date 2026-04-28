import React, { useState, useEffect, useRef } from "react";
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
import api from "../../services/api";
import socket from "../../services/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ParentMapScreen = ({ navigation }) => {
  // --- Map and Tracking States ---
  const [region, setRegion] = useState({
    latitude: 6.9271, // Default: Colombo
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Separate state specifically for the van's marker
  const [vanLocation, setVanLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Waiting for driver...");
  const [driverId, setDriverId] = useState(null);

  // Reference to the map to allow smooth animations
  const mapRef = useRef(null);

  // --- Step 1: Fetch Driver ID on Component Mount ---
  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const childRes = await api.get(`/children/${userId}`);
        const children = childRes.data;

        // Check if any child has a driver assigned
        if (children.length > 0 && children[0].driver_id) {
          setDriverId(children[0].driver_id);
          setStatus("Connected. Waiting for journey to start...");
        } else {
          setLoading(false);
          setStatus("No Driver Assigned");
          Alert.alert(
            "Notice",
            "No driver is currently assigned to your child.",
          );
        }
      } catch (error) {
        console.error("Error fetching driver:", error);
        setLoading(false);
      }
    };

    fetchDriverDetails();
  }, []);

  // --- Step 2: Setup Socket Listener once Driver ID is found ---
  useEffect(() => {
    // Wait until we actually have a driverId before setting up the listener
    if (!driverId) return;

    console.log("Setting up live tracking for Driver ID:", driverId);

    // Listen for incoming location updates from this specific driver
    socket.on(`receiveLocation_${driverId}`, (data) => {
      console.log("Live Location Received:", data.latitude, data.longitude);

      const newCoordinate = {
        latitude: data.latitude,
        longitude: data.longitude,
      };

      // Update the van's marker position
      setVanLocation(newCoordinate);
      setLoading(false);
      setStatus("Live Tracking Active 🚐");

      // Smoothly animate the map camera to follow the van
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...newCoordinate,
            latitudeDelta: 0.005, // Zoomed in value
            longitudeDelta: 0.005,
          },
          1000,
        ); // 1-second smooth glide animation
      }
    });

    // Listen for journey end signal
    socket.on(`journeyEnded_${driverId}`, () => {
      console.log("Driver ended the journey");
      setVanLocation(null); // Hide the van marker from the map
      setStatus("Journey Ended / Offline");
      setLoading(false);
    });

    // Cleanup listeners when the parent leaves the map screen
    return () => {
      socket.off(`receiveLocation_${driverId}`);
      socket.off(`journeyEnded_${driverId}`);
    };
  }, [driverId]); // This effect re-runs only if the driverId changes

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef} // Attach the map reference
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
      >
        {/* Render the Van Marker ONLY if we have received a valid location */}
        {vanLocation && (
          <Marker
            coordinate={vanLocation}
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
        )}
      </MapView>

      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      {/* Info & Status Overlay */}
      <View style={styles.infoBox}>
        <Text style={styles.statusText}>Status: {status}</Text>

        {/* Show loading indicator while waiting for the first GPS ping */}
        {loading && driverId && (
          <View
            style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}
          >
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.timeText}>
              {" "}
              Waiting for van's GPS signal...
            </Text>
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
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  timeText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 5,
  },
});

export default ParentMapScreen;

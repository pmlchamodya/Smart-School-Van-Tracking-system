import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps"; // Imported Polyline
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import api from "../../services/api";
import socket from "../../services/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ParentMapScreen = ({ navigation }) => {
  // Default map region (Colombo fallback)
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Group children by Driver
  const [uniqueVans, setUniqueVans] = useState([]);
  const [activeVanIndex, setActiveVanIndex] = useState(0);
  const [vanLocations, setVanLocations] = useState({});

  // States for routing
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isRouting, setIsRouting] = useState(false);

  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const activeVan = uniqueVans[activeVanIndex];
  const activeDriverId = activeVan ? String(activeVan.driverId).trim() : null;

  // Step 1: Get Parent's Current Location on Map Load
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("Permission to access location was denied");
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Save parent location for routing
        setUserLocation(location.coords);

        // Center the map to Parent's current location initially
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.log("Error getting parent location:", error);
      }
    };

    getUserLocation();
  }, []);

  // Step 2: Fetch All Children and Group by Driver ID safely
  useEffect(() => {
    const fetchChildrenDetails = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const childRes = await api.get(`/children/${userId}`);
        const children = childRes.data;

        const vansMap = {};
        children.forEach((child) => {
          if (child.driver_id) {
            // Ensure we extract the exact ID string whether it's an object or a string
            let validDriverId = "";
            if (typeof child.driver_id === "object" && child.driver_id._id) {
              validDriverId = String(child.driver_id._id).trim();
            } else {
              validDriverId = String(child.driver_id).trim();
            }

            if (validDriverId) {
              if (!vansMap[validDriverId]) {
                vansMap[validDriverId] = {
                  driverId: validDriverId,
                  childNames: [child.name],
                };
              } else {
                vansMap[validDriverId].childNames.push(child.name);
              }
            }
          }
        });

        const vansArray = Object.values(vansMap);

        if (vansArray.length > 0) {
          setUniqueVans(vansArray);
        } else {
          setLoading(false);
          Alert.alert(
            "Notice",
            "No drivers currently assigned to your children.",
          );
        }
      } catch (error) {
        console.error("Error fetching children:", error);
        setLoading(false);
      }
    };

    fetchChildrenDetails();
  }, []);

  // Step 3: Setup Socket Listeners
  useEffect(() => {
    if (uniqueVans.length === 0) return;

    uniqueVans.forEach((van) => {
      const safeDriverId = String(van.driverId).trim();
      const socketEventName = `receiveLocation_${safeDriverId}`;

      // Request the last known location from the server immediately upon opening the map
      socket.emit("requestLastLocation", safeDriverId);

      // Listen for incoming live location updates
      socket.on(socketEventName, (data) => {
        setVanLocations((prev) => ({
          ...prev,
          [safeDriverId]: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        }));
        setLoading(false);
      });

      // Listen for journey completion
      socket.on(`journeyEnded_${safeDriverId}`, () => {
        setVanLocations((prev) => ({
          ...prev,
          [safeDriverId]: null,
        }));
        setRouteCoords([]); // Clear route when journey ends
      });
    });

    // Cleanup function to avoid memory leaks
    return () => {
      uniqueVans.forEach((van) => {
        const safeDriverId = String(van.driverId).trim();
        socket.off(`receiveLocation_${safeDriverId}`);
        socket.off(`journeyEnded_${safeDriverId}`);
      });
    };
  }, [uniqueVans]);

  // Step 4: Fetch Route from OSRM API (Just like DriverMapScreen)
  useEffect(() => {
    if (activeDriverId && vanLocations[activeDriverId] && userLocation) {
      const fetchRoute = async () => {
        setIsRouting(true);
        try {
          const startLoc = `${vanLocations[activeDriverId].longitude},${vanLocations[activeDriverId].latitude}`;
          const endLoc = `${userLocation.longitude},${userLocation.latitude}`;

          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startLoc};${endLoc}?geometries=geojson`,
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(
              (coord) => ({
                latitude: coord[1],
                longitude: coord[0],
              }),
            );
            setRouteCoords(coordinates);
          }
        } catch (error) {
          console.error("Failed to fetch route:", error);
        } finally {
          setIsRouting(false);
        }
      };

      // Fetch route every time the van moves
      fetchRoute();
    } else {
      setRouteCoords([]);
    }
  }, [activeVanIndex, vanLocations, activeDriverId, userLocation]);

  // Step 5: Animate Camera smoothly when Driver Location comes in
  useEffect(() => {
    if (activeDriverId && vanLocations[activeDriverId] && mapRef.current) {
      // Small delay to allow the polyline to render before zooming
      setTimeout(() => {
        if (mapRef.current && userLocation) {
          // Fit map to show BOTH the Van and the Parent
          mapRef.current.fitToCoordinates(
            [vanLocations[activeDriverId], userLocation],
            {
              edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
              animated: true,
            },
          );
        }
      }, 500);
    }
  }, [activeVanIndex, vanLocations, activeDriverId, userLocation]);

  // Determine current status message
  let currentStatus = "Loading...";
  if (!activeDriverId) {
    currentStatus = "No Driver Assigned";
  } else if (!vanLocations[activeDriverId]) {
    currentStatus = "Waiting for driver to start journey...";
  } else {
    currentStatus = "Live Tracking Active 🚐";
  }

  return (
    <SafeAreaView style={styles.container}>
      {uniqueVans.length > 1 && (
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15 }}
          >
            {uniqueVans.map((van, index) => (
              <TouchableOpacity
                key={van.driverId}
                onPress={() => setActiveVanIndex(index)}
                style={[
                  styles.tab,
                  activeVanIndex === index
                    ? styles.activeTab
                    : styles.inactiveTab,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeVanIndex === index
                      ? styles.activeTabText
                      : styles.inactiveTabText,
                  ]}
                >
                  {van.childNames.join(" & ")}'s Van
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Render Van Marker */}
        {activeDriverId && vanLocations[activeDriverId] && (
          <Marker
            coordinate={vanLocations[activeDriverId]}
            title={`${activeVan?.childNames.join(" & ")}'s Van`}
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

        {/* Render the Route Polyline from OSRM */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#2563EB"
            lineJoin="round"
          />
        )}
      </MapView>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.statusText}>Status: {currentStatus}</Text>

        {/* Show Route Loading Indicator */}
        {isRouting && (
          <View
            style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}
          >
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.timeText}> Drawing route...</Text>
          </View>
        )}

        {loading && activeDriverId && !vanLocations[activeDriverId] && (
          <View
            style={{ flexDirection: "row", marginTop: 8, alignItems: "center" }}
          >
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.timeText}> Waiting for GPS signal...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  map: { flex: 1 },
  tabContainer: {
    position: "absolute",
    top: 60,
    zIndex: 10,
    width: "100%",
    paddingLeft: 60,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  activeTab: { backgroundColor: "#2563EB" },
  inactiveTab: { backgroundColor: "white" },
  tabText: { fontWeight: "bold", fontSize: 14 },
  activeTabText: { color: "white" },
  inactiveTabText: { color: "#4B5563" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 15,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 20,
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
  statusText: { fontSize: 16, fontWeight: "bold", color: "#1F2937" },
  timeText: { fontSize: 14, color: "#6B7280", marginLeft: 5 },
});

export default ParentMapScreen;

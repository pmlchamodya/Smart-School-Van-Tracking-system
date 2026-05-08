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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import socket from "../../services/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ParentMapScreen = ({ navigation }) => {
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // --- UPDATED: Group children by Driver ---
  const [uniqueVans, setUniqueVans] = useState([]);
  const [activeVanIndex, setActiveVanIndex] = useState(0);
  const [vanLocations, setVanLocations] = useState({});

  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  const activeVan = uniqueVans[activeVanIndex];
  const activeDriverId = activeVan?.driverId;

  // Step 1: Fetch All Children and Group by Driver
  useEffect(() => {
    const fetchChildrenDetails = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const childRes = await api.get(`/children/${userId}`);
        const children = childRes.data;

        // Grouping Logic
        const vansMap = {};
        children.forEach((child) => {
          if (child.driver_id) {
            // Only add if a driver is assigned
            if (!vansMap[child.driver_id]) {
              vansMap[child.driver_id] = {
                driverId: child.driver_id,
                childNames: [child.name],
              };
            } else {
              vansMap[child.driver_id].childNames.push(child.name);
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

  // Step 2: Setup Socket Listeners for unique drivers
  useEffect(() => {
    if (uniqueVans.length === 0) return;

    uniqueVans.forEach((van) => {
      const safeDriverId = String(van.driverId).trim();

      socket.on(`receiveLocation_${safeDriverId}`, (data) => {
        setVanLocations((prev) => ({
          ...prev,
          [safeDriverId]: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        }));
        setLoading(false);
      });

      socket.on(`journeyEnded_${safeDriverId}`, () => {
        setVanLocations((prev) => ({
          ...prev,
          [safeDriverId]: null,
        }));
      });
    });

    return () => {
      uniqueVans.forEach((van) => {
        const safeDriverId = String(van.driverId).trim();
        socket.off(`receiveLocation_${safeDriverId}`);
        socket.off(`journeyEnded_${safeDriverId}`);
      });
    };
  }, [uniqueVans]);

  // Step 3: Animate Camera smoothly
  useEffect(() => {
    if (activeDriverId && vanLocations[activeDriverId] && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...vanLocations[activeDriverId],
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000, // 1-second smooth glide
      );
    }
  }, [activeVanIndex, vanLocations, activeDriverId]);

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
      {/* Show Tabs ONLY if there are multiple unique vans */}
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
      >
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
      </MapView>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.statusText}>Status: {currentStatus}</Text>

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
  activeTab: {
    backgroundColor: "#2563EB",
  },
  inactiveTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  activeTabText: {
    color: "white",
  },
  inactiveTabText: {
    color: "#4B5563",
  },
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

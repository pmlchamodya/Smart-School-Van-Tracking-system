import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";
import io from "socket.io-client";

// --- SOCKET CONNECTION ---
// THIS IP WITH YOUR PC'S LOCAL IP ADDRESS
const socket = io("http://192.168.1.3:5000", {
  //   transports: ["websocket"],
  // });
  //const socket = io("http://10.16.139.205:5000", {
  transports: ["websocket"],
});

const DriverDashboard = ({ navigation }) => {
  // --- State Variables ---
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [vanDetails, setVanDetails] = useState(null);
  const [mobile, setMobile] = useState("");
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Map Region State ---
  const [region, setRegion] = useState({
    latitude: 6.9271, // Default: Colombo
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // --- 1. Get Current Location (Initial Load) ---
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to show your current position.",
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.log("Error getting location:", error);
    }
  };

  // --- 2. Live Tracking Logic (Socket.io) ---
  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      if (isJourneyStarted && driverId) {
        console.log("Starting Live Tracking...");

        // Watch for location changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;

            // Update local map
            setRegion((prev) => ({ ...prev, latitude, longitude }));

            // Emit location to Backend
            console.log("Sending Location:", latitude, longitude);
            socket.emit("sendLocation", {
              driverId: driverId,
              latitude,
              longitude,
            });
          },
        );
      }
    };

    if (isJourneyStarted) {
      startTracking();
    } else {
      // Stop tracking if journey ends
      if (locationSubscription) {
        locationSubscription.remove();
      }
    }

    // Cleanup on unmount
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isJourneyStarted, driverId]);

  // --- Load Driver Data & Students ---
  const loadDriverData = async () => {
    try {
      setLoading(true);
      const id = await AsyncStorage.getItem("userId");

      if (id) {
        setDriverId(id);
        const userRes = await api.get(`/users/profile/${id}`);
        const user = userRes.data;

        if (user) {
          if (!user.vanDetails || !user.vanDetails.vehicleNo) {
            navigation.replace("DriverSetup");
            return;
          }
          setDriverName(user.name);
          setProfileImage(user.profileImage);
          setMobile(user.phoneNumber);
          setVanDetails(user.vanDetails || {});
        }

        const childRes = await api.get(`/children/driver/${id}`);
        setStudents(childRes.data);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDriverData();
      getCurrentLocation();
    }, []),
  );

  // Listen for Live Attendance Updates ---
  useEffect(() => {
    if (driverId) {
      socket.on(`refreshDriver_${driverId}`, () => {
        console.log(
          "Live Update: Parent changed attendance! Fetching new data...",
        );
        loadDriverData();
      });
    }

    return () => {
      if (driverId) {
        socket.off(`refreshDriver_${driverId}`);
      }
    };
  }, [driverId]);

  // --- Toggle Student Status ---
  const toggleStudentStatus = async (childId, currentStatus) => {
    let newStatus =
      currentStatus === "safe"
        ? "in-van"
        : currentStatus === "in-van"
          ? "school"
          : "safe";
    try {
      await api.put(`/children/${childId}`, { status: newStatus });
      setStudents((prev) =>
        prev.map((c) => (c._id === childId ? { ...c, status: newStatus } : c)),
      );
      // Alert.alert("Success", `Status updated to: ${newStatus}`);
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  // --- Toggle Journey ---
  const toggleJourney = () => {
    if (isJourneyStarted) {
      Alert.alert("End Journey", "Are you sure you want to end the journey?", [
        {
          text: "Yes",
          onPress: () => {
            setIsJourneyStarted(false); // Stop tracking
            // Send journey ended signal to backend
            if (driverId) {
              socket.emit("journeyEnded", { driverId: driverId });
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setIsJourneyStarted(true);
      Alert.alert("Journey Started", "Parents have been notified.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-5">
        {/* --- Header Section --- */}
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-gray-500 font-medium text-sm">
              Hello Driver,
            </Text>
            <Text className="text-2xl font-bold text-gray-800">
              {driverName}
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              <Ionicons name="call" size={12} /> {mobile || "No Mobile"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("DriverProfile")}
            className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm"
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} className="w-full h-full" />
            ) : (
              <View className="w-full h-full items-center justify-center bg-green-600">
                <Text className="text-white text-xl font-bold">D</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- LIVE MAP SECTION (Click to expand) --- */}
        <Text className="text-gray-800 font-bold mb-3 text-lg">
          Live Location
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("DriverMap", { initialRegion: region })
          }
          className="h-56 w-full rounded-3xl overflow-hidden mb-6 shadow-md border border-gray-200 bg-gray-200"
        >
          <MapView
            style={{ width: "100%", height: "100%" }}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            showsUserLocation={true}
          >
            <Marker coordinate={region} title="My Current Location">
              <View className="bg-blue-600 p-2 rounded-full border-2 border-white">
                <MaterialCommunityIcons
                  name="van-passenger"
                  size={20}
                  color="white"
                />
              </View>
            </Marker>
          </MapView>
          {/* Click hint overlay */}
          <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-lg">
            <Text className="text-white text-[10px]">Tap to Expand</Text>
          </View>
        </TouchableOpacity>

        {/* --- Vehicle Info Card --- */}
        <View className="bg-blue-900 p-4 rounded-2xl mb-6 flex-row justify-between items-center shadow-md">
          <View>
            <Text className="text-blue-200 text-xs uppercase font-bold">
              Vehicle No
            </Text>
            <Text className="text-white text-xl font-bold">
              {vanDetails?.vehicleNo || "N/A"}
            </Text>
          </View>
          <View className="h-8 w-[1px] bg-blue-700 mx-2"></View>
          <View>
            <Text className="text-blue-200 text-xs uppercase font-bold">
              Seats
            </Text>
            <Text className="text-white text-xl font-bold">
              {vanDetails?.seats || "0"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="van-utility"
            size={40}
            color="white"
            opacity={0.8}
          />
        </View>

        {/* --- Financial / Payments Button --- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("DriverPayments")}
          className="bg-green-600 p-4 rounded-2xl shadow-sm flex-row items-center justify-between mb-6"
        >
          <View className="flex-row items-center">
            <MaterialIcons
              name="account-balance-wallet"
              size={28}
              color="white"
            />
            <View className="ml-3">
              <Text className="text-white font-bold text-lg">
                Manage Payments
              </Text>
              <Text className="text-green-100 text-xs">
                View bills & collect cash
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>

        {/* --- Journey Control Button --- */}
        <TouchableOpacity
          onPress={toggleJourney}
          className={`p-4 rounded-2xl shadow-sm items-center mb-6 ${
            isJourneyStarted ? "bg-red-500" : "bg-blue-600"
          }`}
        >
          <Text className="text-white font-bold text-xl">
            {isJourneyStarted ? "END JOURNEY" : "START JOURNEY"}
          </Text>
        </TouchableOpacity>

        {/* --- Student List --- */}
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Your Students
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : (
          students.map((child) => (
            <View
              key={child._id}
              className={`p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm border-l-4 ${
                child.isAbsent
                  ? "bg-red-50 border-red-500" // Absent Styling
                  : "bg-white border-blue-500" // Normal Styling
              }`}
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-lg font-bold text-gray-800 mr-2">
                    {child.name}
                  </Text>
                  {/* --- NEW: Show Absent Badge if isAbsent is true --- */}
                  {child.isAbsent && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-md border border-red-300">
                      <Text className="text-red-700 font-bold text-xs">
                        🔴 ABSENT
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-gray-500 text-xs">{child.school}</Text>

                {/* --- Status Label --- */}
                {!child.isAbsent ? (
                  <View
                    className={`px-2 py-1 rounded-md mt-2 self-start ${
                      child.status === "in-van"
                        ? "bg-yellow-100"
                        : child.status === "safe"
                          ? "bg-green-100"
                          : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${
                        child.status === "in-van"
                          ? "text-yellow-700"
                          : child.status === "safe"
                            ? "text-green-700"
                            : "text-gray-600"
                      }`}
                    >
                      {child.status}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-red-500 text-xs font-medium mt-2">
                    Will not attend today.
                  </Text>
                )}
              </View>

              {/* --- NEW: Hide Action Button if Absent --- */}
              {!child.isAbsent && (
                <TouchableOpacity
                  onPress={() => toggleStudentStatus(child._id, child.status)}
                  className="bg-blue-100 p-3 rounded-full ml-2"
                >
                  <FontAwesome5
                    name={child.status === "in-van" ? "walking" : "bus"}
                    size={20}
                    color="#2563EB"
                  />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverDashboard;

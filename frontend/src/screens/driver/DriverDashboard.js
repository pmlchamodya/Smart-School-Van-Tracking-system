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
import socket from "../../services/socket";
import { useFocusEffect } from "@react-navigation/native";

// --- NEW: Helper function to calculate GPS distance in meters (Haversine Formula) ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.floor(R * c); // Returns distance in meters
};

const DriverDashboard = ({ navigation }) => {
  // State Variables
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [vanDetails, setVanDetails] = useState(null);
  const [mobile, setMobile] = useState("");
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- NEW: State to track which parents already received the 3-min warning ---
  const [notifiedStudents, setNotifiedStudents] = useState({});

  // Map Region State
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Get Current Location (Initial Load)
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

  // 1. Live Tracking Logic (Socket.io)
  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      if (isJourneyStarted && driverId) {
        console.log("Starting Live Tracking...");

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;

            setRegion((prev) => ({ ...prev, latitude, longitude }));

            socket.emit("sendLocation", {
              driverId: String(driverId).trim(),
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
      if (locationSubscription) locationSubscription.remove();
    }

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isJourneyStarted, driverId]);

  // --- NEW: 2. Smart Proximity Notifications (3-Min Warning) ---
  useEffect(() => {
    // Only check distances if journey is active and we have students
    if (isJourneyStarted && students.length > 0) {
      students.forEach((student) => {
        // Check only students waiting to be picked up
        if (
          !student.isAbsent &&
          student.status === "safe" &&
          student.location
        ) {
          const distanceInMeters = getDistance(
            region.latitude,
            region.longitude,
            student.location.latitude,
            student.location.longitude,
          );

          // If van is within 1000 meters (~1km / ~3 mins) and not yet notified
          if (distanceInMeters <= 1000 && !notifiedStudents[student._id]) {
            console.log(`Sending 3-min warning to ${student.name}'s parent`);

            // Emit push notification to this specific parent
            socket.emit("notify_parent", {
              parentId: student.parent_id,
              title: "Van is arriving soon! ⏰",
              message: `The school van is approx 3 minutes away to pick up ${student.name}. Please get ready!`,
            });

            // Mark this student as notified so we don't spam the parent every 3 seconds
            setNotifiedStudents((prev) => ({ ...prev, [student._id]: true }));
          }
        }
      });
    }
  }, [region, isJourneyStarted, students]); // Runs every time van moves (region updates)

  // Load Driver Data & Students
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

  // Listen for Live Attendance Updates
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
      if (driverId) socket.off(`refreshDriver_${driverId}`);
    };
  }, [driverId]);

  // 3. Toggle Student Status (Picked Up Notification)
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

      // Send Real-time Notification to Parent
      const targetChild = students.find((c) => c._id === childId);
      if (targetChild && targetChild.parent_id) {
        let title = "Status Update";
        let message = `Status changed to ${newStatus}.`;

        if (newStatus === "in-van") {
          title = "Child Picked Up! 🚐";
          message = `${targetChild.name} has safely boarded the van.`;
        } else if (newStatus === "school") {
          title = "Dropped at School! 🏫";
          message = `${targetChild.name} has been dropped off at school.`;
        } else if (newStatus === "safe") {
          title = "Safely Home! 🏡";
          message = `${targetChild.name} has been dropped off at home safely.`;
        }

        socket.emit("notify_parent", {
          parentId: targetChild.parent_id,
          title: title,
          message: message,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  // 4. Toggle Journey (Journey Started Notification)
  const toggleJourney = () => {
    if (isJourneyStarted) {
      Alert.alert("End Journey", "Are you sure you want to end the journey?", [
        {
          text: "Yes",
          onPress: () => {
            setIsJourneyStarted(false);
            setNotifiedStudents({}); // Reset notifications for the next trip
            if (driverId) {
              socket.emit("journeyEnded", { driverId: driverId });
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setIsJourneyStarted(true);
      setNotifiedStudents({}); // Fresh start for notifications

      // --- NEW: Send "Journey Started" notification to ALL waiting parents ---
      students.forEach((student) => {
        if (!student.isAbsent && student.status === "safe") {
          socket.emit("notify_parent", {
            parentId: student.parent_id,
            title: "Driver is on the way! 🚐",
            message: `The school van has started its journey to pick up ${student.name}.`,
          });
        }
      });

      // Force an immediate GPS ping
      if (driverId && region.latitude) {
        socket.emit("sendLocation", {
          driverId: String(driverId).trim(),
          latitude: region.latitude,
          longitude: region.longitude,
        });
      }

      Alert.alert("Journey Started", "All parents have been notified.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-5">
        {/* Header Section */}
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

        {/* LIVE MAP SECTION */}
        <Text className="text-gray-800 font-bold mb-3 text-lg">
          Live Location
        </Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            navigation.navigate("DriverMap", {
              initialRegion: region,
              students: students,
            });
          }}
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
          <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-lg">
            <Text className="text-white text-[10px]">Tap to Expand</Text>
          </View>
        </TouchableOpacity>

        {/* Vehicle Info Card */}
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

        {/* Financial / Payments Button */}
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

        {/* Journey Control Button */}
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

        {/* Student List */}
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
                  ? "bg-red-50 border-red-500"
                  : "bg-white border-blue-500"
              }`}
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-lg font-bold text-gray-800 mr-2">
                    {child.name}
                  </Text>
                  {child.isAbsent && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-md border border-red-300">
                      <Text className="text-red-700 font-bold text-xs">
                        🔴 ABSENT
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-gray-500 text-xs">{child.school}</Text>

                {/* Status Label */}
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

              {/* Action Button */}
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

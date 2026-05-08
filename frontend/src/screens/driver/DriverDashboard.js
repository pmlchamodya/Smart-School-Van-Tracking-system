import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Keyboard,
  Linking,
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

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.floor(R * c);
};

const DriverDashboard = ({ navigation }) => {
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [vanDetails, setVanDetails] = useState(null);
  const [mobile, setMobile] = useState("");
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifiedStudents, setNotifiedStudents] = useState({});

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [customAlertMsg, setCustomAlertMsg] = useState("");

  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

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

  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      if (isJourneyStarted && driverId) {
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

  useEffect(() => {
    if (isJourneyStarted && students.length > 0) {
      students.forEach((student) => {
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

          if (distanceInMeters <= 1000 && !notifiedStudents[student._id]) {
            socket.emit("notify_parent", {
              parentId: student.parent_id?._id || student.parent_id,
              title: "Van is arriving soon! ⏰",
              message: `The school van is approx 3 minutes away to pick up ${student.name}. Please get ready!`,
            });
            setNotifiedStudents((prev) => ({ ...prev, [student._id]: true }));
          }
        }
      });
    }
  }, [region, isJourneyStarted, students]);

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

  useEffect(() => {
    if (driverId) {
      socket.on(`refreshDriver_${driverId}`, () => {
        loadDriverData();
      });
    }
    return () => {
      if (driverId) socket.off(`refreshDriver_${driverId}`);
    };
  }, [driverId]);

  // --- NEW: 4-Step Status Logic (safe -> in-van -> school -> returning -> safe) ---
  const confirmToggleStatus = (child) => {
    let newStatus =
      child.status === "safe"
        ? "in-van"
        : child.status === "in-van"
          ? "school"
          : child.status === "school"
            ? "returning"
            : "safe";

    let statusText =
      newStatus === "in-van"
        ? "Picked Up (Going to School)"
        : newStatus === "school"
          ? "Dropped at School"
          : newStatus === "returning"
            ? "Picked Up (Coming Home)"
            : "Dropped at Home (Safe)";

    Alert.alert(
      "Confirm Status Change",
      `Are you sure you want to mark ${child.name} as '${statusText}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Update",
          onPress: () => toggleStudentStatus(child._id, child.status),
        },
      ],
    );
  };

  const toggleStudentStatus = async (childId, currentStatus) => {
    let newStatus =
      currentStatus === "safe"
        ? "in-van"
        : currentStatus === "in-van"
          ? "school"
          : currentStatus === "school"
            ? "returning"
            : "safe";
    try {
      await api.put(`/children/${childId}`, { status: newStatus });
      setStudents((prev) =>
        prev.map((c) => (c._id === childId ? { ...c, status: newStatus } : c)),
      );

      const targetChild = students.find((c) => c._id === childId);
      if (targetChild && targetChild.parent_id) {
        let title = "Status Update";
        let message = `Status changed to ${newStatus}.`;

        if (newStatus === "in-van") {
          title = "Picked Up! 🚐";
          message = `${targetChild.name} has safely boarded the van.`;
        } else if (newStatus === "school") {
          title = "Dropped at School! 🏫";
          message = `${targetChild.name} has been dropped off at school.`;
        } else if (newStatus === "returning") {
          title = "Picked Up from School! 🚐";
          message = `${targetChild.name} is in the van and coming back home.`;
        } else if (newStatus === "safe") {
          title = "Safely Home! 🏡";
          message = `${targetChild.name} has been dropped off at home safely.`;
        }

        socket.emit("notify_parent", {
          parentId: targetChild.parent_id?._id || targetChild.parent_id,
          title: title,
          message: message,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const toggleJourney = () => {
    if (isJourneyStarted) {
      Alert.alert("End Journey", "Are you sure you want to end the journey?", [
        {
          text: "Yes",
          onPress: () => {
            setIsJourneyStarted(false);
            setNotifiedStudents({});
            if (driverId) {
              socket.emit("journeyEnded", { driverId: driverId });
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setIsJourneyStarted(true);
      setNotifiedStudents({});

      students.forEach((student) => {
        if (!student.isAbsent && student.status === "safe") {
          socket.emit("notify_parent", {
            parentId: student.parent_id?._id || student.parent_id,
            title: "Driver is on the way! 🚐",
            message: `The school van has started its journey to pick up ${student.name}.`,
          });
        }
      });

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

  const sendBroadcastAlert = (message) => {
    Keyboard.dismiss();
    if (!message) {
      Alert.alert("Error", "Please enter or select a message to send.");
      return;
    }

    const uniqueParentIds = [
      ...new Set(students.map((s) => s.parent_id?._id || s.parent_id)),
    ];

    if (uniqueParentIds.length === 0) {
      Alert.alert("No Parents", "You don't have any students assigned yet.");
      return;
    }

    const vehicleTitle = vanDetails?.vehicleNo
      ? ` (Van: ${vanDetails.vehicleNo})`
      : "";

    uniqueParentIds.forEach((parentId) => {
      socket.emit("notify_parent", {
        parentId: parentId,
        title: `🚨 Message from ${driverName}${vehicleTitle}`,
        message: message,
      });
    });

    Alert.alert("Broadcast Sent! 📢", "Message has been sent to all parents.");
    setAlertModalVisible(false);
    setCustomAlertMsg("");
  };

  // --- Calculate Occupancy Logic (Counts BOTH morning 'in-van' and evening 'returning') ---
  const totalSeats = parseInt(vanDetails?.seats) || 0;
  const expectedToday = students.filter((s) => !s.isAbsent).length;
  const currentlyInVan = students.filter(
    (s) => s.status === "in-van" || s.status === "returning",
  ).length;
  const fillPercentage =
    totalSeats > 0 ? (currentlyInVan / totalSeats) * 100 : 0;

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

        {/* Broadcast Emergency Alert Button */}
        <TouchableOpacity
          onPress={() => setAlertModalVisible(true)}
          className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm flex-row items-center justify-between mb-6"
        >
          <View className="flex-row items-center">
            <Ionicons name="warning" size={28} color="#EF4444" />
            <View className="ml-3">
              <Text className="text-red-600 font-bold text-lg">
                Broadcast Alert
              </Text>
              <Text className="text-red-400 text-xs">
                Send urgent message to all parents
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="broadcast" size={24} color="#EF4444" />
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

        {/* Occupancy Tracker UI */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-bold text-gray-800">
              Live Occupancy
            </Text>
            <View className="bg-blue-100 px-2 py-1 rounded-md">
              <Text className="text-blue-700 font-bold text-xs">
                {currentlyInVan} / {totalSeats} Seats Filled
              </Text>
            </View>
          </View>

          <View className="w-full h-3 bg-gray-200 rounded-full my-2 overflow-hidden">
            <View
              className={`h-full ${fillPercentage >= 100 ? "bg-red-500" : "bg-blue-600"}`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-500 text-xs font-medium">
              Expected Today:{" "}
              <Text className="text-gray-800 font-bold">{expectedToday}</Text>
            </Text>
            <Text className="text-gray-500 text-xs font-medium">
              Absent Today:{" "}
              <Text className="text-red-500 font-bold">
                {students.length - expectedToday}
              </Text>
            </Text>
          </View>
        </View>

        {/* Student List */}
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Your Students
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : students.length === 0 ? (
          <View className="items-center py-6">
            <MaterialCommunityIcons
              name="account-group"
              size={40}
              color="#D1D5DB"
            />
            <Text className="text-gray-400 mt-2">
              No students assigned yet.
            </Text>
          </View>
        ) : (
          students.map((child) => (
            <View
              key={child._id}
              className={`p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm border-l-4 ${
                child.isAbsent
                  ? "bg-red-50 border-red-500"
                  : child.status === "in-van" || child.status === "returning"
                    ? "bg-blue-50 border-blue-600"
                    : "bg-white border-gray-300"
              }`}
            >
              <TouchableOpacity
                className="flex-1"
                onPress={() => {
                  navigation.navigate("StudentDetails", { student: child });
                }}
              >
                <View className="flex-row items-center mb-1">
                  <Text className="text-lg font-bold text-gray-800 mr-2">
                    {child.name}
                  </Text>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color="#9CA3AF"
                  />
                </View>

                <Text className="text-gray-500 text-xs mb-1">
                  {child.school}
                </Text>

                {child.isAbsent ? (
                  <View className="bg-red-100 px-2 py-1 rounded-md self-start">
                    <Text className="text-red-700 font-bold text-xs">
                      🔴 ABSENT
                    </Text>
                  </View>
                ) : (
                  <View
                    className={`px-2 py-1 rounded-md self-start ${
                      child.status === "in-van" || child.status === "returning"
                        ? "bg-yellow-100"
                        : child.status === "safe"
                          ? "bg-green-100"
                          : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold capitalize ${
                        child.status === "in-van" ||
                        child.status === "returning"
                          ? "text-yellow-700"
                          : child.status === "safe"
                            ? "text-green-700"
                            : "text-gray-600"
                      }`}
                    >
                      {child.status === "in-van"
                        ? "Going to School"
                        : child.status === "returning"
                          ? "Coming Home"
                          : child.status}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Status Update Toggle Button */}
              {!child.isAbsent && (
                <TouchableOpacity
                  onPress={() => confirmToggleStatus(child)}
                  className={`p-3 rounded-full ml-2 shadow-sm ${
                    child.status === "in-van" || child.status === "returning"
                      ? "bg-white"
                      : "bg-blue-100"
                  }`}
                >
                  <FontAwesome5
                    name={
                      child.status === "in-van" || child.status === "returning"
                        ? "walking"
                        : "bus"
                    }
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

      {/* Broadcast Alert Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
            style={{
              backgroundColor: "white",
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={28} color="#EF4444" />
                <Text className="text-xl font-bold text-gray-800 ml-2">
                  Emergency Alert
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setAlertModalVisible(false);
                }}
              >
                <Ionicons name="close-circle" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-500 text-sm mb-4">
              Select a quick message below or type your own to notify all
              parents instantly.
            </Text>

            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "🚐 Heavy Traffic! I will be delayed by 15-20 minutes.",
                )
              }
              className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-3"
            >
              <Text className="text-orange-800 font-semibold text-sm">
                🚐 Heavy Traffic - Running Late
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "🌧️ Bad Weather! Driving slowly, expect slight delays.",
                )
              }
              className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-3"
            >
              <Text className="text-blue-800 font-semibold text-sm">
                🌧️ Bad Weather - Expect Delays
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "⚠️ Van Breakdown! Please hold on, arranging alternative transport.",
                )
              }
              className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4"
            >
              <Text className="text-red-800 font-semibold text-sm">
                ⚠️ Van Breakdown - Urgent!
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-600 font-bold mb-2 text-xs uppercase">
              Or type custom message:
            </Text>
            <TextInput
              className="bg-gray-100 p-4 rounded-xl text-gray-800 min-h-[80px]"
              placeholder="E.g. Leaving school in 5 mins..."
              multiline
              textAlignVertical="top"
              value={customAlertMsg}
              onChangeText={setCustomAlertMsg}
            />

            <TouchableOpacity
              onPress={() => sendBroadcastAlert(customAlertMsg)}
              className="bg-red-500 p-4 rounded-xl mt-4 items-center flex-row justify-center"
            >
              <Ionicons name="send" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                Send to All Parents
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverDashboard;

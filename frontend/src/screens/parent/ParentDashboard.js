import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import socket from "../../services/socket";
import { useFocusEffect } from "@react-navigation/native";

const ParentDashboard = ({ navigation }) => {
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Socket Listeners for Real-time Foreground Notifications ---
  useEffect(() => {
    const setupSocket = async () => {
      const userId = await AsyncStorage.getItem("userId");

      if (userId) {
        socket.emit("join", userId);
        socket.on("receive_notification", (data) => {
          Alert.alert(data.title, data.message, [
            { text: "Awesome! Thanks 👍" },
          ]);
        });
      }
    };

    setupSocket();
    return () => {
      socket.off("receive_notification");
    };
  }, []);

  // --- Load Data Function ---
  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (userId) {
        const userRes = await api.get(`/users/profile/${userId}`);
        if (userRes.data) {
          setParentName(userRes.data.name);
          setProfileImage(userRes.data.profileImage);
        }

        const childRes = await api.get(`/children/${userId}`);
        setChildren(childRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- Toggle Attendance Function ---
  const toggleAttendance = async (childId, currentIsAbsent) => {
    try {
      await api.put(`/children/attendance/${childId}`, {
        isAbsent: !currentIsAbsent,
      });

      setChildren((prevChildren) =>
        prevChildren.map((child) =>
          child._id === childId
            ? { ...child, isAbsent: !currentIsAbsent }
            : child,
        ),
      );

      const targetChild = children.find((c) => c._id === childId);
      if (targetChild && targetChild.driver_id) {
        socket.emit("attendanceUpdated", { driverId: targetChild.driver_id });
      }
    } catch (error) {
      console.error("Attendance Update Error:", error);
      Alert.alert("Error", "Could not update attendance. Try again.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // --- NEW: Remove Driver ONLY (Keep Child) ---
  const handleRemoveDriver = (child) => {
    Alert.alert(
      "Remove Transport",
      `Are you sure you want to unassign the current school van for ${child.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Unassign",
          style: "destructive",
          onPress: async () => {
            try {
              // We send a PUT request to update the driver_id to null
              await api.put(`/children/${child._id}`, {
                driver_id: null,
                status: "safe", // Reset status back to safe just in case
              });
              Alert.alert(
                "Success",
                "Van removed successfully. You can now select a new van.",
              );
              loadData(); // Refresh list to show "Find Transport" button
            } catch (error) {
              console.error("Error removing driver:", error);
              Alert.alert("Error", "Failed to remove the driver.");
            }
          },
        },
      ],
    );
  };

  // --- Delete Child Completely Logic ---
  const handleDeleteChild = (childId) => {
    Alert.alert(
      "Delete Child",
      "Are you sure you want to entirely remove this child from the system?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/children/${childId}`);
              Alert.alert("Success", "Child removed successfully");
              loadData();
            } catch (error) {
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                Alert.alert("Cannot Remove ❌", error.response.data.message);
              } else {
                console.log(error);
                Alert.alert("Error", "Failed to delete child");
              }
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="p-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* --- Header Section --- */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 font-medium text-sm">
              Welcome Parent,
            </Text>
            <Text className="text-2xl font-bold text-gray-800">
              {parentName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ParentProfile")}
            className="w-12 h-12 rounded-full shadow-md active:bg-gray-200 overflow-hidden"
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-blue-600 items-center justify-center">
                <FontAwesome5 name="user-alt" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Live Tracking Button --- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentMap")}
          className="bg-blue-600 p-5 rounded-2xl shadow-md flex-row items-center justify-center mb-8"
        >
          <View className="bg-blue-500 p-3 rounded-full mr-4">
            <Ionicons name="location-sharp" size={28} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-xl">
              TRACK SCHOOL VAN
            </Text>
            <Text className="text-blue-100 text-sm">
              View live location on map
            </Text>
          </View>
        </TouchableOpacity>

        {/* --- Financial / Payments Button --- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentPayments")}
          className="bg-green-600 p-5 rounded-2xl shadow-md flex-row items-center justify-between mb-8"
        >
          <View className="flex-row items-center">
            <MaterialIcons name="receipt-long" size={28} color="white" />
            <View className="ml-3">
              <Text className="text-white font-bold text-lg">
                My Bills & Payments
              </Text>
              <Text className="text-green-100 text-sm">
                Pay van fees & view receipts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>

        {/* --- My Children Header --- */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">My Children</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddChild")}
            className="flex-row items-center"
          >
            <Ionicons name="add-circle" size={24} color="#2563EB" />
            <Text className="text-blue-600 font-bold ml-1">Add New</Text>
          </TouchableOpacity>
        </View>

        {/* --- Children List --- */}
        {children.length === 0 ? (
          <View className="bg-white p-6 rounded-2xl items-center justify-center mb-6">
            <Text className="text-gray-400">No children added yet.</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddChild")}>
              <Text className="text-blue-500 mt-2 font-bold">
                Add your first child
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child, index) => (
            <View
              key={index}
              className="bg-white p-5 rounded-2xl shadow-sm mb-4 border-l-4 border-blue-500"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-800">
                    {child.name}
                  </Text>
                  <Text className="text-gray-500">
                    {child.school} - {child.grade}
                  </Text>

                  {/* Dynamic Van Status Area */}
                  {child.driver_id ? (
                    <View className="flex-row items-center mt-2">
                      <View className="bg-green-100 px-2 py-1 rounded-md flex-row items-center mr-2">
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="green"
                        />
                        <Text className="text-green-700 font-bold text-xs ml-1">
                          Van Assigned
                        </Text>
                      </View>

                      {/* NEW: Remove Driver Button */}
                      <TouchableOpacity
                        onPress={() => handleRemoveDriver(child)}
                        className="bg-red-50 px-2 py-1 rounded-md flex-row items-center border border-red-100"
                      >
                        <MaterialCommunityIcons
                          name="bus-off"
                          size={14}
                          color="#DC2626"
                        />
                        <Text className="text-red-600 font-bold text-xs ml-1">
                          Remove Van
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("FindDriver", { child: child })
                      }
                      className="bg-orange-100 px-3 py-2 rounded-md self-start mt-2 flex-row items-center"
                    >
                      <MaterialCommunityIcons
                        name="bus-marker"
                        size={16}
                        color="#C2410C"
                      />
                      <Text className="text-orange-700 font-bold text-xs ml-1">
                        Find Transport
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Right Side Action Buttons */}
                <View className="flex-row items-center mt-1">
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("AttendanceReport", {
                        childId: child._id,
                        childName: child.name,
                      })
                    }
                    className="bg-blue-50 p-2 rounded-full mr-3 border border-blue-100"
                  >
                    <Ionicons name="calendar" size={20} color="#2563EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditChild", { child: child })
                    }
                    className="bg-gray-100 p-2 rounded-full mr-3"
                  >
                    <MaterialIcons name="edit" size={20} color="#4B5563" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteChild(child._id)}
                    className="bg-red-50 p-2 rounded-full"
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Attendance Toggle */}
              <TouchableOpacity
                className={`mt-4 py-3 px-4 rounded-xl items-center justify-center border ${
                  child.isAbsent
                    ? "bg-red-50 border-red-300"
                    : "bg-blue-50 border-blue-300"
                }`}
                onPress={() => toggleAttendance(child._id, child.isAbsent)}
              >
                <Text
                  className={`font-bold text-sm ${
                    child.isAbsent ? "text-red-700" : "text-blue-700"
                  }`}
                >
                  {child.isAbsent
                    ? "🔴 Not Going Today (Absent)"
                    : "🟢 Going Today (Present)"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentDashboard;

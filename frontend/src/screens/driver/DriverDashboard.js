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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const DriverDashboard = ({ navigation }) => {
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [vanDetails, setVanDetails] = useState(null);
  const [mobile, setMobile] = useState("");
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Load Data ---
  const loadDriverData = async () => {
    try {
      setLoading(true);
      const id = await AsyncStorage.getItem("userId");

      if (id) {
        setDriverId(id);
        const userRes = await api.get(`/users/profile/${id}`);
        const user = userRes.data;

        if (user) {
          // Safety Check: Redirect to setup if details are missing
          if (!user.vanDetails || !user.vanDetails.vehicleNo) {
            navigation.replace("DriverSetup");
            return;
          }

          setDriverName(user.name);
          setProfileImage(user.profileImage);
          setMobile(user.phoneNumber);
          setVanDetails(user.vanDetails || {});
        }

        // Fetch Students
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
    }, [])
  );

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
        prev.map((c) => (c._id === childId ? { ...c, status: newStatus } : c))
      );
      Alert.alert("Success", `Status updated to: ${newStatus}`);
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  // --- Toggle Journey ---
  const toggleJourney = () => {
    if (isJourneyStarted) {
      Alert.alert("End Journey", "End journey?", [
        { text: "Yes", onPress: () => setIsJourneyStarted(false) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setIsJourneyStarted(true);
      Alert.alert("Journey Started", "Parents notified.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-5">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6">
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

        {/* Journey Control */}
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
              className="bg-white p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm"
            >
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {child.name}
                </Text>
                <Text className="text-gray-500 text-xs">{child.school}</Text>
                <View
                  className={`px-2 py-1 rounded-md mt-1 self-start ${
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
              </View>
              <TouchableOpacity
                onPress={() => toggleStudentStatus(child._id, child.status)}
                className="bg-blue-100 p-3 rounded-full"
              >
                <FontAwesome5
                  name={child.status === "in-van" ? "walking" : "bus"}
                  size={20}
                  color="#2563EB"
                />
              </TouchableOpacity>
            </View>
          ))
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverDashboard;

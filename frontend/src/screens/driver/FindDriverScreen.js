import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "../../services/api";

const FindDriverScreen = ({ route, navigation }) => {
  // We get the specific child data passed from Dashboard
  const { child } = route.params;

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  // --- Fetch Drivers & Smart Filter ---
  const fetchDrivers = async () => {
    try {
      const response = await api.get("/users/drivers/search");
      const allDrivers = response.data;

      // Filter Logic: Must go to the child's school AND have available seats
      const matchingDrivers = allDrivers.filter((driver) => {
        // 1. Check if Driver goes to Child's School (Case Insensitive)
        const hasSchool = driver.routeDetails?.schools?.some((s) =>
          s.toLowerCase().includes(child.school.toLowerCase()),
        );

        // 2. Check if Van is NOT Full
        const hasSeats = !driver.isFull;

        return hasSchool && hasSeats;
      });

      setDrivers(matchingDrivers);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  // --- Assign Driver Logic ---
  const handleSelectDriver = async (driver) => {
    Alert.alert(
      "Confirm Transport",
      `Do you want to assign ${driver.name} for ${child.name}?\n\nVehicle: ${driver.vanDetails?.vehicleNo}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Select",
          onPress: async () => {
            try {
              // Update Child with Driver ID
              await api.put(`/children/${child._id}`, {
                driver_id: driver._id,
                status: "safe",
              });

              Alert.alert("Success", "Driver assigned successfully!");
              navigation.navigate("ParentTabs");
            } catch (error) {
              Alert.alert("Error", "Failed to assign driver.");
            }
          },
        },
      ],
    );
  };

  // --- Render Individual Driver Card ---
  const renderDriverCard = ({ item }) => {
    // Dynamic logic for seat badge color
    // If seats are 2 or less, show warning color (Orange), else Green
    const isFewSeatsLeft = item.availableSeats <= 2;

    return (
      <View className="bg-white p-5 rounded-2xl mb-5 shadow-sm border border-gray-100">
        <View className="flex-row items-center">
          {/* Driver Profile Image */}
          <Image
            source={
              item.profileImage
                ? { uri: item.profileImage }
                : {
                    uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }
            }
            className="w-16 h-16 rounded-full bg-gray-200 border-2 border-blue-50"
          />

          <View className="ml-4 flex-1">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-lg font-bold text-gray-800">
                  {item.name}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">
                  <Ionicons name="call" size={12} /> {item.phoneNumber}
                </Text>
              </View>

              {/* Dynamic Seat Availability Badge */}
              <View
                className={`px-3 py-1.5 rounded-full ${isFewSeatsLeft ? "bg-orange-100" : "bg-green-100"}`}
              >
                <Text
                  className={`text-[11px] font-extrabold ${isFewSeatsLeft ? "text-orange-700" : "text-green-700"}`}
                >
                  {item.availableSeats}{" "}
                  {item.availableSeats === 1 ? "SEAT" : "SEATS"} LEFT
                </Text>
              </View>
            </View>

            {/* Vehicle Info */}
            <View className="flex-row items-center mt-3">
              <MaterialCommunityIcons
                name="van-passenger"
                size={16}
                color="#4B5563"
              />
              <Text className="text-gray-700 ml-1.5 font-semibold text-sm">
                {item.vanDetails?.vehicleNo || "No Vehicle Info"}
                <Text className="text-gray-400 font-normal">
                  {" "}
                  (Total: {item.vanDetails?.seats || 0})
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Route Info (Start - End) */}
        <View className="bg-blue-50 p-3 rounded-xl mt-4 flex-row items-center border border-blue-100">
          <Ionicons name="location" size={20} color="#3B82F6" />
          <View className="ml-2 flex-1">
            <Text className="text-blue-900 text-sm font-bold">
              {item.routeDetails?.startLocation || "Start"} ➔{" "}
              {item.routeDetails?.endLocation || "End"}
            </Text>
            <Text className="text-blue-600 text-[10px] mt-0.5 leading-4">
              Via: {item.routeDetails?.cities?.join(", ") || "No cities listed"}
            </Text>
          </View>
        </View>

        {/* Select Action Button */}
        <TouchableOpacity
          onPress={() => handleSelectDriver(item)}
          className="bg-[#1E3A8A] mt-4 p-4 rounded-xl items-center shadow-md shadow-blue-900/20"
        >
          <Text className="text-white font-bold text-base tracking-wide">
            Select This Driver
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      {/* Header Section */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3 bg-white p-2 rounded-full shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-extrabold text-gray-800">
            Find Transport
          </Text>
          <Text className="text-gray-500 text-sm mt-0.5">
            Matching vans for{" "}
            <Text className="font-bold text-blue-600">{child.school}</Text>
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text className="text-gray-500 mt-4 font-medium">
            Finding the best options...
          </Text>
        </View>
      ) : drivers.length === 0 ? (
        <View className="flex-1 items-center justify-center mb-20">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <MaterialCommunityIcons
              name="bus-alert"
              size={60}
              color="#9CA3AF"
            />
          </View>
          <Text className="text-gray-800 text-lg font-bold text-center">
            No matching vans found
          </Text>
          <Text className="text-gray-500 text-center text-sm px-8 mt-2">
            We couldn't find any vans going to {child.school} with available
            seats right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item._id}
          renderItem={renderDriverCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default FindDriverScreen;

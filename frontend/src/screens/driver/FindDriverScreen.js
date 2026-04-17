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

      // Filter Logic
      const matchingDrivers = allDrivers.filter((driver) => {
        // 1. Check if Driver goes to Child's School (Case Insensitive)
        const hasSchool = driver.routeDetails?.schools?.some((s) =>
          s.toLowerCase().includes(child.school.toLowerCase())
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
              navigation.navigate("ParentDashboard");
            } catch (error) {
              Alert.alert("Error", "Failed to assign driver.");
            }
          },
        },
      ]
    );
  };

  const renderDriverCard = ({ item }) => (
    <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center">
        {/* Driver Image */}
        <Image
          source={
            item.profileImage
              ? { uri: item.profileImage }
              : { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }
          }
          className="w-16 h-16 rounded-full bg-gray-200"
        />

        <View className="ml-4 flex-1">
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            {/* Seat Badge */}
            <View className="bg-green-100 px-2 py-1 rounded-lg">
              <Text className="text-green-700 text-xs font-bold">
                {item.availableSeats} Seats Left
              </Text>
            </View>
          </View>

          {/* Vehicle Info */}
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons
              name="van-passenger"
              size={16}
              color="#4B5563"
            />
            <Text className="text-gray-600 ml-1 font-semibold">
              {item.vanDetails?.vehicleNo || "No Vehicle Info"}
            </Text>
          </View>

          {/* Route Info (Start - End) */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={14} color="gray" />
            <Text className="text-gray-500 text-xs ml-1 font-bold">
              {item.routeDetails?.startLocation} ➔{" "}
              {item.routeDetails?.endLocation}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Route Cities (Context for Parent) --- */}
      <View className="bg-gray-50 p-3 rounded-xl mt-3">
        <Text className="text-xs text-gray-400 font-bold uppercase mb-1">
          Passing Through:
        </Text>
        <Text className="text-gray-600 text-xs leading-4">
          {item.routeDetails?.cities?.join(", ") || "No cities listed"}
        </Text>
      </View>

      {/* Select Button */}
      <TouchableOpacity
        onPress={() => handleSelectDriver(item)}
        className="bg-blue-600 mt-4 p-3 rounded-xl items-center"
      >
        <Text className="text-white font-bold">Select This Driver</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Select Transport
          </Text>
          <Text className="text-gray-500 text-xs">
            Matching vans for {child.school}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : drivers.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <MaterialCommunityIcons name="bus-alert" size={50} color="#9CA3AF" />
          <Text className="text-gray-400 mt-3 text-center font-bold">
            No matching vans found.
          </Text>
          <Text className="text-gray-400 text-center text-xs px-10 mt-2">
            We couldn't find any vans going to {child.school} with available
            seats.
          </Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item._id}
          renderItem={renderDriverCard}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default FindDriverScreen;

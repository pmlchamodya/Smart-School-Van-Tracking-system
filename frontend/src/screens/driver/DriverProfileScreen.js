import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import LogoutButton from "../../components/button/LogoutButton";

const DriverProfileScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [image, setImage] = useState(null);

  // Extra Details
  const [nic, setNic] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vanDetails, setVanDetails] = useState({ vehicleNo: "", seats: "" });
  const [routeDetails, setRouteDetails] = useState({
    startLocation: "",
    endLocation: "",
    schools: [],
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        try {
          const userId = await AsyncStorage.getItem("userId");
          if (userId) {
            const response = await api.get(`/users/profile/${userId}`);
            const user = response.data;
            if (user) {
              setName(user.name);
              setEmail(user.email);
              setMobile(user.phoneNumber);
              setImage(user.profileImage || null);
              setNic(user.nic || "Not Set");
              setLicenseNumber(user.licenseNumber || "Not Set");
              setVanDetails(
                user.vanDetails || { vehicleNo: "Not Set", seats: "0" }
              );
              setRouteDetails(
                user.routeDetails || {
                  startLocation: "N/A",
                  endLocation: "N/A",
                  schools: [],
                }
              );
            }
          }
        } catch (error) {
          console.error("Profile Load Error", error);
        }
      };
      fetchProfileData();
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mb-6 mt-2">
          <View className="relative">
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-28 h-28 rounded-full border-4 border-green-100"
              />
            ) : (
              <View className="w-28 h-28 bg-green-100 rounded-full items-center justify-center">
                <FontAwesome5 name="user-tie" size={50} color="#16A34A" />
              </View>
            )}
          </View>
          <Text className="text-2xl font-bold text-gray-800 mt-3">
            {name || "Driver"}
          </Text>
          <Text className="text-gray-500">{email}</Text>
        </View>

        {/* Legal Info */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Legal Information
        </Text>
        <View className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-sm">NIC</Text>
            <Text className="text-gray-800 font-bold">{nic}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500 text-sm">License</Text>
            <Text className="text-gray-800 font-bold">{licenseNumber}</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Vehicle Details
        </Text>
        <View className="bg-blue-50 p-5 rounded-2xl mb-6 border border-blue-100 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 text-xs">Vehicle No</Text>
            <Text className="text-xl font-bold text-blue-800">
              {vanDetails.vehicleNo}
            </Text>
            <Text className="text-gray-500 text-xs mt-2">Seats</Text>
            <Text className="text-lg font-bold text-gray-800">
              {vanDetails.seats}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="van-passenger"
            size={40}
            color="#1E40AF"
            opacity={0.8}
          />
        </View>

        {/* Route Info */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Route
        </Text>
        <View className="bg-orange-50 p-5 rounded-2xl mb-6 border border-orange-100">
          <View className="flex-row items-center mb-3">
            <Ionicons name="location" size={20} color="#EA580C" />
            <Text className="font-bold text-gray-800 ml-2">
              {routeDetails.startLocation} ➔ {routeDetails.endLocation}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {routeDetails.schools?.map((school, index) => (
              <View
                key={index}
                className="bg-white px-2 py-1 rounded-md mr-2 mb-2 border border-gray-200"
              >
                <Text className="text-xs text-gray-600">{school}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Account Settings
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("EditDriverProfile")}
          className="bg-gray-50 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View className="flex-row items-center">
            <View className="bg-white p-2 rounded-full mr-3 shadow-sm">
              <Ionicons name="person" size={18} color="#4B5563" />
            </View>
            <Text className="text-gray-700 font-semibold">
              Edit Personal Details
            </Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ChangePassword")}
          className="bg-gray-50 p-4 rounded-xl mb-3 flex-row justify-between items-center"
        >
          <View className="flex-row items-center">
            <View className="bg-white p-2 rounded-full mr-3 shadow-sm">
              <Ionicons name="lock-closed" size={18} color="#4B5563" />
            </View>
            <Text className="text-gray-700 font-semibold">Change Password</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        <LogoutButton />
        <View className="mb-6"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverProfileScreen;

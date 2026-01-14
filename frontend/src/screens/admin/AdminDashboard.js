import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const AdminDashboard = ({ navigation }) => {
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const getUserData = async () => {
      const name = await AsyncStorage.getItem("userName");
      if (name) setAdminName(name);
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-5">
        {/* --- Header Section --- */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-sm text-gray-500 font-medium">
              Welcome Back,
            </Text>
            <Text className="text-2xl font-bold text-gray-800">
              {adminName || "Admin"}
            </Text>
          </View>
          {/* Profile Icon Placeholder */}
          <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
            <Text className="text-white text-xl font-bold">A</Text>
          </View>
        </View>

        {/* --- Stats Cards (Grid Layout) --- */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {/* Card 1: Drivers */}
          <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 mb-4">
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Drivers
            </Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">12</Text>
          </View>

          {/* Card 2: Parents */}
          <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500 mb-4">
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Parents
            </Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">45</Text>
          </View>

          {/* Card 3: Vans */}
          <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500 mb-4">
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Active Vans
            </Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">8</Text>
          </View>

          {/* Card 4: Students */}
          <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-purple-500 mb-4">
            <Text className="text-gray-400 text-xs font-bold uppercase">
              Students
            </Text>
            <Text className="text-3xl font-bold text-gray-800 mt-1">120</Text>
          </View>
        </View>

        {/* --- Quick Actions Menu --- */}
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Quick Actions
        </Text>

        <View className="bg-white rounded-2xl p-2 shadow-sm mb-6">
          <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Text className="text-blue-600 font-bold">D</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Manage Drivers
              </Text>
              <Text className="text-xs text-gray-500">
                Add, remove or edit drivers
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
              <Text className="text-green-600 font-bold">P</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Manage Parents
              </Text>
              <Text className="text-xs text-gray-500">
                View registered parents
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Logout Button --- */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-50 bg-opacity-50 p-4 rounded-xl border border-red-100 items-center mb-8"
        >
          <Text className="text-red-500 font-bold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";

const AdminDashboard = ({ navigation }) => {
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);

  // State to hold the real statistics from the database
  const [stats, setStats] = useState({
    drivers: 0,
    parents: 0,
    vans: 0,
    students: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Get Admin Name
        const name = await AsyncStorage.getItem("userName");
        if (name) setAdminName(name);

        // Fetch Live Stats from Backend
        const response = await api.get("/users/admin/stats");
        setStats({
          drivers: response.data.driversCount,
          parents: response.data.parentsCount,
          students: response.data.studentsCount,
          vans: response.data.vansCount,
        });
      } catch (error) {
        console.error("Failed to load admin stats", error);
        Alert.alert("Error", "Could not load system statistics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("Login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
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
          <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center shadow-sm">
            <Text className="text-white text-xl font-bold">A</Text>
          </View>
        </View>

        {/* --- Stats Cards (Live Data) --- */}
        {loading ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading Live Stats...</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between mb-6">
            {/* Card 1: Drivers */}
            <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-500 mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                Drivers
              </Text>
              <Text className="text-3xl font-bold text-gray-800 mt-1">
                {stats.drivers}
              </Text>
            </View>

            {/* Card 2: Parents */}
            <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500 mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                Parents
              </Text>
              <Text className="text-3xl font-bold text-gray-800 mt-1">
                {stats.parents}
              </Text>
            </View>

            {/* Card 3: Vans */}
            <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500 mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                Active Vans
              </Text>
              <Text className="text-3xl font-bold text-gray-800 mt-1">
                {stats.vans}
              </Text>
            </View>

            {/* Card 4: Students */}
            <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border-l-4 border-purple-500 mb-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                Students
              </Text>
              <Text className="text-3xl font-bold text-gray-800 mt-1">
                {stats.students}
              </Text>
            </View>
          </View>
        )}

        {/* --- Quick Actions Menu --- */}
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Quick Actions
        </Text>

        <View className="bg-white rounded-2xl p-2 shadow-sm mb-6">
          {/* Manage Drivers Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageDrivers")}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
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

          {/* Manage Parents Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageParents")}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
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

          {/* Manage Students Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ManageStudents")}
            className="flex-row items-center p-4"
          >
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
              <Text className="text-purple-600 font-bold">S</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">
                Manage Students
              </Text>
              <Text className="text-xs text-gray-500">
                View all registered children
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

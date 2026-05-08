import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import LogoutButton from "../../components/button/LogoutButton";

const ParentProfileScreen = ({ navigation }) => {
  // --- State Variables ---
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState(null);

  // New State Variables for displaying details
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false);

  // --- Load Profile Data ---
  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        setLoading(true);
        try {
          const storedRole = await AsyncStorage.getItem("userRole");
          setRole(storedRole);

          const userId = await AsyncStorage.getItem("userId");
          if (userId) {
            const response = await api.get(`/users/profile/${userId}`);
            const user = response.data;

            if (user) {
              setName(user.name);
              setImage(user.profileImage || null);

              // Set all new details
              setEmail(user.email || "No Email");
              setMobile(user.phoneNumber || "No Mobile");
              setAddress(user.address || "Not Set");
              setEmergencyContact(user.emergencyContact || "Not Set");
              setBirthday(
                user.birthday
                  ? new Date(user.birthday).toDateString()
                  : "Not Set",
              );
              setGender(user.gender || "Not Set");
            }
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="p-5"
        showsVerticalScrollIndicator={false}
        //contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* --- 1. Profile Header --- */}
        <View className="items-center mb-6 mt-2">
          <View className="relative shadow-md">
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-28 h-28 rounded-full border-4 border-blue-100"
              />
            ) : (
              <View className="w-28 h-28 bg-blue-100 rounded-full items-center justify-center">
                <FontAwesome5 name="user-alt" size={40} color="#2563EB" />
              </View>
            )}
          </View>

          <Text className="text-2xl font-bold text-gray-800 text-center mt-3">
            {name || "User"}
          </Text>
          <Text className="text-gray-500 capitalize text-center">
            {role || "Parent"}
          </Text>
        </View>
        {/* --- 2. Personal Information Card --- */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Personal Information
        </Text>
        <View className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
          {/* Email */}
          <View className="flex-row items-center mb-3">
            <View className="bg-white p-2 rounded-full mr-3">
              <MaterialIcons name="email" size={18} color="#4B5563" />
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Email</Text>
              <Text className="text-gray-700 font-semibold">{email}</Text>
            </View>
          </View>

          {/* Mobile */}
          <View className="flex-row items-center mb-3">
            <View className="bg-white p-2 rounded-full mr-3">
              <MaterialIcons name="phone" size={18} color="#4B5563" />
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Mobile</Text>
              <Text className="text-gray-700 font-semibold">{mobile}</Text>
            </View>
          </View>

          {/* Birthday & Gender Row */}
          <View className="flex-row justify-between mt-1">
            <View className="flex-row items-center">
              <View className="bg-white p-2 rounded-full mr-3">
                <FontAwesome5 name="birthday-cake" size={16} color="#4B5563" />
              </View>
              <View>
                <Text className="text-gray-400 text-xs">Birthday</Text>
                <Text className="text-gray-700 font-semibold">{birthday}</Text>
              </View>
            </View>
            <View className="flex-row items-center mr-4">
              <View>
                <Text className="text-gray-400 text-xs text-right">Gender</Text>
                <Text className="text-gray-700 font-semibold text-right capitalize">
                  {gender}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* --- 3. Location & Safety Card --- */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Location & Safety
        </Text>
        <View className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
          {/* Address */}
          <View className="flex-row items-start mb-4">
            <View className="bg-white p-2 rounded-full mr-3 mt-1">
              <Ionicons name="location" size={18} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-blue-400 text-xs font-bold">
                Home Address
              </Text>
              <Text className="text-gray-700 font-semibold leading-5">
                {address}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-blue-200 mb-4 opacity-50"></View>

          {/* Emergency Contact */}
          <View className="flex-row items-center">
            <View className="bg-red-100 p-2 rounded-full mr-3">
              <MaterialIcons name="emergency" size={18} color="#EF4444" />
            </View>
            <View>
              <Text className="text-red-400 text-xs font-bold">
                Emergency Contact
              </Text>
              <Text className="text-gray-800 font-bold text-lg">
                {emergencyContact}
              </Text>
            </View>
          </View>
        </View>
        {/* --- 4. Settings & Actions --- */}
        <Text className="text-gray-400 font-bold mb-3 uppercase text-xs">
          Account Settings
        </Text>
        {/* Edit Profile Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          className="bg-gray-50 p-4 rounded-xl mb-3 flex-row justify-between items-center border border-gray-100"
        >
          <View className="flex-row items-center">
            <View className="bg-white p-2 rounded-full mr-3 shadow-sm">
              <Ionicons name="person" size={18} color="#4B5563" />
            </View>
            <Text className="text-gray-700 font-semibold">
              Edit Profile & Details
            </Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>
        {/* Change Password Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ChangePassword")}
          className="bg-gray-50 p-4 rounded-xl mb-3 flex-row justify-between items-center border border-gray-100"
        >
          <View className="flex-row items-center">
            <View className="bg-white p-2 rounded-full mr-3 shadow-sm">
              <Ionicons name="lock-closed" size={18} color="#4B5563" />
            </View>
            <Text className="text-gray-700 font-semibold">Change Password</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>
        {/* Logout Button */}
        <LogoutButton />
        <View className="mb-6"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentProfileScreen;

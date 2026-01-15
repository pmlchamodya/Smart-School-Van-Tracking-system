import { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import LogoutButton from "../../components/button/LogoutButton";

const ParentProfileScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [image, setImage] = useState(null);
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
            }
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-white p-5 items-center">
      {/* --- Profile Picture Section --- */}
      <View className="mb-4 mt-10">
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-24 h-24 rounded-full border-2 border-blue-100"
          />
        ) : (
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
            <FontAwesome5 name="user-alt" size={40} color="#2563EB" />
          </View>
        )}
      </View>

      {/* User Info */}
      <Text className="text-2xl font-bold text-gray-800 text-center">
        {name || "User"}
      </Text>
      <Text className="text-gray-500 capitalize mb-10 text-center">
        {role || "Parent"}
      </Text>

      {/* Settings Options */}
      <View className="w-full mb-4">
        <Text className="text-gray-400 font-bold mb-2 uppercase text-xs">
          Account Settings
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfile")}
          className="bg-gray-50 p-4 rounded-xl mb-2 flex-row justify-between items-center"
        >
          <Text className="text-gray-700 font-semibold">Edit Profile</Text>
          <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <View className="bg-gray-50 p-4 rounded-xl mb-2">
          <Text className="text-gray-700 font-semibold">Notifications</Text>
        </View>
        <View className="bg-gray-50 p-4 rounded-xl mb-2">
          <Text className="text-gray-700 font-semibold">Change Password</Text>
        </View>
      </View>

      <LogoutButton />
    </SafeAreaView>
  );
};

export default ParentProfileScreen;

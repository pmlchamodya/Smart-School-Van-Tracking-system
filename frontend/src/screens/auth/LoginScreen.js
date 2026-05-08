import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerForPushNotificationsAsync } from "../../services/api";
import PasswordInput from "../../components/inputs/PasswordInput";

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Login Logic ---
  const handleLogin = async () => {
    // 1. Basic Validation
    if (!identifier || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const fcmToken = await registerForPushNotificationsAsync();
      // 2. Send Request to Backend
      const response = await api.post("/users/login", {
        identifier: identifier,
        password: password,
        fcmToken: fcmToken, // Send the FCM token to backend for storage
      });

      // 3. Login Successful
      if (response.status === 200) {
        const data = response.data;
        // Handle nested user object if present
        const user = data.user || data;
        const token = data.token;
        const role = user.role;

        // Save User Data locally
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userRole", role);
        await AsyncStorage.setItem("userName", user.name);
        await AsyncStorage.setItem("userId", user._id);

        // --- FETCH FULL PROFILE ---
        // Fetch profile to verify if setup (van/address) is complete
        try {
          const profileRes = await api.get(`/users/profile/${user._id}`);
          const fullProfile = profileRes.data;

          // --- Navigation based on Role & Setup Status ---

          if (role === "admin") {
            navigation.replace("AdminDashboard");
          } else if (role === "driver") {
            // Check if Driver has vehicle details
            if (fullProfile.vanDetails && fullProfile.vanDetails.vehicleNo) {
              navigation.replace("DriverTabs");
            } else {
              navigation.replace("DriverSetup");
            }
          } else if (role === "parent") {
            // Check if Parent has Address
            if (fullProfile.address) {
              navigation.replace("ParentTabs");
            } else {
              navigation.replace("ParentSetup");
            }
          } else {
            Alert.alert("Error", "Unknown Role");
          }
        } catch (err) {
          console.log("Profile Fetch Error", err);
          // Fallback navigation if profile fetch fails
          if (role === "driver") navigation.replace("DriverSetup");
          if (role === "parent") navigation.replace("ParentSetup");
        }
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        Alert.alert("Login Failed", error.response.data.message);
      } else {
        Alert.alert("Error", "Network Error. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center px-6">
      {/* Title  and Logo */}
      <View className="items-center mb-10">
        <Image
          source={require("../../../assets/SmartSchoolVanTracker.png")}
          style={{ width: 250, height: 250, resizeMode: "contain" }}
          padding={20}
        />
        <Text className="text-3xl font-bold text-gray-800">Welcome Back!</Text>
        <Text className="text-black-500 mt-2">
          Sign in to Smart School Van Tracker
        </Text>
      </View>

      {/* Input Fields */}
      <View className="w-full">
        <View className="mb-4">
          <Text className="text-gray-600 font-semibold mb-2 ml-1">
            Email or Phone
          </Text>
          <TextInput
            className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700"
            placeholder="Enter your email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-600 font-semibold mb-2 ml-1">
            Password
          </Text>
          {/* --- PASSWORD COMPONENT --- */}
          <PasswordInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
          />
          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            className="mt-2 self-end"
          >
            <Text className="text-blue-600 font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="w-full bg-blue-600 p-4 rounded-xl items-center shadow-md active:bg-blue-700"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">Log In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Register Link */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text className="text-blue-600 font-bold">Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

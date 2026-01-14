import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import api from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

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
      // 2. Send Login Request to Backend
      const response = await api.post("/users/login", {
        identifier: identifier,
        password: password,
      });

      // 3. If Login Successful
      if (response.status === 200) {
        const data = response.data;
        // Handle different response structures (user object might be nested)
        const user = data.user || data;
        const token = data.token;
        const role = user.role;

        // Save Basic User Data locally
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userRole", role);
        await AsyncStorage.setItem("userName", user.name);
        await AsyncStorage.setItem("userId", user._id);

        // 4. Navigate based on Role
        if (role === "admin") {
          navigation.replace("AdminDashboard");
        } else if (role === "parent") {
          navigation.replace("ParentDashboard");
        } else if (role === "driver") {
          // --- DRIVER FIX: Double Check Profile Data ---
          // Sometimes the login response doesn't have the latest vanDetails.
          // We fetch the full profile to be 100% sure.
          try {
            const profileRes = await api.get(`/users/profile/${user._id}`);
            const fullUserProfile = profileRes.data;

            // Check if vehicle details exist
            if (
              fullUserProfile.vanDetails &&
              fullUserProfile.vanDetails.vehicleNo
            ) {
              // Setup is complete -> Go to Dashboard
              navigation.replace("DriverDashboard");
            } else {
              // Setup is incomplete -> Go to Setup Screen
              navigation.replace("DriverSetup");
            }
          } catch (err) {
            console.log("Profile Fetch Error:", err);
            // Fallback: Go to Setup if there is an error checking
            navigation.replace("DriverSetup");
          }
        } else {
          Alert.alert("Error", "Unknown Role: " + role);
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
      {/* --- Title Section --- */}
      <View className="items-center mb-10">
        <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4 shadow-lg">
          <Text className="text-white text-4xl font-bold">V</Text>
        </View>
        <Text className="text-3xl font-bold text-gray-800">Welcome Back!</Text>
        <Text className="text-gray-500 mt-2">Sign in to Smart Van Tracker</Text>
      </View>

      {/* --- Input Fields --- */}
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
          <TextInput
            className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import PasswordInput from "../../components/inputs/PasswordInput";

const VerifyOTPScreen = ({ route, navigation }) => {
  // Get email from previous screen parameters
  const { email } = route.params;

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Basic validations
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Error", "OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      // Send OTP and new password to backend for verification and update
      const response = await api.post("/users/reset-password", {
        email,
        otp,
        newPassword,
      });

      if (response.status === 200) {
        Alert.alert("Success", "Your password has been reset successfully!", [
          { text: "Login Now", onPress: () => navigation.navigate("Login") },
        ]);
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Reset Failed",
        error.response?.data?.message || "Invalid OTP or request expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            className="px-6"
          >
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-800">
                Verify OTP
              </Text>
              <Text className="text-gray-500 mt-2">
                Enter the 6-digit code sent to:{"\n"}
                <Text className="font-bold text-blue-600">{email}</Text>
              </Text>
            </View>

            <View className="w-full">
              {/* OTP Input Field */}
              <View className="mb-4">
                <Text className="text-gray-600 font-semibold mb-2 ml-1">
                  OTP Code
                </Text>
                <TextInput
                  className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700 text-center text-2xl tracking-[10px]"
                  placeholder="000000"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* New Password Input */}
              <View className="mb-4">
                <Text className="text-gray-600 font-semibold mb-2 ml-1">
                  New Password
                </Text>
                <PasswordInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              {/* Confirm Password Input */}
              <View className="mb-8">
                <Text className="text-gray-600 font-semibold mb-2 ml-1">
                  Confirm Password
                </Text>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                className="w-full bg-blue-600 p-4 rounded-xl items-center shadow-md active:bg-blue-700"
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOTPScreen;

import React, { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import SaveButton from "../../components/button/SaveButton";
import PasswordInput from "../../components/inputs/PasswordInput";

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // 1. Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem("userId");

      // 2. Send Request
      const response = await api.put(`/users/change-password/${userId}`, {
        currentPassword,
        newPassword,
      });

      if (response.status === 200) {
        Alert.alert("Success", "Password changed successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.log(error);
      const msg = error.response?.data?.message || "Failed to update password";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Change Password
        </Text>
        <Text className="text-gray-500 mb-8">
          Your new password must be different from previous used passwords.
        </Text>

        {/* Current Password */}
        <Text className="text-gray-600 font-bold mb-2">Current Password</Text>
        <PasswordInput
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        {/* New Password */}
        <Text className="text-gray-600 font-bold mb-2">New Password</Text>
        <PasswordInput
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
        />

        {/* Confirm New Password */}
        <Text className="text-gray-600 font-bold mb-2">
          Confirm New Password
        </Text>
        <PasswordInput
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Submit Button */}
        <SaveButton
          title="Update Password"
          onPress={handleChangePassword}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import SaveButton from "../../components/button/SaveButton";

const ParentSetupScreen = ({ navigation }) => {
  // --- State Variables ---
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Save Logic ---
  const handleSaveDetails = async () => {
    // Basic Validation
    if (!address || !emergencyContact) {
      Alert.alert("Missing Info", "Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");

      // Prepare data to send
      const updateData = {
        address,
        emergencyContact,
      };

      // Call API to update user profile
      const response = await api.put(`/users/update/${userId}`, updateData);

      if (response.status === 200) {
        Alert.alert("Setup Complete!", "Your details have been saved.");
        // Redirect to Parent Dashboard
        navigation.replace("ParentTabs");
      }
    } catch (error) {
      console.log("Setup Error:", error);
      Alert.alert("Error", "Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Header --- */}
        <View className="flex-row items-center mb-2">
          <Text className="text-3xl font-bold text-gray-800 mr-2">
            Parent Setup
          </Text>
          <MaterialIcons name="family-restroom" size={36} color="#2563EB" />
        </View>
        <Text className="text-gray-500 mb-8">
          Complete your profile to help us find the best vans for you.
        </Text>

        {/* --- Location Info --- */}
        <Text className="text-gray-700 font-bold mb-3 text-sm uppercase">
          Location Details
        </Text>
        <Text className="text-gray-400 text-xs mb-1">
          Home Address (City/Town)
        </Text>
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6"
          placeholder="Ex: No 10, Main Street, Colombo"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        {/* --- Contact Info --- */}
        <Text className="text-gray-700 font-bold mb-3 text-sm uppercase">
          Safety & Contact
        </Text>
        <Text className="text-gray-400 text-xs mb-1">
          Emergency Contact Number
        </Text>
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8"
          placeholder="Ex: 077 123 4567"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
        />

        {/* --- Save Button --- */}
        <SaveButton
          title="Complete Setup"
          onPress={handleSaveDetails}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentSetupScreen;

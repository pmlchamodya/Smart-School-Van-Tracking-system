import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SaveButton from "../../components/button/SaveButton";

const DriverSetupScreen = ({ navigation }) => {
  // --- Form States ---
  const [nic, setNic] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [seats, setSeats] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [schools, setSchools] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSaveDetails = async () => {
    // Basic Validation
    if (
      !nic ||
      !licenseNumber ||
      !vehicleNo ||
      !seats ||
      !startLocation ||
      !schools
    ) {
      Alert.alert("Missing Info", "Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem("userId");

      // Prepare Data Payload
      const updateData = {
        nic,
        licenseNumber,
        vanDetails: { vehicleNo, seats },
        routeDetails: {
          startLocation,
          endLocation,
          schools: schools.split(",").map((s) => s.trim()),
        },
      };

      // Send Update
      const response = await api.put(`/users/update/${userId}`, updateData);

      if (response.status === 200) {
        Alert.alert("Setup Complete!", "Your details have been saved.");
        navigation.replace("DriverDashboard");
      }
    } catch (error) {
      console.log("Setup Error:", error);
      Alert.alert("Error", "Failed to save details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-2">
          <Text className="text-3xl font-bold text-gray-800 mr-2">
            Driver Setup
          </Text>
          <MaterialCommunityIcons
            name="van-utility"
            size={36}
            color="#2563EB"
          />
        </View>
        <Text className="text-gray-500 mb-6">
          Please provide your details to get started.
        </Text>

        {/* --- Legal Info --- */}
        <Text className="text-gray-700 font-bold mb-3 text-sm uppercase">
          Legal Information
        </Text>
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
          placeholder="NIC Number"
          value={nic}
          onChangeText={setNic}
        />
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6"
          placeholder="License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />

        {/* --- Vehicle Info --- */}
        <Text className="text-gray-700 font-bold mb-3 text-sm uppercase">
          Vehicle Details
        </Text>
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4"
          placeholder="Vehicle No (e.g., WP CA-1234)"
          value={vehicleNo}
          onChangeText={setVehicleNo}
        />
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6"
          placeholder="Total Seats"
          keyboardType="numeric"
          value={seats}
          onChangeText={setSeats}
        />

        {/* --- Route Info --- */}
        <Text className="text-gray-700 font-bold mb-3 text-sm uppercase">
          Route Details
        </Text>
        <View className="flex-row justify-between mb-4">
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1 mr-2"
            placeholder="Start Location"
            value={startLocation}
            onChangeText={setStartLocation}
          />
          <TextInput
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex-1 ml-2"
            placeholder="End Location"
            value={endLocation}
            onChangeText={setEndLocation}
          />
        </View>
        <TextInput
          className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-8"
          placeholder="Schools Covered (Comma Separated)"
          value={schools}
          onChangeText={setSchools}
          multiline
        />

        <SaveButton
          title="Complete Registration"
          onPress={handleSaveDetails}
          loading={loading}
        />
        <View className="mb-4"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverSetupScreen;

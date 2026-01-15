import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import api from "../../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import SaveButton from "../../../components/button/SaveButton";

const AddChildScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Function to handle saving the child's details ---
  const handleAddChild = async () => {
    // Basic validation
    if (!name || !school || !grade) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      // Retrieve the logged-in User's ID from AsyncStorage
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        return;
      }

      // Send data to Backend
      const response = await api.post("/children/add", {
        parent_id: userId, // Link child to this parent
        name,
        school,
        grade,
        pickupLocation,
      });

      // If successful, show alert and go back
      if (response.status === 201) {
        Alert.alert("Success", "Child added successfully!");
        navigation.goBack();
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <ScrollView>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Add New Child
        </Text>

        {/* Name Input */}
        <Text className="text-gray-600 mb-2 font-bold">Child's Name</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
        />

        {/* School Input */}
        <Text className="text-gray-600 mb-2 font-bold">School</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          placeholder="Enter school"
          value={school}
          onChangeText={setSchool}
        />

        {/* Grade Input */}
        <Text className="text-gray-600 mb-2 font-bold">Grade/Class</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          placeholder="Ex: Grade 5-B"
          value={grade}
          onChangeText={setGrade}
        />

        {/* Pickup Location Input */}
        <Text className="text-gray-600 mb-2 font-bold">
          Pickup Location (Address)
        </Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-6 border border-gray-200"
          placeholder="Ex: No 12, Temple Road..."
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />

        {/* Save Button */}
        <SaveButton
          title="Save Child"
          onPress={handleAddChild}
          loading={loading}
        />

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 items-center"
        >
          <Text className="text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddChildScreen;

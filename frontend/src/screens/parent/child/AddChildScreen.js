import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
} from "react-native";
import api from "../../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import SaveButton from "../../../components/button/SaveButton";
import { Ionicons } from "@expo/vector-icons";

const AddChildScreen = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");

  // State to hold the GPS coordinates
  const [mapLocation, setMapLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Listen for returning data from LocationPickerScreen ---
  useEffect(() => {
    // 1. Restore Location if sent back
    if (route.params?.selectedLocation) {
      setMapLocation(route.params.selectedLocation);
    }

    // 2. Restore Form Data so user doesn't lose what they typed!
    if (route.params?.returnedData) {
      const { name, school, grade, pickupLocation } = route.params.returnedData;
      setName(name || "");
      setSchool(school || "");
      setGrade(grade || "");
      setPickupLocation(pickupLocation || "");
    }
  }, [route.params]);

  // --- Navigate to Map while passing current form state ---
  const handleGoToMap = () => {
    navigation.navigate("LocationPicker", {
      existingData: { name, school, grade, pickupLocation },
      initialLocation: mapLocation, // Pass existing pin if they are editing
    });
  };

  // --- Function to handle saving the child's details ---
  const handleAddChild = async () => {
    // Basic validation
    if (!name || !school || !grade || !pickupLocation) {
      Alert.alert("Error", "Please fill all text fields");
      return;
    }

    if (!mapLocation) {
      Alert.alert(
        "Action Required",
        "Please pin the pickup location on the map.",
      );
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
        parent_id: userId,
        name,
        school,
        grade,
        pickupLocation, // The typed address
        location: {
          // The exact GPS coordinates
          latitude: mapLocation.latitude,
          longitude: mapLocation.longitude,
        },
      });

      // If successful, show alert and go back
      if (response.status === 201) {
        Alert.alert("Success", "Child added successfully!");
        navigation.navigate("ParentDashboard");
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
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Pickup Location Text Input */}
        <Text className="text-gray-600 mb-2 font-bold">Address (Text)</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          placeholder="Ex: No 12, Temple Road..."
          value={pickupLocation}
          onChangeText={setPickupLocation}
        />

        {/* --- Map Picker Button --- */}
        <Text className="text-gray-600 mb-2 font-bold">Exact GPS Location</Text>
        <TouchableOpacity
          onPress={handleGoToMap}
          className={`p-4 rounded-xl mb-8 flex-row items-center justify-center border-2 ${
            mapLocation
              ? "bg-green-50 border-green-500" // Turns green when selected!
              : "bg-blue-50 border-blue-400"
          }`}
        >
          <Ionicons
            name="location-sharp"
            size={24}
            color={mapLocation ? "#10B981" : "#3B82F6"}
          />
          <Text
            className={`font-bold ml-2 text-lg ${
              mapLocation ? "text-green-700" : "text-blue-600"
            }`}
          >
            {mapLocation
              ? "📍 Location Pinned! (Tap to change)"
              : "Set Pickup Location on Map"}
          </Text>
        </TouchableOpacity>

        {/* Save Button */}
        <SaveButton
          title="Save Child"
          onPress={handleAddChild}
          loading={loading}
        />

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentDashboard")}
          className="mt-4 items-center mb-10"
        >
          <Text className="text-gray-500 font-bold">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddChildScreen;

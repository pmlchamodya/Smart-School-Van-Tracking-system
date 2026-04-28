import { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import api from "../../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import SaveButton from "../../../components/button/SaveButton";
import { Ionicons } from "@expo/vector-icons"; // NEW: For the Map Icon

const EditChildScreen = ({ route, navigation }) => {
  // Get the child data passed from the dashboard
  const child = route.params?.child || {};

  // Initialize state with existing child data
  const [name, setName] = useState(child.name);
  const [school, setSchool] = useState(child.school);
  const [grade, setGrade] = useState(child.grade);
  const [pickupLocation, setPickupLocation] = useState(
    child.pickupLocation || "",
  );

  // NEW: Load existing location if available
  const [mapLocation, setMapLocation] = useState(child.location || null);
  const [loading, setLoading] = useState(false);

  // --- Listen for returning data from LocationPickerScreen ---
  useEffect(() => {
    if (route.params?.selectedLocation) {
      setMapLocation(route.params.selectedLocation);
    }

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
      returnScreen: "EditChild",
      existingData: { name, school, grade, pickupLocation },
      initialLocation: mapLocation, // Pass existing pin to map
      childData: child,
    });
  };

  const handleUpdateChild = async () => {
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
      // Send Update Request to Backend including Location Data
      const response = await api.put(`/children/${child._id}`, {
        name,
        school,
        grade,
        pickupLocation,
        location: {
          latitude: mapLocation.latitude,
          longitude: mapLocation.longitude,
        },
        // --- NEW: Keep existing Driver & Status safe! ---
        driver_id: child.driver_id,
        status: child.status,
      });

      if (response.status === 200) {
        Alert.alert("Success", "Child details updated!");
        // Navigate back to Dashboard safely
        navigation.navigate("ParentDashboard");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Edit Child Details
        </Text>

        <Text className="text-gray-600 mb-2 font-bold">Child's Name</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-gray-600 mb-2 font-bold">School</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          value={school}
          onChangeText={setSchool}
        />

        <Text className="text-gray-600 mb-2 font-bold">Grade</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          value={grade}
          onChangeText={setGrade}
        />

        {/* Pickup Location Text Input */}
        <Text className="text-gray-600 mb-2 font-bold">Address (Text)</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
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

        {/* --- SAVE BUTTON --- */}
        <SaveButton
          title="Update Changes"
          onPress={handleUpdateChild}
          loading={loading}
        />

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

export default EditChildScreen;

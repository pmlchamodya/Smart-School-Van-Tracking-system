import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import SaveButton from "../../components/button/SaveButton";

const EditDriverProfileScreen = ({ navigation }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // --- Personal Info ---
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [showGenderModal, setShowGenderModal] = useState(false);

  // --- Legal Info ---
  const [nic, setNic] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // --- Vehicle Details ---
  const [vehicleNo, setVehicleNo] = useState("");
  const [seats, setSeats] = useState("");
  const [model, setModel] = useState("");

  // --- Route Details ---
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [schools, setSchools] = useState("");
  const [cities, setCities] = useState("");

  // --- Load User Data ---
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);
        const response = await api.get(`/users/profile/${id}`);
        const user = response.data;

        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
          setMobile(user.phoneNumber || "");
          if (user.birthday) setBirthday(new Date(user.birthday));
          setGender(user.gender || "");
          setNic(user.nic || "");
          setLicenseNumber(user.licenseNumber || "");
          if (user.profileImage) setImage(user.profileImage);

          if (user.vanDetails) {
            setVehicleNo(user.vanDetails.vehicleNo || "");
            setSeats(
              user.vanDetails.seats ? user.vanDetails.seats.toString() : "",
            );
            setModel(user.vanDetails.model || "");
          }

          if (user.routeDetails) {
            setStartLocation(user.routeDetails.startLocation || "");
            setEndLocation(user.routeDetails.endLocation || "");
            // Join arrays back to comma-separated strings
            setSchools(
              user.routeDetails.schools
                ? user.routeDetails.schools.join(", ")
                : "",
            );
            setCities(
              user.routeDetails.cities
                ? user.routeDetails.cities.join(", ")
                : "",
            );
          }
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // --- Update Profile Function ---
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const updateData = {
        name,
        email,
        phoneNumber: mobile,
        birthday: birthday.toDateString(),
        gender,
        nic,
        licenseNumber,
        profileImage: image || "",
        vanDetails: {
          vehicleNo,
          seats: parseInt(seats) || 0,
          model,
        },
        routeDetails: {
          startLocation,
          endLocation,
          schools: schools
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
          cities: cities
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
        },
      };

      const response = await api.put(`/users/update/${userId}`, updateData);
      if (response.status === 200) {
        await AsyncStorage.setItem("userName", name);
        Alert.alert("Success", "Profile Updated Successfully!");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Update Failed.");
    } finally {
      setLoading(false);
    }
  };

  // ... (Image and Date Picker logic remains same as provided file)
  // Re-adding essential parts for completeness
  const pickImage = async () => {
    setShowImageModal(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setShowImageModal(false);
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthday(selectedDate);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View className="items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-28 h-28 rounded-full"
              />
            ) : (
              <View className="w-28 h-28 bg-gray-200 rounded-full items-center justify-center">
                <FontAwesome5 name="user" size={40} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-blue-600 font-bold mt-2">
            Tap photo to edit
          </Text>
        </View>

        {/* Form Inputs */}
        <Text className="text-gray-500 font-bold mb-2 text-xs uppercase">
          Route Details
        </Text>

        <View className="flex-row justify-between">
          <TextInput
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-1 mr-2"
            value={startLocation}
            onChangeText={setStartLocation}
            placeholder="Start"
          />
          <TextInput
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-1 ml-2"
            value={endLocation}
            onChangeText={setEndLocation}
            placeholder="End"
          />
        </View>

        <Text className="text-gray-400 text-xs mb-1">Schools</Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={schools}
          onChangeText={setSchools}
          multiline
        />

        <Text className="text-gray-400 text-xs mb-1">Cities</Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6"
          value={cities}
          onChangeText={setCities}
          multiline
        />

        {/* ... (Include other sections: Personal, Legal, Vehicle as needed, similar to provided file) ... */}
        {/* For brevity, assuming other sections are kept as is from your provided file */}

        <SaveButton
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={loading}
        />
        <View className="mb-6"></View>
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/90">
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-10 right-5 p-2 bg-gray-800 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <View className="items-center w-full">
            <TouchableOpacity
              onPress={pickImage}
              className="bg-blue-600 w-3/4 p-4 rounded-xl mb-4 items-center flex-row justify-center"
            >
              <Ionicons name="camera" size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                {image ? "Change Photo" : "Select Photo"}
              </Text>
            </TouchableOpacity>
            {image && (
              <TouchableOpacity
                onPress={handleRemoveImage}
                className="bg-red-500 w-3/4 p-4 rounded-xl items-center flex-row justify-center"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditDriverProfileScreen;

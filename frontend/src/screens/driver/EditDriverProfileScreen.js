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
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"; // Added FontAwesome5
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

  // --- Route Details ---
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [schools, setSchools] = useState("");

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
              user.vanDetails.seats ? user.vanDetails.seats.toString() : ""
            );
          }

          if (user.routeDetails) {
            setStartLocation(user.routeDetails.startLocation || "");
            setEndLocation(user.routeDetails.endLocation || "");
            setSchools(
              user.routeDetails.schools
                ? user.routeDetails.schools.join(", ")
                : ""
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
        vanDetails: { vehicleNo, seats },
        routeDetails: {
          startLocation,
          endLocation,
          schools: schools
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

  // --- Image Handling Functions ---
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
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setImage(null);
            setShowImageModal(false);
          },
        },
      ]
    );
  };

  // Logic to match Parent Dashboard behavior
  const handleImagePress = () => {
    if (image) {
      setShowImageModal(true); // Open modal if image exists
    } else {
      pickImage(); // Directly open gallery if no image
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthday(selectedDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* --- Profile Picture Section (Updated to match Parent Profile) --- */}
        <View className="items-center mb-6 mt-4">
          <View className="relative">
            <TouchableOpacity onPress={handleImagePress}>
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

            <TouchableOpacity
              onPress={handleImagePress}
              className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white"
            >
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-blue-600 font-bold mt-2">
            {image ? "Tap photo to edit" : "Add profile picture"}
          </Text>
        </View>

        {/* --- Personal Info --- */}
        <Text className="text-gray-500 font-bold mb-2 text-xs uppercase">
          Personal Info
        </Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={name}
          onChangeText={setName}
          placeholder="Name"
        />
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={mobile}
          onChangeText={setMobile}
          placeholder="Mobile"
          keyboardType="phone-pad"
        />
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          editable={false}
        />

        {/* Birthday Picker */}
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-row justify-between items-center"
        >
          <Text className="text-gray-800">{birthday.toDateString()}</Text>
          <Ionicons name="calendar-outline" size={20} color="gray" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={birthday}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

        {/* Gender Selector */}
        <TouchableOpacity
          onPress={() => setShowGenderModal(true)}
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-row justify-between items-center"
        >
          <Text className="text-gray-800">{gender || "Select Gender"}</Text>
          <Ionicons name="chevron-down" size={20} color="gray" />
        </TouchableOpacity>

        {/* --- Legal Info --- */}
        <Text className="text-gray-500 font-bold mb-2 text-xs mt-4 uppercase">
          Legal Info
        </Text>
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={nic}
          onChangeText={setNic}
          placeholder="NIC"
        />
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="License No"
        />

        {/* --- Vehicle Details --- */}
        <Text className="text-gray-500 font-bold mb-2 text-xs mt-4 uppercase">
          Vehicle Details
        </Text>
        <View className="flex-row justify-between">
          <TextInput
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-1 mr-2"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            placeholder="Vehicle No"
          />
          <TextInput
            className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3 flex-1 ml-2"
            value={seats}
            onChangeText={setSeats}
            placeholder="Seats"
            keyboardType="numeric"
          />
        </View>

        {/* --- Route Details --- */}
        <Text className="text-gray-500 font-bold mb-2 text-xs mt-4 uppercase">
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
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-8"
          value={schools}
          onChangeText={setSchools}
          placeholder="Schools (comma separated)"
          multiline
        />

        <SaveButton
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={loading}
        />

        <View className="mb-6"></View>
      </ScrollView>

      {/* Gender Modal */}
      <Modal visible={showGenderModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-center mb-4">
              Select Gender
            </Text>
            {["Male", "Female"].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setGender(option);
                  setShowGenderModal(false);
                }}
                className="p-4 border-b border-gray-100 items-center"
              >
                <Text className="text-lg text-gray-700">{option}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowGenderModal(false)}
              className="mt-4 p-4 bg-gray-100 rounded-xl items-center"
            >
              <Text className="font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Image Modal (Consistent with Parent Profile) */}
      <Modal visible={showImageModal} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/90">
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-10 right-5 p-2 bg-gray-800 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center w-full">
            {image && (
              <Image
                source={{ uri: image }}
                className="w-64 h-64 rounded-full border-4 border-white mb-8"
                resizeMode="cover"
              />
            )}

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

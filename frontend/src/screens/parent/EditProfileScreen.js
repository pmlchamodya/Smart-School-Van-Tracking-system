import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import SaveButton from "../../components/button/SaveButton";

const EditProfileScreen = ({ navigation }) => {
  // --- State Variables ---
  const [userId, setUserId] = useState(null);
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  // New Fields for Parent
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState("");
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

          // Set new fields
          setAddress(user.address || "");
          setEmergencyContact(user.emergencyContact || "");

          if (user.birthday) setBirthday(new Date(user.birthday));
          setGender(user.gender || "");
          if (user.profileImage) setImage(user.profileImage);
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // --- Update Profile Logic ---
  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const updateData = {
        name,
        email,
        phoneNumber: mobile,
        birthday: birthday.toDateString(),
        gender,
        profileImage: image || "", // Send empty string if removed
        // Include new fields in update
        address,
        emergencyContact,
      };

      const response = await api.put(`/users/update/${userId}`, updateData);

      if (response.status === 200) {
        await AsyncStorage.setItem("userName", name);
        Alert.alert("Success", "Profile Updated Successfully!");
        navigation.goBack();
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Update Failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- Image Handling ---
  const pickImage = async () => {
    setShowImageModal(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
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
      ],
    );
  };

  // --- Helpers ---
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* --- Profile Photo Section --- */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-24 h-24 rounded-full border-2 border-gray-100"
              />
            ) : (
              <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center">
                <Ionicons name="person" size={40} color="gray" />
              </View>
            )}
            <Text className="text-blue-600 mt-2 font-bold">Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* --- Personal Information --- */}
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
          placeholder="Mobile Number"
          keyboardType="phone-pad"
        />
        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          editable={false} // Email is usually not editable
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
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-6 flex-row justify-between items-center"
        >
          <Text className="text-gray-800">{gender || "Select Gender"}</Text>
          <Ionicons name="chevron-down" size={20} color="gray" />
        </TouchableOpacity>

        {/* --- Location & Contact (NEW SECTION) --- */}
        <Text className="text-gray-500 font-bold mb-2 text-xs uppercase">
          Location & Safety
        </Text>

        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-3"
          value={address}
          onChangeText={setAddress}
          placeholder="Home Address"
          multiline
        />

        <TextInput
          className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-8"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholder="Emergency Contact Number"
          keyboardType="phone-pad"
        />

        {/* --- Save Button --- */}
        <SaveButton
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={loading}
        />

        {/* Extra padding at bottom */}
        <View className="mb-6"></View>
      </ScrollView>

      {/* --- Gender Selection Modal --- */}
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

      {/* --- Image Selection Modal --- */}
      <Modal visible={showImageModal} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/90">
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-10 right-5 p-2 bg-gray-800 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center w-full">
            {/* Preview Current Image */}
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

export default EditProfileScreen;

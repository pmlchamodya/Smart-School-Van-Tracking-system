import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";

const ManageDriversScreen = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState([]);

  // --- NEW: State for Driver Profile Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Fetch all drivers
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/admin/drivers");
      setDrivers(response.data);
      setFilteredDrivers(response.data);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      Alert.alert("Error", "Could not load drivers.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a driver
  const handleDeleteDriver = (driverId, driverName) => {
    Alert.alert(
      "Remove Driver",
      `Are you sure you want to permanently remove ${driverName} from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/users/admin/drivers/${driverId}`);
              Alert.alert("Success", `${driverName} has been removed.`);
              setModalVisible(false); // Close modal if open
              setSearchQuery("");
              loadDrivers();
            } catch (error) {
              console.error("Error deleting driver:", error);
              Alert.alert("Error", "Failed to remove driver.");
            }
          },
        },
      ],
    );
  };

  // Search filter
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const newData = drivers.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : "".toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredDrivers(newData);
    } else {
      setFilteredDrivers(drivers);
    }
  };

  // --- NEW: Open Profile Modal ---
  const openDriverProfile = (driver) => {
    setSelectedDriver(driver);
    setModalVisible(true);
  };

  // UI for a single Driver Card (List Item)
  const renderDriverCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openDriverProfile(item)}
      className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row items-center"
    >
      <Image
        source={
          item.profileImage
            ? { uri: item.profileImage }
            : { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }
        }
        className="w-14 h-14 rounded-full bg-gray-200"
      />

      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          <Ionicons name="call" size={12} /> {item.phoneNumber || "N/A"}
        </Text>

        <View className="flex-row items-center mt-2">
          <MaterialCommunityIcons
            name="van-passenger"
            size={14}
            color="#4B5563"
          />
          <Text className="text-gray-600 text-xs ml-1 font-semibold">
            {item.vanDetails?.vehicleNo || "No Vehicle Assigned"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteDriver(item._id, item.name)}
        className="bg-red-50 p-3 rounded-full"
      >
        <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Manage Drivers
          </Text>
          <Text className="text-gray-500 text-xs">View and remove drivers</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white px-4 py-3 rounded-xl mb-6 shadow-sm border border-gray-100">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search driver by name..."
          value={searchQuery}
          onChangeText={(text) => handleSearch(text)}
          className="flex-1 ml-2 text-gray-800"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Driver List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" className="mt-10" />
      ) : filteredDrivers.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <MaterialCommunityIcons
            name="account-search"
            size={50}
            color="#9CA3AF"
          />
          <Text className="text-gray-400 mt-3 font-bold">
            No drivers found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDrivers}
          keyExtractor={(item) => item._id}
          renderItem={renderDriverCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- NEW: Driver Full Profile Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] p-6">
            {/* Modal Header & Close Button */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Driver Profile
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Image & Name */}
                <View className="items-center mb-6">
                  <Image
                    source={
                      selectedDriver.profileImage
                        ? { uri: selectedDriver.profileImage }
                        : {
                            uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                          }
                    }
                    className="w-24 h-24 rounded-full bg-gray-200 border-4 border-blue-100 mb-3"
                  />
                  <Text className="text-2xl font-bold text-gray-800">
                    {selectedDriver.name}
                  </Text>
                  <View className="bg-blue-100 px-3 py-1 rounded-full mt-1">
                    <Text className="text-blue-700 text-xs font-bold uppercase">
                      Active Driver
                    </Text>
                  </View>
                </View>

                {/* Personal Info Section */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Personal Details
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="call"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">
                        Phone Number
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedDriver.phoneNumber}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="mail"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">
                        Email Address
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedDriver.email}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="card"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">NIC Number</Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedDriver.nic || "Not Provided"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="car-outline"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">
                        License Number
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedDriver.licenseNumber || "Not Provided"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Vehicle & Route Section */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Vehicle & Route Info
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-4">
                    <MaterialCommunityIcons
                      name="van-passenger"
                      size={28}
                      color="#3B82F6"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-lg font-bold text-gray-800">
                        {selectedDriver.vanDetails?.vehicleNo || "No Vehicle"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        Model: {selectedDriver.vanDetails?.model || "N/A"} •
                        Seats: {selectedDriver.vanDetails?.seats || 0}
                      </Text>
                    </View>
                  </View>

                  <View className="border-t border-gray-200 py-3">
                    <Text className="text-xs text-gray-500 mb-1">
                      Target Schools:
                    </Text>
                    <View className="flex-row flex-wrap">
                      {selectedDriver.routeDetails?.schools?.length > 0 ? (
                        selectedDriver.routeDetails.schools.map(
                          (school, index) => (
                            <View
                              key={index}
                              className="bg-white border border-gray-200 px-3 py-1 rounded-lg mr-2 mb-2"
                            >
                              <Text className="text-gray-700 text-xs font-semibold">
                                {school}
                              </Text>
                            </View>
                          ),
                        )
                      ) : (
                        <Text className="text-sm font-semibold text-gray-800">
                          No schools assigned
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="border-t border-gray-200 pt-3">
                    <Text className="text-xs text-gray-500 mb-1">
                      Route Path:
                    </Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {selectedDriver.routeDetails?.startLocation || "Start"} ➔{" "}
                      {selectedDriver.routeDetails?.endLocation || "End"}
                    </Text>
                  </View>
                </View>

                {/* Delete Driver Action inside Modal */}
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteDriver(selectedDriver._id, selectedDriver.name)
                  }
                  className="bg-red-50 py-4 rounded-xl items-center border border-red-100 mb-10 flex-row justify-center"
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-bold ml-2">
                    Remove This Driver
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageDriversScreen;

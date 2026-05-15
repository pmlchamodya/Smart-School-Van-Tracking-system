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

const ManageParentsScreen = ({ navigation }) => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredParents, setFilteredParents] = useState([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  // Fetch all parents when the screen loads
  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/admin/parents");
      setParents(response.data);
      setFilteredParents(response.data);
    } catch (error) {
      console.error("Error fetching parents:", error);
      Alert.alert("Error", "Could not load parents.");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a parent
  const handleDeleteParent = (parentId, parentName) => {
    Alert.alert(
      "Remove Parent",
      `Are you sure you want to permanently remove ${parentName} from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/users/admin/parents/${parentId}`);
              Alert.alert("Success", `${parentName} has been removed.`);
              setModalVisible(false); // Close modal if open
              setSearchQuery("");
              loadParents();
            } catch (error) {
              console.error("Error deleting parent:", error);
              Alert.alert("Error", "Failed to remove parent.");
            }
          },
        },
      ],
    );
  };

  // Filter functionality
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const newData = parents.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : "".toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredParents(newData);
    } else {
      setFilteredParents(parents);
    }
  };

  const openParentProfile = (parent) => {
    setSelectedParent(parent);
    setModalVisible(true);
  };

  // UI for a single Parent Card
  const renderParentCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openParentProfile(item)}
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
          <Ionicons name="home-outline" size={14} color="#4B5563" />
          <Text
            className="text-gray-600 text-xs ml-1 font-semibold"
            numberOfLines={1}
          >
            {item.address || "Address not provided"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteParent(item._id, item.name)}
        className="bg-red-50 p-3 rounded-full"
      >
        <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Manage Parents
          </Text>
          <Text className="text-gray-500 text-xs">
            View and remove parent accounts
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white px-4 py-3 rounded-xl mb-6 shadow-sm border border-gray-100">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search parent by name..."
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

      {/* Parent List */}
      {loading ? (
        <ActivityIndicator size="large" color="#10B981" className="mt-10" />
      ) : filteredParents.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <MaterialCommunityIcons
            name="account-search"
            size={50}
            color="#9CA3AF"
          />
          <Text className="text-gray-400 mt-3 font-bold">
            No parents found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredParents}
          keyExtractor={(item) => item._id}
          renderItem={renderParentCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- Parent Full Profile Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%] p-6">
            {/* Modal Header & Close Button */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Parent Profile
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            {selectedParent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Image & Name */}
                <View className="items-center mb-6">
                  <Image
                    source={
                      selectedParent.profileImage
                        ? { uri: selectedParent.profileImage }
                        : {
                            uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                          }
                    }
                    className="w-24 h-24 rounded-full bg-gray-200 border-4 border-green-100 mb-3"
                  />
                  <Text className="text-2xl font-bold text-gray-800">
                    {selectedParent.name}
                  </Text>
                  <View className="bg-green-100 px-3 py-1 rounded-full mt-1">
                    <Text className="text-green-700 text-xs font-bold uppercase">
                      Registered Parent
                    </Text>
                  </View>
                </View>

                {/* Personal Info Section */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Contact Details
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
                        {selectedParent.phoneNumber}
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
                        {selectedParent.email}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="home"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3 pr-4">
                      <Text className="text-xs text-gray-500">
                        Home Address
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedParent.address || "Not Provided"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="emergency"
                      size={20}
                      color="#EF4444"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">
                        Emergency Contact
                      </Text>
                      <Text className="text-base font-semibold text-red-500">
                        {selectedParent.emergencyContact || "Not Provided"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete Parent Action inside Modal */}
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteParent(selectedParent._id, selectedParent.name)
                  }
                  className="bg-red-50 py-4 rounded-xl items-center border border-red-100 mb-10 flex-row justify-center"
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-bold ml-2">
                    Remove This Parent
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

export default ManageParentsScreen;

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const ParentDashboard = ({ navigation }) => {
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Load Data Function ---
  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (userId) {
        // 1. Fetch User Profile
        const userRes = await api.get(`/users/profile/${userId}`);
        if (userRes.data) {
          setParentName(userRes.data.name);
          setProfileImage(userRes.data.profileImage);
        }

        // 2. Fetch Children List
        const childRes = await api.get(`/children/${userId}`);
        setChildren(childRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- Reload data on screen focus ---
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // --- Pull to Refresh Function ---
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // --- Delete Child Logic ---
  const handleDeleteChild = (childId) => {
    Alert.alert("Delete Child", "Are you sure you want to remove this child?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/children/${childId}`);
            Alert.alert("Success", "Child removed successfully");
            loadData();
          } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to delete child");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="p-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* --- Header Section --- */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-gray-500 font-medium text-sm">
              Welcome Parent,
            </Text>
            <Text className="text-2xl font-bold text-gray-800">
              {parentName}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("ParentProfile")}
            className="w-12 h-12 rounded-full shadow-md active:bg-gray-200 overflow-hidden"
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-blue-600 items-center justify-center">
                <FontAwesome5 name="user-alt" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Live Tracking Button --- */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentMap")}
          className="bg-blue-600 p-5 rounded-2xl shadow-md flex-row items-center justify-center mb-8"
        >
          <View className="bg-blue-500 p-3 rounded-full mr-4">
            <Ionicons name="location-sharp" size={28} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-xl">
              TRACK SCHOOL VAN
            </Text>
            <Text className="text-blue-100 text-sm">
              View live location on map
            </Text>
          </View>
        </TouchableOpacity>

        {/* --- My Children Header --- */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">My Children</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddChild")}
            className="flex-row items-center"
          >
            <Ionicons name="add-circle" size={24} color="#2563EB" />
            <Text className="text-blue-600 font-bold ml-1">Add New</Text>
          </TouchableOpacity>
        </View>

        {/* --- Children List --- */}
        {children.length === 0 ? (
          <View className="bg-white p-6 rounded-2xl items-center justify-center mb-6">
            <Text className="text-gray-400">No children added yet.</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddChild")}>
              <Text className="text-blue-500 mt-2 font-bold">
                Add your first child
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child, index) => (
            <View
              key={index}
              className="bg-white p-5 rounded-2xl shadow-sm mb-4 border-l-4 border-blue-500"
            >
              <View className="flex-row justify-between items-start">
                {/* Child Info */}
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-800">
                    {child.name}
                  </Text>
                  <Text className="text-gray-500">
                    {child.school} - {child.grade}
                  </Text>

                  {/* --- Check if Driver is Assigned --- */}
                  {child.driver_id ? (
                    <View className="bg-green-100 px-2 py-1 rounded-md self-start mt-2 flex-row items-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="green"
                      />
                      <Text className="text-green-700 font-bold text-xs ml-1">
                        Van Assigned
                      </Text>
                    </View>
                  ) : (
                    // Show "Find Transport" Button
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("FindDriver", { child: child })
                      }
                      className="bg-orange-100 px-3 py-2 rounded-md self-start mt-2 flex-row items-center"
                    >
                      <MaterialCommunityIcons
                        name="bus-marker"
                        size={16}
                        color="#C2410C"
                      />
                      <Text className="text-orange-700 font-bold text-xs ml-1">
                        Find Transport
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* --- Action Buttons (Edit/Delete) --- */}
                <View className="flex-row items-center mt-1">
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditChild", { child: child })
                    }
                    className="bg-gray-100 p-2 rounded-full mr-3"
                  >
                    <MaterialIcons name="edit" size={20} color="#4B5563" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteChild(child._id)}
                    className="bg-red-50 p-2 rounded-full"
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentDashboard;

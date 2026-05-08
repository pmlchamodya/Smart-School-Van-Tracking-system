import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const ParentDriversScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      const response = await api.get(`/children/${userId}`);
      const children = response.data;

      const driversMap = {};
      children.forEach((child) => {
        if (child.driver_id) {
          const dId = child.driver_id._id || child.driver_id;
          if (!driversMap[dId]) {
            driversMap[dId] = {
              ...child.driver_id,
              childrenNames: [child.name],
            };
          } else {
            driversMap[dId].childrenNames.push(child.name);
          }
        }
      });

      setDrivers(Object.values(driversMap));
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrivers();
    }, []),
  );

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const renderDriver = ({ item }) => (
    <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center mb-4">
        <Image
          source={
            item.profileImage
              ? { uri: item.profileImage }
              : { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }
          }
          className="w-16 h-16 rounded-full bg-gray-200"
        />
        <View className="ml-4 flex-1">
          <Text className="text-xl font-bold text-gray-800">{item.name}</Text>

          {/* --- NEW: Phone Number Display --- */}
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="call" size={12} color="#6B7280" />
            <Text className="text-gray-500 text-xs font-medium ml-1">
              {item.phoneNumber || "No Number"}
            </Text>
          </View>

          <Text className="text-blue-600 text-xs font-bold uppercase mt-1.5">
            School Van Driver
          </Text>

          {/* Vehicle Number Display */}
          <View className="flex-row items-center mt-1 bg-gray-100 self-start px-2 py-0.5 rounded-md">
            <MaterialCommunityIcons
              name="van-utility"
              size={14}
              color="#2563EB"
            />
            <Text className="text-blue-700 text-xs font-bold ml-1">
              {item.vanDetails?.vehicleNo || "No Vehicle Number"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleCall(item.phoneNumber)}
          className="bg-green-100 p-3 rounded-full"
        >
          <Ionicons name="call" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View className="border-t border-gray-50 pt-3">
        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">
          Transporting:
        </Text>
        <View className="flex-row flex-wrap">
          {item.childrenNames.map((name, index) => (
            <View
              key={index}
              className="bg-blue-50 px-3 py-1 rounded-lg mr-2 mb-2 border border-blue-100"
            >
              <Text className="text-blue-700 text-xs font-bold">{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-800 mb-6">
        My School Vans
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
      ) : drivers.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <MaterialCommunityIcons name="bus-alert" size={60} color="#D1D5DB" />
          <Text className="text-gray-400 font-bold mt-4">
            No drivers assigned yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item._id}
          renderItem={renderDriver}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default ParentDriversScreen;

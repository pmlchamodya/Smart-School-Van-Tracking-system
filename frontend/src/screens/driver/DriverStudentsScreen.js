import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const DriverStudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const driverId = await AsyncStorage.getItem("userId");
      if (driverId) {
        const response = await api.get(`/children/driver/${driverId}`);
        setStudents(response.data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, []),
  );

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate("StudentDetails", { student: item })}
      className="bg-white p-4 rounded-xl mb-3 flex-row items-center shadow-sm border border-gray-100"
    >
      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
        <FontAwesome5 name="user-graduate" size={20} color="#2563EB" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.school}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <Text className="text-2xl font-bold text-gray-800 mb-6">
        All Students
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
      ) : students.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <Ionicons name="people" size={60} color="#D1D5DB" />
          <Text className="text-gray-400 font-bold mt-4">
            No students found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item._id}
          renderItem={renderStudent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
};

export default DriverStudentsScreen;

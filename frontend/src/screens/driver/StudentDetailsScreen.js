import React from "react";
import { View, Text, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

const StudentDetailsScreen = ({ route, navigation }) => {
  const { student } = route.params;

  const handleCallParent = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("No Number", "Parent's phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-5 bg-blue-600 rounded-b-3xl shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Student Profile</Text>
      </View>

      <View className="p-5 mt-4">
        {/* Child Info Card */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <FontAwesome5 name="user-graduate" size={30} color="#2563EB" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 text-center">
            {student.name}
          </Text>
          <Text className="text-gray-500 font-medium mt-1 text-center">
            {student.school}
          </Text>

          <View
            className={`px-3 py-1 rounded-full mt-3 ${student.isAbsent ? "bg-red-100" : "bg-green-100"}`}
          >
            <Text
              className={`text-xs font-bold ${student.isAbsent ? "text-red-700" : "text-green-700"}`}
            >
              {student.isAbsent ? "🔴 ABSENT TODAY" : "🟢 ACTIVE"}
            </Text>
          </View>
        </View>

        {/* Parent Info Card */}
        <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
          Parent Details
        </Text>
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-gray-100 p-3 rounded-full mr-4">
              <Ionicons name="person" size={24} color="#4B5563" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-semibold uppercase">
                Parent Name
              </Text>
              <Text className="text-lg font-bold text-gray-800">
                {student.parent_id?.name || "N/A"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="bg-gray-100 p-3 rounded-full mr-4">
              <Ionicons name="call" size={24} color="#4B5563" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs font-semibold uppercase">
                Phone Number
              </Text>
              <Text className="text-lg font-bold text-gray-800">
                {student.parent_id?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Call Button */}
        <TouchableOpacity
          onPress={() => handleCallParent(student.parent_id?.phoneNumber)}
          className="bg-green-500 p-4 rounded-xl flex-row justify-center items-center shadow-md shadow-green-200"
        >
          <Ionicons name="call" size={24} color="white" />
          <Text className="text-white font-bold text-xl ml-3">Call Parent</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default StudentDetailsScreen;

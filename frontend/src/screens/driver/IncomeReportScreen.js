import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const IncomeReportScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get Current Month (YYYY-MM)
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const driverId = await AsyncStorage.getItem("userId");
      if (driverId) {
        const response = await api.get(
          `/payments/driver/${driverId}/${currentMonth}`,
        );
        setPayments(response.data);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [currentMonth]),
  );

  // --- Calculations for the Report ---
  const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = totalExpected - totalCollected;

  // Calculate Percentage for Progress Bar
  const collectionPercentage =
    totalExpected === 0
      ? 0
      : Math.round((totalCollected / totalExpected) * 100);

  // Filter Pending Students to show them in a list
  const pendingStudents = payments.filter((p) => p.status === "Pending");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
      {/* Header */}
      <View className="flex-row items-center p-5 bg-blue-800 rounded-b-3xl shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Income Report</Text>
      </View>

      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* Month Selector Display */}
        <View className="flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
          <Text className="text-gray-500 font-bold uppercase tracking-wider">
            Report Month
          </Text>
          <View className="bg-blue-100 px-4 py-2 rounded-lg">
            <Text className="text-blue-800 font-extrabold">{currentMonth}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1E40AF" className="mt-10" />
        ) : (
          <>
            {/* Main Income Card */}
            <View className="bg-white p-6 rounded-3xl shadow-sm mb-6 border border-gray-100">
              <Text className="text-gray-500 font-bold text-center mb-2">
                TOTAL EXPECTED INCOME
              </Text>
              <Text className="text-4xl font-extrabold text-blue-900 text-center mb-6">
                Rs. {totalExpected}
              </Text>

              {/* Progress Bar */}
              <View className="w-full h-3 bg-gray-200 rounded-full mb-2 overflow-hidden">
                <View
                  style={{ width: `${collectionPercentage}%` }}
                  className="h-full bg-green-500 rounded-full"
                />
              </View>
              <Text className="text-right text-green-600 font-bold text-xs mb-6">
                {collectionPercentage}% Collected
              </Text>

              {/* Sub Stats */}
              <View className="flex-row justify-between border-t border-gray-100 pt-4">
                <View className="flex-1 border-r border-gray-100 items-center">
                  <Text className="text-gray-400 text-xs font-bold mb-1">
                    COLLECTED
                  </Text>
                  <Text className="text-xl font-bold text-green-600">
                    Rs. {totalCollected}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-gray-400 text-xs font-bold mb-1">
                    PENDING
                  </Text>
                  <Text className="text-xl font-bold text-red-500">
                    Rs. {totalPending}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pending Students List */}
            <Text className="text-lg font-bold text-gray-800 mb-4 px-2">
              Action Required: Yet to Pay ({pendingStudents.length})
            </Text>

            {pendingStudents.length === 0 ? (
              <View className="bg-green-50 p-5 rounded-2xl border border-green-200 items-center">
                <Ionicons
                  name="checkmark-done-circle"
                  size={40}
                  color="#10B981"
                />
                <Text className="text-green-700 font-bold mt-2">
                  All payments collected for this month!
                </Text>
              </View>
            ) : (
              pendingStudents.map((payment) => (
                <View
                  key={payment._id}
                  className="bg-white p-4 rounded-2xl mb-3 shadow-sm border-l-4 border-red-400 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="font-bold text-gray-800 text-lg">
                      {payment.childId?.name || "Unknown Student"}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Parent: {payment.parentId?.name || "N/A"} (
                      {payment.parentId?.phoneNumber || "N/A"})
                    </Text>
                  </View>
                  <Text className="font-bold text-red-500 text-lg">
                    Rs. {payment.amount}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default IncomeReportScreen;

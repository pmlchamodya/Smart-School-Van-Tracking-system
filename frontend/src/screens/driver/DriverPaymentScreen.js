import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const DriverPaymentScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Get Current Month in "YYYY-MM" format ---
  const getCurrentMonth = () => {
    const date = new Date();
    return date.toISOString().slice(0, 7); // e.g., "2026-04"
  };

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  // --- Fetch Payments from Backend ---
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const driverId = await AsyncStorage.getItem("userId");

      if (driverId) {
        // Fetch data using the route we created in the backend
        const response = await api.get(
          `/payments/driver/${driverId}/${currentMonth}`,
        );
        setPayments(response.data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      Alert.alert("Error", "Could not load payment details.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reload data when screen is focused ---
  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [currentMonth]),
  );

  // --- Mark a Payment as Paid (Cash) ---
  const handleMarkAsPaid = (paymentId, childName) => {
    Alert.alert("Confirm Payment", `Did you receive cash from ${childName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, Mark Paid",
        onPress: async () => {
          try {
            // Send PUT request to backend
            await api.put(`/payments/mark-paid/${paymentId}`, {
              paymentMethod: "Cash",
            });

            Alert.alert("Success", "Payment updated successfully!");
            fetchPayments(); // Refresh the list
          } catch (error) {
            console.error("Error updating payment:", error);
            Alert.alert("Error", "Could not update payment.");
          }
        },
      },
    ]);
  };

  // --- Generate Bills (For Testing & Presentation) ---
  const handleGenerateBills = async () => {
    try {
      setLoading(true);
      // This will trigger the backend to create payment records
      await api.post("/payments/generate-monthly", {
        month: currentMonth,
        defaultFee: 5000,
      });

      Alert.alert(
        "Success 🎉",
        "Bills generated successfully for all students!",
      );
      fetchPayments(); // Refresh to show new bills
    } catch (error) {
      console.error("Error generating bills:", error);
      Alert.alert("Error", "Could not generate bills.");
      setLoading(false);
    }
  };

  // --- Calculate Summary ---
  const totalExpected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="flex-row items-center p-5 bg-blue-600 rounded-b-3xl shadow-md">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">
            Monthly Payments
          </Text>
        </View>

        {/* Month Selector, Summary & Generate Button Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm mb-6 mt-2">
          <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-4">
            <Text className="text-gray-500 font-bold uppercase tracking-wider">
              Selected Month
            </Text>
            <View className="bg-blue-100 px-3 py-1 rounded-lg">
              <Text className="text-blue-700 font-bold">{currentMonth}</Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-4">
            <View>
              <Text className="text-gray-400 text-xs">Total Expected</Text>
              <Text className="text-xl font-bold text-gray-800">
                Rs. {totalExpected}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-400 text-xs">Total Collected</Text>
              <Text className="text-2xl font-bold text-green-600">
                Rs. {totalCollected}
              </Text>
            </View>
          </View>

          {/* --- NEW: Generate Bills Button (Always Visible) --- */}
          <TouchableOpacity
            onPress={handleGenerateBills}
            className="bg-blue-600 p-3 rounded-xl shadow-sm flex-row items-center justify-center mt-2 active:bg-blue-700"
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-2">
              Generate Bills (Rs. 5000)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payments List */}
        <Text className="text-lg font-bold text-gray-800 mb-4 px-5">
          Student Bills
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
        ) : payments.length === 0 ? (
          <View className="items-center justify-center mt-10 bg-white p-6 mx-5 rounded-2xl shadow-sm border border-gray-100">
            <FontAwesome5 name="receipt" size={50} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4 font-medium text-center">
              No bills generated for {currentMonth} yet.
            </Text>
          </View>
        ) : (
          <View className="px-5">
            {payments.map((payment) => (
              <View
                key={payment._id}
                className={`p-4 rounded-xl mb-3 shadow-sm border-l-4 ${
                  payment.status === "Paid"
                    ? "bg-white border-green-500"
                    : "bg-white border-red-400"
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {payment.childId?.name || "Unknown Student"}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      Fee: Rs. {payment.amount}
                    </Text>

                    {/* Status Badge */}
                    <View
                      className={`mt-2 self-start px-2 py-1 rounded-md ${
                        payment.status === "Paid"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          payment.status === "Paid"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {payment.status === "Paid"
                          ? `✔ Paid (${payment.paymentMethod})`
                          : "⏳ Pending"}
                      </Text>
                    </View>
                  </View>

                  {/* Mark as Paid Button (Only visible if status is Pending) */}
                  {payment.status === "Pending" && (
                    <TouchableOpacity
                      onPress={() =>
                        handleMarkAsPaid(payment._id, payment.childId?.name)
                      }
                      className="bg-blue-50 p-3 rounded-full border border-blue-200"
                    >
                      <MaterialIcons
                        name="payments"
                        size={24}
                        color="#2563EB"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DriverPaymentScreen;

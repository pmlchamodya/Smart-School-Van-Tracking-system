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
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

const ParentPaymentScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch Payments from Backend ---
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const parentId = await AsyncStorage.getItem("userId");
      if (parentId) {
        const response = await api.get(`/payments/parent/${parentId}`);
        setPayments(response.data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      Alert.alert("Error", "Could not load your bills.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reload data when screen is focused ---
  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, []),
  );

  // --- Navigate to Secure Payment Gateway ---
  const handlePayNow = (paymentId, amount, month, driverId) => {
    navigation.navigate("PaymentGateway", {
      paymentId: paymentId,
      amount: amount,
      month: month,
      driverId: driverId,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header Section */}
      <View className="flex-row items-center p-5 bg-blue-600 rounded-b-3xl shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">
          My Payments & Bills
        </Text>
      </View>

      <ScrollView className="p-5">
        <Text className="text-lg font-bold text-gray-800 mb-4">
          Payment History
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" className="mt-10" />
        ) : payments.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <MaterialCommunityIcons
              name="file-document-outline"
              size={60}
              color="#D1D5DB"
            />
            <Text className="text-gray-400 mt-4 font-medium">
              No payment records found.
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View
              key={payment._id}
              className={`p-5 rounded-2xl mb-4 shadow-sm border-t-4 ${
                payment.status === "Paid"
                  ? "bg-white border-green-500"
                  : "bg-white border-red-500"
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-gray-500 font-bold tracking-widest text-xs uppercase">
                    Month: {payment.month}
                  </Text>
                  <Text className="text-xl font-bold text-gray-800 mt-1">
                    {payment.childId?.name}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-blue-600">
                  Rs.{payment.amount}
                </Text>
              </View>

              <View className="h-[1px] bg-gray-100 my-3"></View>

              <View className="flex-row justify-between items-center">
                {/* Status Indicator */}
                <View className="flex-row items-center">
                  <FontAwesome5
                    name={payment.status === "Paid" ? "check-circle" : "clock"}
                    size={16}
                    color={payment.status === "Paid" ? "#10B981" : "#EF4444"}
                  />
                  <Text
                    className={`font-bold ml-2 ${
                      payment.status === "Paid"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {payment.status === "Paid"
                      ? `Paid via ${payment.paymentMethod}`
                      : "Payment Pending"}
                  </Text>
                </View>

                {/* Action Button: E-Receipt or Pay Now */}
                {payment.status === "Paid" ? (
                  <TouchableOpacity className="bg-gray-100 px-3 py-2 rounded-lg flex-row items-center">
                    <Ionicons
                      name="download-outline"
                      size={16}
                      color="#4B5563"
                    />
                    <Text className="text-gray-600 text-xs font-bold ml-1">
                      Receipt
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      handlePayNow(
                        payment._id,
                        payment.amount,
                        payment.month,
                        payment.driverId,
                      )
                    }
                    className="bg-blue-600 px-5 py-2 rounded-xl shadow-md"
                  >
                    <Text className="text-white font-bold">Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentPaymentScreen;

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../../services/api";
import socket from "../../services/socket"; // Import the centralized socket

const PaymentGatewayScreen = ({ route, navigation }) => {
  const { paymentId, amount, month, driverId } = route.params;

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Process the Fake Payment ---
  const handlePayment = () => {
    // Basic Validation
    if (
      cardNumber.length < 16 ||
      expiry.length < 5 ||
      cvv.length < 3 ||
      name === ""
    ) {
      Alert.alert(
        "Invalid Details",
        "Please enter valid card details to proceed.",
      );
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        // 1. Update backend that payment is successful
        await api.put(`/payments/mark-paid/${paymentId}`, {
          paymentMethod: "Card",
        });

        // 2. Emit the socket event
        const targetDriver = driverId || "global";
        socket.emit("paymentMade", { driverId: targetDriver });

        setIsProcessing(false);
        Alert.alert(
          "Payment Successful! 🎉",
          "Your transaction was completed successfully.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      } catch (error) {
        setIsProcessing(false);
        console.error("Payment Error:", error);
        Alert.alert(
          "Payment Failed",
          "Something went wrong with the bank server.",
        );
      }
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="bg-blue-700 p-5 pt-8 rounded-b-3xl shadow-lg">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mr-4"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">
                Secure Checkout
              </Text>
            </View>
            <View className="items-center mt-6 mb-2">
              <Text className="text-blue-200 text-sm">Amount to Pay</Text>
              <Text className="text-4xl font-extrabold text-white">
                Rs. {amount}
              </Text>
              <Text className="text-white mt-1">For {month}</Text>
            </View>
          </View>

          {/* Supported Cards Icons */}
          <View className="flex-row justify-center space-x-4 mt-6">
            <FontAwesome5 name="cc-visa" size={40} color="#1A1F71" />
            <FontAwesome5 name="cc-mastercard" size={40} color="#EB001B" />
            <FontAwesome5 name="cc-amex" size={40} color="#2E77BC" />
          </View>

          {/* Payment Form */}
          <View className="bg-white m-5 p-5 rounded-2xl shadow-sm">
            <Text className="font-bold text-gray-700 mb-4 text-lg">
              Card Details
            </Text>

            {/* Cardholder Name */}
            <Text className="text-gray-500 text-xs mb-1 ml-1">
              Cardholder Name
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-gray-800"
              placeholder="e.g. JOHN DOE"
              value={name}
              onChangeText={setName}
            />

            {/* Card Number */}
            <Text className="text-gray-500 text-xs mb-1 ml-1">Card Number</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 mb-4">
              <Ionicons name="card-outline" size={20} color="gray" />
              <TextInput
                className="flex-1 p-3 text-gray-800"
                placeholder="0000 0000 0000 0000"
                keyboardType="numeric"
                maxLength={16}
                value={cardNumber}
                onChangeText={setCardNumber}
              />
            </View>

            {/* Expiry and CVV Row */}
            <View className="flex-row justify-between mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-gray-500 text-xs mb-1 ml-1">
                  Expiry Date
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expiry}
                  onChangeText={setExpiry}
                />
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-500 text-xs mb-1 ml-1">CVV</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800"
                  placeholder="123"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>

            {/* Secure Note */}
            <View className="flex-row items-center justify-center mt-4 mb-2">
              <Ionicons name="lock-closed" size={12} color="green" />
              <Text className="text-xs text-green-700 ml-1">
                Payments are secure and encrypted
              </Text>
            </View>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isProcessing}
            className={`m-5 p-4 rounded-xl items-center shadow-md flex-row justify-center ${
              isProcessing ? "bg-gray-400" : "bg-green-600"
            }`}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Processing...
                </Text>
              </>
            ) : (
              <Text className="text-white font-bold text-lg">
                Pay Rs. {amount}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PaymentGatewayScreen;

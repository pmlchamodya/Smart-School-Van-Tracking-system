import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/users/send-otp", { email });
      if (response.status === 200) {
        Alert.alert(
          "OTP Sent",
          "Please check your email for the 6-digit code.",
        );
        navigation.navigate("VerifyOTP", { email: email });
      }
    } catch (error) {
      Alert.alert("Error", "User not found or something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Keyboard Avoiding View */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            className="px-6"
          >
            <View className="items-center mb-10">
              <Image
                source={require("../../../assets/SmartSchoolVanTracker.png")}
                style={{ width: 250, height: 250, resizeMode: "contain" }}
              />
              <Text className="text-2xl font-bold text-gray-800 mt-4">
                Reset Password
              </Text>
              <Text className="text-gray-500 mt-2 text-center">
                We will send a 6-digit verification code to your email.
              </Text>
            </View>

            <View className="w-full">
              <Text className="text-gray-600 font-semibold mb-2 ml-1">
                Email Address
              </Text>
              <TextInput
                className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700 mb-6"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
              />

              <TouchableOpacity
                className="w-full bg-blue-600 p-4 rounded-xl items-center shadow-md active:bg-blue-700"
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold">
                    Send OTP Code
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-6 items-center"
                onPress={() => navigation.goBack()}
              >
                <Text className="text-blue-600 font-bold">Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

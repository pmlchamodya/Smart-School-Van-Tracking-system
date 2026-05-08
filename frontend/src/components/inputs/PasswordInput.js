import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PasswordInput = ({ placeholder, value, onChangeText }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 flex-row items-center">
      <Ionicons name="lock-closed" size={20} color="#2563EB" />
      <TextInput
        className="flex-1 ml-2 text-gray-800"
        placeholder={placeholder || "Enter password"}
        secureTextEntry={!isPasswordVisible} // ඇස ඔබනකොට මේක මාරු වෙනවා
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
      >
        <Ionicons
          name={isPasswordVisible ? "eye-off" : "eye"}
          size={22}
          color="#9CA3AF"
        />
      </TouchableOpacity>
    </View>
  );
};

export default PasswordInput;

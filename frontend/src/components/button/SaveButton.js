import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

const SaveButton = ({ title, onPress, loading }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading} // Loading වෙද්දී ඔබන්න බැරි වෙන්න
      className={`bg-blue-600 p-4 rounded-xl items-center mb-10 ${
        loading ? "opacity-70" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-bold text-lg">
          {title || "Save Changes"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default SaveButton;

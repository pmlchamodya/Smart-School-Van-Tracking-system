import { TouchableOpacity, Text, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

const LogoutButton = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear all stored data
            await AsyncStorage.clear();
            // Reset navigation stack and go to Login
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Logout failed:", error);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      className="flex-row items-center justify-center bg-red-50 p-4 rounded-xl mt-5 w-full"
    >
      <MaterialIcons name="logout" size={24} color="#EF4444" />
      <Text className="text-red-500 font-bold text-lg ml-2">Log Out</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;

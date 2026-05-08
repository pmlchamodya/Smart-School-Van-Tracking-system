import React, { useEffect, useRef } from "react";
import { View, Animated, Image, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // --- Logo Animation (Fade In & Scale Up) ---
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // --- Check Login Status  ---
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        const userRole = await AsyncStorage.getItem("userRole");

        if (userToken && userRole) {
          if (userRole === "admin") navigation.replace("AdminDashboard");
          else if (userRole === "driver") navigation.replace("DriverTabs");
          else if (userRole === "parent") navigation.replace("ParentTabs");
        } else {
          navigation.replace("Login");
        }
      } catch (error) {
        navigation.replace("Login");
      }
    };

    const timer = setTimeout(checkLoginStatus, 4500); // 4.5 seconds delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center p-5">
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* App Logo */}
        <Image
          source={require("../../../assets/SmartSchoolVanTracker.png")}
          style={{ width: 300, height: 300, resizeMode: "contain" }}
        />

        {/* App Name */}
        <Animated.Text
          style={{ opacity: fadeAnim }}
          className="text-blue-600 font-bold text-2xl mt-6 tracking-tighter text-center"
        >
          SMART SCHOOL VAN TRACKER
        </Animated.Text>

        {/* Optional: Small Tagline */}
        <Text className="text-gray-400 text-xs mt-2 uppercase tracking-widest">
          Safety First for our children
        </Text>
      </Animated.View>

      {/* Loading Indicator at the bottom */}
      <View className="absolute bottom-20">
        <Text className="text-gray-300 text-xs">Version 1.0.0</Text>
      </View>
    </View>
  );
};

export default SplashScreen;

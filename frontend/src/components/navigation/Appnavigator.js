// src/navigation/Appnavigator.js (UPDATED FILE)

import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// This path is correct: ../context/AuthContext
import { useAuth } from "../context/AuthContext";

// --- UPDATED IMPORTS ---
// Authnavigator.js is in the same folder (./)
import AuthNavigator from "./Authnavigator";
// Dashboards are one level up (../) and then inside pages/dashboard/
import AdminDashboard from "../pages/dashboard/admin/AdminDashboard";
import DriverDashboard from "../pages/dashboard/driver/DriverDashboard";
import ParentDashboard from "../pages/dashboard/parent/ParentDashboard";
// --- END OF UPDATES ---

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();

  // Show a loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user == null ? (
          // No user logged in
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : // User is logged in, check their role
        userRole === "admin" ? (
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        ) : userRole === "driver" ? (
          <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        ) : (
          // Default to ParentDashboard if not admin or driver
          <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

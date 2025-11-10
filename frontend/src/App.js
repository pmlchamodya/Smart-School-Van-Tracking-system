// App.js

import React from "react";
import { StatusBar } from "expo-status-bar";

// 1. Import the AuthProvider
//    (This provides data about the logged-in user to your entire app)
import { AuthProvider } from "./src/context/AuthContext";

// 2. Import the main AppNavigator
//    (This checks if the user is logged in, what their role is, and shows the correct screen)
import AppNavigator from "./src/navigation/Appnavigator";

export default function App() {
  return (
    // 3. Wrap the entire AppNavigator with the AuthProvider
    //    so that all screens can access the auth state (user, role, etc.)
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

// You don't need styles in this file anymore.

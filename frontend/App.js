import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Import Screens
import SplashScreen from "./src/screens/common/SplashScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import VerifyOTPScreen from "./src/screens/auth/VerifyOTPScreen";
import AdminDashboard from "./src/screens/admin/AdminDashboard";
import DriverDashboard from "./src/screens/driver/DriverDashboard";
import ParentDashboard from "./src/screens/parent/ParentDashboard";
import AddChildScreen from "./src/screens/parent/child/AddChildScreen";
import ParentProfileScreen from "./src/screens/parent/ParentProfileScreen";
import EditChildScreen from "./src/screens/parent/child/EditChildScreen";
import EditProfileScreen from "./src/screens/parent/EditProfileScreen";
import DriverProfileScreen from "./src/screens/driver/DriverProfileScreen";
import EditDriverProfileScreen from "./src/screens/driver/EditDriverProfileScreen";
import DriverSetupScreen from "./src/screens/driver/DriverSetupScreen";
import ParentSetupScreen from "./src/screens/parent/ParentSetupScreen";
import ChangePasswordScreen from "./src/screens/common/ChangePasswordScreen";
import DriverMapScreen from "./src/screens/driver/DriverMapScreen";
import ParentMapScreen from "./src/screens/parent/ParentMapScreen";
import FindDriverScreen from "./src/screens/driver/FindDriverScreen";
import DriverPaymentScreen from "./src/screens/driver/DriverPaymentScreen";
import ParentPaymentScreen from "./src/screens/parent/ParentPaymentScreen";
import PaymentGatewayScreen from "./src/screens/parent/PaymentGatewayScreen";
import IncomeReportScreen from "./src/screens/driver/IncomeReportScreen";
import LocationPickerScreen from "./src/screens/parent/LocationPickerScreen";
import ManageDriversScreen from "./src/screens/admin/ManageDriversScreen";
import ManageParentsScreen from "./src/screens/admin/ManageParentsScreen";
import ManageStudentsScreen from "./src/screens/admin/ManageStudentsScreen";
import AttendanceReportScreen from "./src/screens/parent/AttendanceReportScreen";
import DriverStudentsScreen from "./src/screens/driver/DriverStudentsScreen";
import StudentDetailsScreen from "./src/screens/driver/StudentDetailsScreen";
import ParentDriversScreen from "./src/screens/parent/ParentDriversScreen";

// Navigation Setup
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Standard Tab Bar ---
const standardTabStyle = {
  backgroundColor: "#ffffff",
  height: Platform.OS === "ios" ? 85 : 65,
  borderTopWidth: 1,
  borderTopColor: "#E5E7EB",
  paddingBottom: Platform.OS === "ios" ? 25 : 10,
  paddingTop: 10,
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: -3 },
};

// 1. Parent Bottom Tabs

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "bold", marginTop: -5 },
        tabBarStyle: standardTabStyle,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "ParentHome")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "ParentDrivers")
            iconName = focused ? "bus" : "bus-outline";
          else if (route.name === "ParentPayments")
            iconName = focused ? "receipt" : "receipt-outline";
          else if (route.name === "ParentProfile")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ParentHome"
        component={ParentDashboard}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="ParentDrivers"
        component={ParentDriversScreen}
        options={{ title: "Drivers" }}
      />
      <Tab.Screen
        name="ParentPayments"
        component={ParentPaymentScreen}
        options={{ title: "Payments" }}
      />
      <Tab.Screen
        name="ParentProfile"
        component={ParentProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// 2. Driver Bottom Tabs

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          marginTop: -5,
        },
        tabBarStyle: standardTabStyle,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "DriverHome")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "DriverStudents")
            iconName = focused ? "people" : "people-outline";
          else if (route.name === "DriverPayments")
            iconName = focused ? "wallet" : "wallet-outline";
          else if (route.name === "DriverProfile")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverDashboard}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="DriverStudents"
        component={DriverStudentsScreen}
        options={{ title: "Students" }}
      />
      <Tab.Screen
        name="DriverPayments"
        component={DriverPaymentScreen}
        options={{ title: "Payments" }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// Main App Stack

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          {/* --- Splash Screen --- */}
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: "Reset Password" }}
          />
          <Stack.Screen
            name="VerifyOTP"
            component={VerifyOTPScreen}
            options={{ title: "Verify OTP" }}
          />

          <Stack.Screen
            name="ParentTabs"
            component={ParentTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DriverTabs"
            component={DriverTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageDrivers"
            component={ManageDriversScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageParents"
            component={ManageParentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageStudents"
            component={ManageStudentsScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="DriverSetup"
            component={DriverSetupScreen}
            options={{ title: "Driver Setup" }}
          />
          <Stack.Screen
            name="ParentSetup"
            component={ParentSetupScreen}
            options={{ title: "Parent Setup" }}
          />

          <Stack.Screen
            name="AddChild"
            component={AddChildScreen}
            options={{ title: "Add Child" }}
          />
          <Stack.Screen
            name="EditChild"
            component={EditChildScreen}
            options={{ title: "Edit Child" }}
          />
          <Stack.Screen
            name="AttendanceReport"
            component={AttendanceReportScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="DriverMap"
            component={DriverMapScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ParentMap"
            component={ParentMapScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PaymentGateway"
            component={PaymentGatewayScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="IncomeReport"
            component={IncomeReportScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LocationPicker"
            component={LocationPickerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FindDriver"
            component={FindDriverScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Edit Profile" }}
          />
          <Stack.Screen
            name="EditDriverProfile"
            component={EditDriverProfileScreen}
            options={{ title: "Edit Driver Details" }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: "Change Password" }}
          />

          <Stack.Screen
            name="StudentDetails"
            component={StudentDetailsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

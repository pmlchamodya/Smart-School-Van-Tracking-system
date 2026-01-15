import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import Screens
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
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

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          {/* Define the Login Screen */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          {/* Define the Register Screen */}
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
          {/* Define the Admin Dashboard Screen */}
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
          {/* Define the Driver Dashboard Screen */}
          <Stack.Screen
            name="DriverDashboard"
            component={DriverDashboard}
            options={{ headerShown: false }}
          />
          {/* Define the Driver Setup Screen */}
          <Stack.Screen
            name="DriverSetup"
            component={DriverSetupScreen}
            options={{ title: "Driver Setup", headerShown: true }}
          />
          {/* Define the Driver Profile Screen */}
          <Stack.Screen
            name="DriverProfile"
            component={DriverProfileScreen}
            options={{ title: "Driver Profile", headerBackTitle: "Back" }}
          />
          {/* Define the Edit Driver Profile Screen */}
          <Stack.Screen
            name="EditDriverProfile"
            component={EditDriverProfileScreen}
            options={{ title: "Edit Driver Details", headerShown: true }}
          />

          {/* Define the Parent Dashboard Screen */}
          <Stack.Screen
            name="ParentDashboard"
            component={ParentDashboard}
            options={{ headerShown: false }}
          />
          {/* Define the Parent Setup Screen */}
          <Stack.Screen
            name="ParentSetup"
            component={ParentSetupScreen}
            options={{ title: "Parent Setup", headerShown: true }}
          />

          {/* Define the Add Child Screen */}
          <Stack.Screen
            name="AddChild"
            component={AddChildScreen}
            options={{ headerShown: true, title: "Add Child" }}
          />
          {/* Define the Edit Child Screen */}
          <Stack.Screen
            name="EditChild"
            component={EditChildScreen}
            options={{ title: "Edit Child" }}
          />
          {/* Define the Parent Profile Screen */}
          <Stack.Screen
            name="ParentProfile"
            component={ParentProfileScreen}
            options={{ title: "My Profile", headerBackTitle: "Back" }}
          />
          {/* Define the Edit Profile Screen */}
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: "Edit Profile", headerShown: true }}
          />

          {/* Future Screens for Dashboard will be added here */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

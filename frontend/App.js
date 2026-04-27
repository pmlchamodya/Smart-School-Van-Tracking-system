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
import ChangePasswordScreen from "./src/screens/common/ChangePasswordScreen";
import DriverMapScreen from "./src/screens/driver/DriverMapScreen";
import ParentMapScreen from "./src/screens/parent/ParentMapScreen";
import FindDriverScreen from "./src/screens/driver/FindDriverScreen";
import DriverPaymentScreen from "./src/screens/driver/DriverPaymentScreen";
import ParentPaymentScreen from "./src/screens/parent/ParentPaymentScreen";
import PaymentGatewayScreen from "./src/screens/parent/PaymentGatewayScreen";
import IncomeReportScreen from "./src/screens/driver/IncomeReportScreen";
import LocationPickerScreen from "./src/screens/parent/LocationPickerScreen";

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
          {/* Define the Driver Map Screen */}
          <Stack.Screen
            name="DriverMap"
            component={DriverMapScreen}
            options={{ headerShown: false }}
          />
          {/* Define the Find Driver Screen */}
          <Stack.Screen
            name="FindDriver"
            component={FindDriverScreen}
            options={{ headerShown: false }}
          />
          {/* Define the Income Report Screen */}
          <Stack.Screen
            name="IncomeReport"
            component={IncomeReportScreen}
            options={{ headerShown: false }}
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
          {/* Define the Parent Map Screen */}
          <Stack.Screen
            name="ParentMap"
            component={ParentMapScreen}
            options={{ headerShown: false }}
          />
          {/* Define the Location Picker Screen */}
          <Stack.Screen
            name="LocationPicker"
            component={LocationPickerScreen}
            options={{ title: "Select Location", headerShown: false }}
          />
          {/* Define the Driver Payment Screen */}
          <Stack.Screen
            name="DriverPayments"
            component={DriverPaymentScreen}
            options={{ headerShown: false }}
          />

          {/* Define the Parent Payment Screen */}
          <Stack.Screen
            name="ParentPayments"
            component={ParentPaymentScreen}
            options={{ headerShown: false }}
          />

          {/* Define the Payment Gateway Screen */}
          <Stack.Screen
            name="PaymentGateway"
            component={PaymentGatewayScreen}
            options={{ headerShown: false }}
          />

          {/* Define the Change Password Screen */}
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: "Change Password", headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

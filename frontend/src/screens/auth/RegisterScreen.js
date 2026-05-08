import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import api from "../../services/api";
import PasswordInput from "../../components/inputs/PasswordInput";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("parent");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phoneNumber || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/users/register", {
        name,
        email,
        phoneNumber,
        password,
        role,
      });

      if (response.status === 201) {
        Alert.alert("Success", "Account created successfully!", [
          { text: "Login Now", onPress: () => navigation.navigate("Login") },
        ]);
      }
    } catch (error) {
      console.log(error);
      if (error.response) {
        Alert.alert("Registration Failed", error.response.data.message);
      } else {
        Alert.alert("Error", "Something went wrong. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* --- LOGO --- */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/SmartSchoolVanTracker.png")}
          style={{ width: 200, height: 200, resizeMode: "contain" }}
        />
      </View>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Join as a {role === "parent" ? "Parent" : "Driver"}
      </Text>

      {/* Role Selection Buttons */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "parent" && styles.activeRoleButton,
          ]}
          onPress={() => setRole("parent")}
        >
          <Text
            style={[
              styles.roleText,
              role === "parent" && styles.activeRoleText,
            ]}
          >
            Parent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "driver" && styles.activeRoleButton,
          ]}
          onPress={() => setRole("driver")}
        >
          <Text
            style={[
              styles.roleText,
              role === "driver" && styles.activeRoleText,
            ]}
          >
            Driver
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <PasswordInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />

      {/* Register Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      {/* Link to Login */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeRoleButton: {
    backgroundColor: "#007bff",
  },
  roleText: {
    fontSize: 16,
    color: "#333",
  },
  activeRoleText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    marginTop: 20,
    color: "#007bff",
    textAlign: "center",
  },
});

export default RegisterScreen;

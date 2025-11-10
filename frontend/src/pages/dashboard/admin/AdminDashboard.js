import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../../components/context/AuthContext";

export default function AdminDashboard() {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold" },
});

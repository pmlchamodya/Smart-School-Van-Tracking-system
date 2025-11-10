import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useAuth } from "../../components/context/AuthContext";

export default function ParentDashboard() {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Dashboard</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold" },
});

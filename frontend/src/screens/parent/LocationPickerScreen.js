import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

const LocationPickerScreen = ({ route, navigation }) => {
  // Get existing data passed from AddChild
  const { existingData, initialLocation } = route.params || {};

  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. If we already have a selected location, use it.
      if (initialLocation) {
        setRegion({
          ...initialLocation,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setLoading(false);
      } else {
        // 2. Otherwise, get current location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setRegion({
            latitude: 6.9271,
            longitude: 79.8612,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirmLocation = () => {
    // navigate method with 'merge: true' helps to return to the EXISTING screen
    navigation.navigate({
      name: "AddChild",
      params: {
        selectedLocation: {
          latitude: region.latitude,
          longitude: region.longitude,
        },
        returnedData: existingData,
      },
      merge: true, // This is very important to avoid stack issues!
    });
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={(r) => setRegion(r)}
        showsUserLocation={true}
      />
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Ionicons name="location-sharp" size={45} color="#EF4444" />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmLocation}
        >
          <Text style={styles.confirmButtonText}>Confirm Pickup Point</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  centerPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -22,
    marginTop: -45,
  },
  footer: { position: "absolute", bottom: 40, left: 20, right: 20 },
  confirmButton: {
    backgroundColor: "#2563EB",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  confirmButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});

export default LocationPickerScreen;

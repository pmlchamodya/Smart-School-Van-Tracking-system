import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Callout,
  Polyline,
} from "react-native-maps";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const DriverMapScreen = ({ route, navigation }) => {
  const { initialRegion, students } = route.params;

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [isRouting, setIsRouting] = useState(false);

  const waitingStudents = students
    ? students.filter(
        (student) => !student.isAbsent && student.status === "safe",
      )
    : [];

  useEffect(() => {
    if (selectedStudent && selectedStudent.location && initialRegion) {
      const getRoute = async () => {
        setIsRouting(true);
        try {
          const startLoc = `${initialRegion.longitude},${initialRegion.latitude}`;
          const endLoc = `${selectedStudent.location.longitude},${selectedStudent.location.latitude}`;

          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${startLoc};${endLoc}?geometries=geojson`,
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(
              (coord) => ({
                latitude: coord[1],
                longitude: coord[0],
              }),
            );
            setRouteCoords(coordinates);
          }
        } catch (error) {
          console.error("Failed to fetch route:", error);
        } finally {
          setIsRouting(false);
        }
      };

      getRoute();
    } else {
      setRouteCoords([]);
    }
  }, [selectedStudent, initialRegion]);

  // --- NEW: Smart Navigation Launcher with User Choice ---
  const openExternalNavigation = (student) => {
    if (!student || !student.location) return;

    const lat = student.location.latitude;
    const lng = student.location.longitude;

    if (Platform.OS === "ios") {
      // If iOS, show an alert for the driver to choose the app
      Alert.alert(
        "Select Navigation App",
        "Which app do you want to use for live navigation?",
        [
          {
            text: "Google Maps",
            onPress: () => {
              const googleUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
              const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
              // Fallback to web browser if Google Maps app is not installed
              Linking.openURL(googleUrl).catch(() =>
                Linking.openURL(webFallback),
              );
            },
          },
          {
            text: "Apple Maps",
            onPress: () => {
              Linking.openURL(
                `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
              );
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
    } else {
      // If Android, directly open Google Maps navigation
      Linking.openURL(`google.navigation:q=${lat},${lng}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Marker coordinate={initialRegion} zIndex={3}>
          <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-md">
            <MaterialCommunityIcons
              name="van-passenger"
              size={24}
              color="white"
            />
          </View>
        </Marker>

        {waitingStudents.map((student) => {
          if (student.location && student.location.latitude) {
            return (
              <Marker
                key={student._id}
                coordinate={{
                  latitude: student.location.latitude,
                  longitude: student.location.longitude,
                }}
                zIndex={2}
                onPress={() => setSelectedStudent(student)}
              >
                <View className="items-center">
                  <View className="bg-red-500 p-2 rounded-full border-2 border-white shadow-md">
                    <FontAwesome5
                      name="user-graduate"
                      size={14}
                      color="white"
                    />
                  </View>
                  <View className="bg-white/90 px-2 py-0.5 rounded-md mt-1 border border-gray-200">
                    <Text className="text-[10px] font-bold text-gray-800">
                      {student.name}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          }
          return null;
        })}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#2563EB"
            lineJoin="round"
          />
        )}
      </MapView>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="black" />
      </TouchableOpacity>

      <View style={styles.infoCard}>
        {selectedStudent ? (
          <View className="items-center w-full">
            {isRouting ? (
              <View className="flex-row items-center mb-3">
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                  className="mr-2"
                />
                <Text className="text-gray-500 font-bold">
                  Drawing route preview...
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-gray-800 font-bold mb-1 text-base">
                  Target: {selectedStudent.name}
                </Text>
                <Text className="text-gray-500 text-xs mb-3 text-center">
                  {selectedStudent.pickupLocation || selectedStudent.school}
                </Text>

                <TouchableOpacity
                  onPress={() => openExternalNavigation(selectedStudent)}
                  className="bg-green-600 w-full py-3 rounded-xl flex-row justify-center items-center shadow-sm"
                >
                  <FontAwesome5 name="directions" size={18} color="white" />
                  <Text className="text-white font-bold ml-2 text-base">
                    Start Live Navigation
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.infoText}>Select a student to see the route</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    alignItems: "center",
  },
  infoText: {
    color: "#374151",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default DriverMapScreen;

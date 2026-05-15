import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Keyboard,
  Linking,
  StyleSheet,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import socket from "../../services/socket";
import { useFocusEffect } from "@react-navigation/native";

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0F2D5A",
  blue: "#1A4FA0",
  blueMid: "#2563EB",
  blueLight: "#EBF2FF",
  amber: "#F59E0B",
  amberLight: "#FEF9EC",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  red: "#DC2626",
  redLight: "#FEF2F2",
  orange: "#EA580C",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray400: "#94A3B8",
  gray600: "#475569",
  gray800: "#1E293B",
  white: "#FFFFFF",
};

// ─── Distance Helper ──────────────────────────────────────────────────────────
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.floor(R * c);
};

const DriverDashboard = ({ navigation }) => {
  const [driverName, setDriverName] = useState("");
  const [driverId, setDriverId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [vanDetails, setVanDetails] = useState(null);
  const [mobile, setMobile] = useState("");
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifiedStudents, setNotifiedStudents] = useState({});
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [customAlertMsg, setCustomAlertMsg] = useState("");
  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to show your current position.",
        );
        return;
      }
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.log("Error getting location:", error);
    }
  };

  useEffect(() => {
    let locationSubscription;
    const startTracking = async () => {
      if (isJourneyStarted && driverId) {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setRegion((prev) => ({ ...prev, latitude, longitude }));
            socket.emit("sendLocation", {
              driverId: String(driverId).trim(),
              latitude,
              longitude,
            });
          },
        );
      }
    };
    if (isJourneyStarted) {
      startTracking();
    } else {
      if (locationSubscription) locationSubscription.remove();
    }
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isJourneyStarted, driverId]);

  useEffect(() => {
    if (isJourneyStarted && students.length > 0) {
      students.forEach((student) => {
        if (
          !student.isAbsent &&
          student.status === "safe" &&
          student.location
        ) {
          const distanceInMeters = getDistance(
            region.latitude,
            region.longitude,
            student.location.latitude,
            student.location.longitude,
          );
          if (distanceInMeters <= 1000 && !notifiedStudents[student._id]) {
            socket.emit("notify_parent", {
              parentId: student.parent_id?._id || student.parent_id,
              title: "Van is arriving soon! ⏰",
              message: `The school van is approx 3 minutes away to pick up ${student.name}. Please get ready!`,
            });
            setNotifiedStudents((prev) => ({ ...prev, [student._id]: true }));
          }
        }
      });
    }
  }, [region, isJourneyStarted, students]);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const id = await AsyncStorage.getItem("userId");
      if (id) {
        setDriverId(id);
        const userRes = await api.get(`/users/profile/${id}`);
        const user = userRes.data;
        if (user) {
          if (!user.vanDetails || !user.vanDetails.vehicleNo) {
            navigation.replace("DriverSetup");
            return;
          }
          setDriverName(user.name);
          setProfileImage(user.profileImage);
          setMobile(user.phoneNumber);
          setVanDetails(user.vanDetails || {});
        }
        const childRes = await api.get(`/children/driver/${id}`);
        setStudents(childRes.data);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDriverData();
      getCurrentLocation();
    }, []),
  );

  useEffect(() => {
    if (driverId) {
      socket.on(`refreshDriver_${driverId}`, () => {
        loadDriverData();
      });
    }
    return () => {
      if (driverId) socket.off(`refreshDriver_${driverId}`);
    };
  }, [driverId]);

  // --- 4-Step Status Logic ---
  const confirmToggleStatus = (child) => {
    let newStatus =
      child.status === "safe"
        ? "in-van"
        : child.status === "in-van"
          ? "school"
          : child.status === "school"
            ? "returning"
            : "safe";

    let statusText =
      newStatus === "in-van"
        ? "Picked Up (Going to School)"
        : newStatus === "school"
          ? "Dropped at School"
          : newStatus === "returning"
            ? "Picked Up (Coming Home)"
            : "Dropped at Home (Safe)";

    Alert.alert(
      "Confirm Status Change",
      `Are you sure you want to mark ${child.name} as '${statusText}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Update",
          onPress: () => toggleStudentStatus(child._id, child.status),
        },
      ],
    );
  };

  const toggleStudentStatus = async (childId, currentStatus) => {
    let newStatus =
      currentStatus === "safe"
        ? "in-van"
        : currentStatus === "in-van"
          ? "school"
          : currentStatus === "school"
            ? "returning"
            : "safe";
    try {
      await api.put(`/children/${childId}`, { status: newStatus });
      setStudents((prev) =>
        prev.map((c) => (c._id === childId ? { ...c, status: newStatus } : c)),
      );

      const targetChild = students.find((c) => c._id === childId);
      if (targetChild && targetChild.parent_id) {
        let title = "Status Update";
        let message = `Status changed to ${newStatus}.`;

        if (newStatus === "in-van") {
          title = "Picked Up! 🚐";
          message = `${targetChild.name} has safely boarded the van.`;
        } else if (newStatus === "school") {
          title = "Dropped at School! 🏫";
          message = `${targetChild.name} has been dropped off at school.`;
        } else if (newStatus === "returning") {
          title = "Picked Up from School! 🚐";
          message = `${targetChild.name} is in the van and coming back home.`;
        } else if (newStatus === "safe") {
          title = "Safely Home! 🏡";
          message = `${targetChild.name} has been dropped off at home safely.`;
        }

        socket.emit("notify_parent", {
          parentId: targetChild.parent_id?._id || targetChild.parent_id,
          title: title,
          message: message,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const toggleJourney = () => {
    if (isJourneyStarted) {
      Alert.alert("End Journey", "Are you sure you want to end the journey?", [
        {
          text: "Yes",
          onPress: () => {
            setIsJourneyStarted(false);
            setNotifiedStudents({});
            if (driverId) {
              socket.emit("journeyEnded", { driverId: driverId });
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setIsJourneyStarted(true);
      setNotifiedStudents({});

      students.forEach((student) => {
        if (!student.isAbsent && student.status === "safe") {
          socket.emit("notify_parent", {
            parentId: student.parent_id?._id || student.parent_id,
            title: "Driver is on the way! 🚐",
            message: `The school van has started its journey to pick up ${student.name}.`,
          });
        }
      });

      if (driverId && region.latitude) {
        socket.emit("sendLocation", {
          driverId: String(driverId).trim(),
          latitude: region.latitude,
          longitude: region.longitude,
        });
      }

      Alert.alert("Journey Started", "All parents have been notified.");
    }
  };

  const sendBroadcastAlert = (message) => {
    Keyboard.dismiss();
    if (!message) {
      Alert.alert("Error", "Please enter or select a message to send.");
      return;
    }

    const uniqueParentIds = [
      ...new Set(students.map((s) => s.parent_id?._id || s.parent_id)),
    ];

    if (uniqueParentIds.length === 0) {
      Alert.alert("No Parents", "You don't have any students assigned yet.");
      return;
    }

    const vehicleTitle = vanDetails?.vehicleNo
      ? ` (Van: ${vanDetails.vehicleNo})`
      : "";

    uniqueParentIds.forEach((parentId) => {
      socket.emit("notify_parent", {
        parentId: parentId,
        title: `🚨 Message from ${driverName}${vehicleTitle}`,
        message: message,
      });
    });

    Alert.alert("Broadcast Sent! 📢", "Message has been sent to all parents.");
    setAlertModalVisible(false);
    setCustomAlertMsg("");
  };

  // Occupancy calculations
  const totalSeats = parseInt(vanDetails?.seats) || 0;
  const expectedToday = students.filter((s) => !s.isAbsent).length;
  const currentlyInVan = students.filter(
    (s) => s.status === "in-van" || s.status === "returning",
  ).length;
  const fillPercentage =
    totalSeats > 0 ? (currentlyInVan / totalSeats) * 100 : 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {/* Info */}
            <View style={styles.driverInfoBlock}>
              <Text style={styles.greetingLabel}>Hello Driver,</Text>
              <Text style={styles.driverName}>{driverName}</Text>
              <View style={styles.mobileRow}>
                <Ionicons name="call-outline" size={12} color={C.gray400} />
                <Text style={styles.mobileText}>{mobile || "No Mobile"}</Text>
              </View>
            </View>

            {/* Avatar */}
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverProfile")}
              style={styles.avatarWrapper}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarImage, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>D</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>

          {/* Van badge */}
          {vanDetails?.vehicleNo && (
            <View style={styles.vanBadge}>
              <MaterialCommunityIcons
                name="van-passenger"
                size={14}
                color={C.amber}
              />
              <Text style={styles.vanBadgeText}>
                Van: {vanDetails.vehicleNo}
              </Text>
              {vanDetails?.seats && <Text style={styles.vanBadgeSep}> · </Text>}
              {vanDetails?.seats && (
                <Text style={styles.vanBadgeText}>
                  {vanDetails.seats} Seats
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Live Location Map ── */}
        <Text style={styles.sectionLabel}>Live Location</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate("DriverMap", {
              initialRegion: region,
              students: students,
            })
          }
          style={styles.mapWrapper}
        >
          <MapView
            style={styles.map}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            showsUserLocation={true}
          >
            <Marker coordinate={region} title="My Current Location">
              <View style={styles.mapMarker}>
                <MaterialCommunityIcons
                  name="van-passenger"
                  size={20}
                  color={C.white}
                />
              </View>
            </Marker>
          </MapView>
          <View style={styles.mapExpandHint}>
            <Ionicons name="expand-outline" size={12} color={C.white} />
            <Text style={styles.mapExpandText}> Tap to Expand</Text>
          </View>
        </TouchableOpacity>

        {/* ── Broadcast Alert Button ── */}
        <TouchableOpacity
          onPress={() => setAlertModalVisible(true)}
          style={styles.broadcastBtn}
          activeOpacity={0.88}
        >
          <View style={styles.broadcastIconBox}>
            <Ionicons name="warning" size={24} color={C.red} />
          </View>
          <View style={styles.broadcastTextBox}>
            <Text style={styles.broadcastTitle}>Broadcast Alert</Text>
            <Text style={styles.broadcastSub}>
              Send urgent message to all parents
            </Text>
          </View>
          <MaterialCommunityIcons name="broadcast" size={22} color={C.red} />
        </TouchableOpacity>

        {/* ── Journey Control Button ── */}
        <TouchableOpacity
          onPress={toggleJourney}
          style={[
            styles.journeyBtn,
            isJourneyStarted ? styles.journeyBtnEnd : styles.journeyBtnStart,
          ]}
          activeOpacity={0.88}
        >
          <Ionicons
            name={
              isJourneyStarted ? "stop-circle-outline" : "play-circle-outline"
            }
            size={26}
            color={C.white}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.journeyBtnText}>
            {isJourneyStarted ? "END JOURNEY" : "START JOURNEY"}
          </Text>
        </TouchableOpacity>

        {/* ── Payments Button ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate("DriverPayments")}
          style={styles.paymentsBtn}
          activeOpacity={0.88}
        >
          <View style={styles.paymentsBtnIconBox}>
            <MaterialIcons
              name="account-balance-wallet"
              size={26}
              color={C.white}
            />
          </View>
          <View style={styles.paymentsBtnTextBox}>
            <Text style={styles.paymentsBtnTitle}>Manage Payments</Text>
            <Text style={styles.paymentsBtnSub}>View bills & collect cash</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>

        {/* ── Occupancy Tracker ── */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyTitle}>Live Occupancy</Text>
            <View style={styles.occupancyBadge}>
              <Text style={styles.occupancyBadgeText}>
                {currentlyInVan} / {totalSeats} Seats
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(fillPercentage, 100)}%`,
                  backgroundColor: fillPercentage >= 100 ? C.red : C.amber,
                },
              ]}
            />
          </View>

          <View style={styles.occupancyFooter}>
            <Text style={styles.occupancyFooterText}>
              Expected Today:{" "}
              <Text style={styles.occupancyFooterBold}>{expectedToday}</Text>
            </Text>
            <Text style={styles.occupancyFooterText}>
              Absent Today:{" "}
              <Text style={[styles.occupancyFooterBold, { color: C.red }]}>
                {students.length - expectedToday}
              </Text>
            </Text>
          </View>
        </View>

        {/* ── Students List ── */}
        <Text style={styles.sectionLabel}>Your Students</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={C.blueMid}
            style={{ marginTop: 20 }}
          />
        ) : students.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="account-group"
              size={44}
              color={C.gray200}
            />
            <Text style={styles.emptyText}>No students assigned yet.</Text>
          </View>
        ) : (
          students.map((child) => {
            const isInVan =
              child.status === "in-van" || child.status === "returning";

            // Card accent color
            const accentColor = child.isAbsent
              ? C.red
              : isInVan
                ? C.amber
                : C.green;

            return (
              <View
                key={child._id}
                style={[
                  styles.studentCard,
                  child.isAbsent
                    ? styles.studentCardAbsent
                    : isInVan
                      ? styles.studentCardInVan
                      : styles.studentCardDefault,
                ]}
              >
                {/* Accent bar */}
                <View
                  style={[
                    styles.studentCardAccent,
                    { backgroundColor: accentColor },
                  ]}
                />

                <TouchableOpacity
                  style={styles.studentCardBody}
                  onPress={() =>
                    navigation.navigate("StudentDetails", { student: child })
                  }
                >
                  {/* Name row */}
                  <View style={styles.studentNameRow}>
                    <Text style={styles.studentName}>{child.name}</Text>
                    <Ionicons
                      name="information-circle-outline"
                      size={15}
                      color={C.gray400}
                    />
                  </View>

                  {/* School */}
                  <Text style={styles.studentSchool}>{child.school}</Text>

                  {/* Status badge */}
                  {child.isAbsent ? (
                    <View style={styles.absentBadge}>
                      <Text style={styles.absentBadgeText}>🔴 ABSENT</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.statusBadge,
                        isInVan
                          ? styles.statusBadgeInVan
                          : child.status === "safe"
                            ? styles.statusBadgeSafe
                            : styles.statusBadgeSchool,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isInVan
                            ? styles.statusTextInVan
                            : child.status === "safe"
                              ? styles.statusTextSafe
                              : styles.statusTextSchool,
                        ]}
                      >
                        {child.status === "in-van"
                          ? "Going to School"
                          : child.status === "returning"
                            ? "Coming Home"
                            : child.status === "school"
                              ? "At School"
                              : "Safe"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Status Toggle Button */}
                {!child.isAbsent && (
                  <TouchableOpacity
                    onPress={() => confirmToggleStatus(child)}
                    style={[
                      styles.statusToggleBtn,
                      isInVan
                        ? styles.statusToggleBtnActive
                        : styles.statusToggleBtnIdle,
                    ]}
                  >
                    <FontAwesome5
                      name={isInVan ? "walking" : "bus"}
                      size={18}
                      color={isInVan ? C.amber : C.blueMid}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Broadcast Alert Modal ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => Keyboard.dismiss()}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
            style={styles.modalCard}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalWarningIcon}>
                  <Ionicons name="warning" size={22} color={C.red} />
                </View>
                <Text style={styles.modalTitle}>Emergency Alert</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setAlertModalVisible(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={C.gray600} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a quick message or type your own to notify all parents
              instantly.
            </Text>

            {/* Quick message options */}
            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "🚐 Heavy Traffic! I will be delayed by 15-20 minutes.",
                )
              }
              style={[styles.quickMsgBtn, styles.quickMsgBtnOrange]}
            >
              <Text style={[styles.quickMsgText, { color: "#92400E" }]}>
                🚐 Heavy Traffic – Running Late
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "🌧️ Bad Weather! Driving slowly, expect slight delays.",
                )
              }
              style={[styles.quickMsgBtn, styles.quickMsgBtnBlue]}
            >
              <Text style={[styles.quickMsgText, { color: "#1E3A5F" }]}>
                🌧️ Bad Weather – Expect Delays
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                sendBroadcastAlert(
                  "⚠️ Van Breakdown! Please hold on, arranging alternative transport.",
                )
              }
              style={[styles.quickMsgBtn, styles.quickMsgBtnRed]}
            >
              <Text style={[styles.quickMsgText, { color: C.red }]}>
                ⚠️ Van Breakdown – Urgent!
              </Text>
            </TouchableOpacity>

            {/* Custom message */}
            <Text style={styles.customMsgLabel}>Or type a custom message:</Text>
            <TextInput
              style={styles.customMsgInput}
              placeholder="E.g. Leaving school in 5 mins..."
              placeholderTextColor={C.gray400}
              multiline
              textAlignVertical="top"
              value={customAlertMsg}
              onChangeText={setCustomAlertMsg}
            />

            {/* Send button */}
            <TouchableOpacity
              onPress={() => sendBroadcastAlert(customAlertMsg)}
              style={styles.sendBtn}
            >
              <Ionicons name="send" size={18} color={C.white} />
              <Text style={styles.sendBtnText}>Send to All Parents</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF4FF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 20,
  },

  // Header
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  driverInfoBlock: {},
  greetingLabel: {
    fontSize: 12,
    color: C.gray1000,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  driverName: {
    fontSize: 24,
    fontWeight: "800",
    color: C.navy,
    letterSpacing: -0.4,
    marginTop: 1,
    marginBottom: 4,
  },
  mobileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mobileText: {
    fontSize: 12,
    color: C.gray1000,
    marginLeft: 3,
  },
  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: C.white,
  },
  avatarFallback: {
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: C.white,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.white,
  },
  vanBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1917",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  vanBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.amber,
    marginLeft: 4,
  },
  vanBadgeSep: {
    color: "#78716C",
    fontSize: 12,
  },

  // Section label
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: C.navy,
    marginBottom: 10,
  },

  // Map
  mapWrapper: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapMarker: {
    backgroundColor: C.blueMid,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.white,
  },
  mapExpandHint: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  mapExpandText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "600",
  },

  // Broadcast
  broadcastBtn: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  broadcastIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.redLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  broadcastTextBox: {
    flex: 1,
  },
  broadcastTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.red,
  },
  broadcastSub: {
    fontSize: 11,
    color: "#F87171",
    marginTop: 2,
  },

  // Journey button
  journeyBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  journeyBtnStart: {
    backgroundColor: C.blue,
    shadowColor: C.navy,
  },
  journeyBtnEnd: {
    backgroundColor: C.red,
    shadowColor: C.red,
  },
  journeyBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  // Payments button
  paymentsBtn: {
    backgroundColor: C.green,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentsBtnIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  paymentsBtnTextBox: { flex: 1 },
  paymentsBtnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
  paymentsBtnSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },

  // Occupancy
  occupancyCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.gray100,
  },
  occupancyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  occupancyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.navy,
  },
  occupancyBadge: {
    backgroundColor: C.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  occupancyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.blueMid,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: C.gray100,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 10,
  },
  occupancyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  occupancyFooterText: {
    fontSize: 12,
    color: C.gray400,
    fontWeight: "500",
  },
  occupancyFooterBold: {
    fontWeight: "700",
    color: C.gray800,
  },

  // Student card
  studentCard: {
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  studentCardDefault: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.gray100,
  },
  studentCardAbsent: {
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  studentCardInVan: {
    backgroundColor: C.amberLight,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  studentCardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  studentCardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 8,
  },
  studentNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "800",
    color: C.navy,
  },
  studentSchool: {
    fontSize: 11,
    color: C.gray600,
    marginBottom: 7,
  },

  // Status badges
  absentBadge: {
    backgroundColor: "#FECACA",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  absentBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.red,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeInVan: { backgroundColor: "#FDE68A" },
  statusBadgeSafe: { backgroundColor: "#BBF7D0" },
  statusBadgeSchool: { backgroundColor: C.gray100 },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusTextInVan: { color: "#92400E" },
  statusTextSafe: { color: C.green },
  statusTextSchool: { color: C.gray600 },

  // Status toggle
  statusToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginLeft: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusToggleBtnIdle: {
    backgroundColor: C.blueLight,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  statusToggleBtnActive: {
    backgroundColor: C.amberLight,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  // Empty
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderStyle: "dashed",
    marginBottom: 12,
  },
  emptyText: {
    color: C.gray400,
    marginTop: 10,
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10,22,50,0.65)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalWarningIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.redLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.navy,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: C.gray400,
    marginBottom: 14,
    lineHeight: 18,
  },
  quickMsgBtn: {
    padding: 13,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  quickMsgBtnOrange: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  quickMsgBtnBlue: {
    backgroundColor: C.blueLight,
    borderColor: "#BFDBFE",
  },
  quickMsgBtnRed: {
    backgroundColor: C.redLight,
    borderColor: "#FECACA",
  },
  quickMsgText: {
    fontSize: 13,
    fontWeight: "600",
  },
  customMsgLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  customMsgInput: {
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 14,
    padding: 14,
    minHeight: 80,
    fontSize: 13,
    color: C.gray800,
  },
  sendBtn: {
    backgroundColor: C.red,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 15,
    marginLeft: 10,
  },
});

export default DriverDashboard;

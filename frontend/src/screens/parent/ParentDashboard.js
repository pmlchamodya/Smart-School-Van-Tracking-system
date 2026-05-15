import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
  LinearGradient,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import socket from "../../services/socket";
import { useFocusEffect } from "@react-navigation/native";

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: "#0F2D5A", // deep trust blue
  blue: "#1A4FA0", // primary blue
  blueMid: "#2563EB", // action blue
  blueLight: "#EBF2FF", // light blue tint
  amber: "#F59E0B", // school-van gold
  amberLight: "#FEF9EC", // amber tint
  green: "#16A34A", // safe/active green
  greenLight: "#F0FDF4", // green tint
  red: "#DC2626",
  redLight: "#FEF2F2",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray400: "#94A3B8",
  gray600: "#475569",
  gray800: "#1E293B",
  white: "#FFFFFF",
};

const ParentDashboard = ({ navigation }) => {
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Socket Listeners for Real-time Foreground Notifications ---
  useEffect(() => {
    const setupSocket = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        socket.emit("join", userId);
        socket.on("receive_notification", (data) => {
          Alert.alert(data.title, data.message, [
            { text: "Awesome! Thanks 👍" },
          ]);
        });
      }
    };
    setupSocket();
    return () => {
      socket.off("receive_notification");
    };
  }, []);

  // --- Load Data ---
  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const userRes = await api.get(`/users/profile/${userId}`);
        if (userRes.data) {
          setParentName(userRes.data.name);
          setProfileImage(userRes.data.profileImage);
        }
        const childRes = await api.get(`/children/${userId}`);
        setChildren(childRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- Toggle Attendance ---
  const toggleAttendance = async (childId, currentIsAbsent) => {
    try {
      await api.put(`/children/attendance/${childId}`, {
        isAbsent: !currentIsAbsent,
      });
      setChildren((prevChildren) =>
        prevChildren.map((child) =>
          child._id === childId
            ? { ...child, isAbsent: !currentIsAbsent }
            : child,
        ),
      );
      const targetChild = children.find((c) => c._id === childId);
      if (targetChild && targetChild.driver_id) {
        socket.emit("attendanceUpdated", {
          driverId: targetChild.driver_id._id || targetChild.driver_id,
        });
      }
    } catch (error) {
      console.error("Attendance Update Error:", error);
      Alert.alert("Error", "Could not update attendance. Try again.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // --- Remove Driver ---
  const handleRemoveDriver = (child) => {
    Alert.alert(
      "Remove Transport",
      `Are you sure you want to unassign the current school van for ${child.name}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Unassign",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put(`/children/${child._id}`, {
                driver_id: null,
                status: "safe",
              });
              Alert.alert(
                "Success",
                "Van removed successfully. You can now select a new van.",
              );
              loadData();
            } catch (error) {
              console.error("Error removing driver:", error);
              Alert.alert("Error", "Failed to remove the driver.");
            }
          },
        },
      ],
    );
  };

  // --- Delete Child ---
  const handleDeleteChild = (childId) => {
    Alert.alert(
      "Delete Child",
      "Are you sure you want to entirely remove this child from the system?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/children/${childId}`);
              Alert.alert("Success", "Child removed successfully");
              loadData();
            } catch (error) {
              if (
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                Alert.alert("Cannot Remove ❌", error.response.data.message);
              } else {
                console.log(error);
                Alert.alert("Error", "Failed to delete child");
              }
            }
          },
        },
      ],
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.blueMid}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Greeting */}
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingLabel}>Welcome,</Text>
              <Text style={styles.greetingName}>{parentName}</Text>
            </View>

            {/* Avatar */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ParentProfile")}
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
                  <FontAwesome5 name="user-alt" size={20} color={C.white} />
                </View>
              )}
              {/* Online indicator dot */}
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>

          {/* Van status pill */}
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>Active</Text>
          </View>
        </View>

        {/* ── Live Tracking Card ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentMap")}
          style={styles.trackCard}
          activeOpacity={0.88}
        >
          {/* Left stripe */}
          <View style={styles.trackStripe} />

          <View style={styles.trackIconBox}>
            <Ionicons name="location-sharp" size={30} color={C.white} />
          </View>

          <View style={styles.trackTextBox}>
            <Text style={styles.trackTitle}>TRACK SCHOOL VAN</Text>
            <Text style={styles.trackSub}>View live location on map</Text>
          </View>

          <View style={styles.trackChevron}>
            <Ionicons name="chevron-forward" size={22} color={C.white} />
          </View>
        </TouchableOpacity>

        {/* ── Payments Card ── */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ParentPayments")}
          style={styles.paymentsCard}
          activeOpacity={0.88}
        >
          <View style={styles.paymentsIconBox}>
            <MaterialIcons name="receipt-long" size={26} color={C.white} />
          </View>
          <View style={styles.paymentsTextBox}>
            <Text style={styles.paymentsTitle}>My Payments & Bills</Text>
            <Text style={styles.paymentsSub}>Pay van fees & view receipts</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>

        {/* ── My Children Header ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Children</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("AddChild")}
            style={styles.addBtn}
          >
            <Ionicons name="add-circle" size={20} color={C.blueMid} />
            <Text style={styles.addBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Children List ── */}
        {children.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="account-child"
              size={48}
              color={C.gray200}
            />
            <Text style={styles.emptyText}>No children added yet.</Text>
            <TouchableOpacity onPress={() => navigation.navigate("AddChild")}>
              <Text style={styles.emptyLink}>Add your first child →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child, index) => (
            <View key={index} style={styles.childCard}>
              {/* Left accent bar */}
              <View style={styles.childCardAccent} />

              {/* Top Row: info + action buttons */}
              <View style={styles.childCardInner}>
                <View style={styles.childInfoBlock}>
                  {/* Name */}
                  <Text style={styles.childName}>{child.name}</Text>

                  {/* School / Grade */}
                  <Text style={styles.childSchool}>
                    {child.school} · {child.grade}
                  </Text>

                  {/* Van number */}
                  {child.driver_id && (
                    <View style={styles.vanNumRow}>
                      <MaterialCommunityIcons
                        name="van-passenger"
                        size={13}
                        color={C.gray600}
                      />
                      <Text style={styles.vanNumText}>
                        Van No: {child.driver_id.vanDetails?.vehicleNo || "N/A"}
                      </Text>
                    </View>
                  )}

                  {/* Van status / Find transport */}
                  <View style={styles.vanStatusRow}>
                    {child.driver_id ? (
                      <>
                        <View style={styles.vanAssignedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color={C.green}
                          />
                          <Text style={styles.vanAssignedText}>
                            Van Assigned
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleRemoveDriver(child)}
                          style={styles.removeVanBtn}
                        >
                          <Ionicons
                            name="close-circle"
                            size={14}
                            color={C.red}
                          />
                          <Text style={styles.removeVanText}>Remove Van</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("FindDriver", { child: child })
                        }
                        style={styles.findTransportBtn}
                      >
                        <MaterialCommunityIcons
                          name="bus-marker"
                          size={15}
                          color="#92400E"
                        />
                        <Text style={styles.findTransportText}>
                          Find Transport
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Right: icon action buttons */}
                <View style={styles.childActionButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("AttendanceReport", {
                        childId: child._id,
                        childName: child.name,
                      })
                    }
                    style={[styles.iconBtn, styles.iconBtnBlue]}
                  >
                    <Ionicons name="calendar" size={19} color={C.blueMid} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("EditChild", { child: child })
                    }
                    style={[styles.iconBtn, styles.iconBtnGray]}
                  >
                    <MaterialIcons name="edit" size={19} color={C.gray600} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteChild(child._id)}
                    style={[styles.iconBtn, styles.iconBtnRed]}
                  >
                    <MaterialIcons name="delete" size={19} color={C.red} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Attendance Toggle */}
              <TouchableOpacity
                style={[
                  styles.attendanceToggle,
                  child.isAbsent
                    ? styles.attendanceToggleAbsent
                    : styles.attendanceTogglePresent,
                ]}
                onPress={() => toggleAttendance(child._id, child.isAbsent)}
              >
                <Text
                  style={[
                    styles.attendanceToggleText,
                    child.isAbsent
                      ? styles.attendanceTextAbsent
                      : styles.attendanceTextPresent,
                  ]}
                >
                  {child.isAbsent
                    ? "🔴  Not Going Today  (Absent)"
                    : "🟢  Going Today  (Present)"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greetingBlock: {},
  greetingLabel: {
    fontSize: 13,
    color: C.gray400,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: "800",
    color: C.navy,
    letterSpacing: -0.4,
    marginTop: 1,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: C.white,
  },
  avatarFallback: {
    backgroundColor: C.blueMid,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.white,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greenLight,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.green,
    letterSpacing: 0.3,
  },

  // Track card
  trackCard: {
    backgroundColor: C.blue,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginBottom: 12,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  trackStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 5,
    backgroundColor: C.amber,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  trackIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginRight: 14,
  },
  trackTextBox: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 0.5,
  },
  trackSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 3,
  },
  trackChevron: {
    backgroundColor: "rgba(255,255,255,0.15)",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  // Payments card
  paymentsCard: {
    backgroundColor: C.green,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  paymentsIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  paymentsTextBox: {
    flex: 1,
  },
  paymentsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
  },
  paymentsSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.navy,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.blueMid,
    marginLeft: 5,
  },

  // Empty state
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.gray200,
    borderStyle: "dashed",
  },
  emptyText: {
    color: C.gray400,
    marginTop: 10,
    fontSize: 14,
  },
  emptyLink: {
    color: C.blueMid,
    marginTop: 8,
    fontWeight: "700",
    fontSize: 14,
  },

  // Child card
  childCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  childCardAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: C.amber,
  },
  childCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 18,
    paddingRight: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  childInfoBlock: {
    flex: 1,
  },
  childName: {
    fontSize: 17,
    fontWeight: "800",
    color: C.navy,
    marginBottom: 2,
  },
  childSchool: {
    fontSize: 12,
    color: C.gray600,
    marginBottom: 6,
  },
  vanNumRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vanNumText: {
    fontSize: 11,
    color: C.gray600,
    fontWeight: "600",
    marginLeft: 4,
  },
  vanStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  vanAssignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vanAssignedText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.green,
    marginLeft: 4,
  },
  removeVanBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  removeVanText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.red,
    marginLeft: 4,
  },
  findTransportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  findTransportText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
    marginLeft: 5,
  },

  // Icon action buttons
  childActionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnBlue: {
    backgroundColor: C.blueLight,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  iconBtnGray: {
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  iconBtnRed: {
    backgroundColor: C.redLight,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  // Attendance toggle
  attendanceToggle: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceTogglePresent: {
    backgroundColor: C.blueLight,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  attendanceToggleAbsent: {
    backgroundColor: C.redLight,
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  attendanceToggleText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  attendanceTextPresent: {
    color: C.blueMid,
  },
  attendanceTextAbsent: {
    color: C.red,
  },
});

export default ParentDashboard;

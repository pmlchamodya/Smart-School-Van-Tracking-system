import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import api from "../../services/api";
import { useFocusEffect } from "@react-navigation/native";

// --- NEW: Import our reusable Calendar component ---
import CustomCalendar from "../../components/calendar/CustomCalendar";

const AttendanceReportScreen = ({ route, navigation }) => {
  const { childId, childName } = route.params;

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  // Current Month State
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const fetchReport = async (monthToFetch) => {
    try {
      setLoading(true);
      // REAL API CALL: Fetches data for the selected month
      const response = await api.get(
        `/children/attendance-report/${childId}/${monthToFetch}`,
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching attendance report:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReport(currentMonth);
    }, [currentMonth]),
  );

  // --- NEW: Convert Backend Data to Calendar Marking Format ---
  const getMarkedDates = () => {
    let marks = {};
    if (reportData && reportData.records) {
      reportData.records.forEach((record) => {
        if (record.status === "Present") {
          marks[record.date] = {
            customStyles: {
              container: { backgroundColor: "#10B981", borderRadius: 8 },
              text: { color: "white", fontWeight: "bold" },
            },
          };
        } else if (record.status === "Absent") {
          marks[record.date] = {
            customStyles: {
              container: { backgroundColor: "#EF4444", borderRadius: 8 },
              text: { color: "white", fontWeight: "bold" },
            },
          };
        }
      });
    }
    return marks;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center p-5 bg-blue-600 rounded-b-3xl shadow-md">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Attendance Report</Text>
      </View>

      <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
        {/* Child Name Display */}
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100 items-center flex-row">
          <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-4">
            <FontAwesome5 name="user-graduate" size={24} color="#2563EB" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-800">{childName}</Text>
            <Text className="text-gray-500 font-bold text-xs uppercase mt-1">
              Select month from calendar below
            </Text>
          </View>
        </View>

        {/* --- NEW: Interactive Calendar Section --- */}
        <View className="mb-6">
          <CustomCalendar
            currentMonth={currentMonth}
            markedDates={getMarkedDates()}
            onMonthChange={(newMonth) => {
              setCurrentMonth(newMonth); // This will trigger fetchReport for the new month!
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" className="mt-4" />
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <View className="flex-row justify-between mb-6">
              <View className="bg-green-50 w-[48%] p-4 rounded-2xl border border-green-200 items-center shadow-sm">
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={32}
                  color="#10B981"
                />
                <Text className="text-3xl font-extrabold text-green-600 mt-2">
                  {reportData.totalPresent}
                </Text>
                <Text className="text-green-800 text-xs font-bold mt-1 uppercase text-center">
                  Days Attended
                </Text>
              </View>

              <View className="bg-red-50 w-[48%] p-4 rounded-2xl border border-red-200 items-center shadow-sm">
                <MaterialCommunityIcons
                  name="close-octagon"
                  size={32}
                  color="#EF4444"
                />
                <Text className="text-3xl font-extrabold text-red-500 mt-2">
                  {reportData.totalAbsent}
                </Text>
                <Text className="text-red-800 text-xs font-bold mt-1 uppercase text-center">
                  Days Absent
                </Text>
              </View>
            </View>

            {/* Daily Records List (Under the calendar) */}
            <Text className="text-lg font-bold text-gray-800 mb-4 px-1">
              Details for {currentMonth}
            </Text>

            {reportData.records && reportData.records.length > 0 ? (
              reportData.records.map((record, index) => (
                <View
                  key={index}
                  className={`flex-col p-4 rounded-xl mb-4 shadow-sm border-l-4 ${
                    record.status === "Present"
                      ? "bg-white border-green-500"
                      : "bg-white border-red-500"
                  }`}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={20} color="#4B5563" />
                      <Text className="text-gray-800 font-bold ml-2 text-base">
                        {record.date}
                      </Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        record.status === "Present"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Text
                        className={`font-bold text-xs uppercase ${
                          record.status === "Present"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {record.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-xs font-semibold ml-2">
                      Marked at: {record.time || "Time not recorded"}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Ionicons
                  name="document-text-outline"
                  size={50}
                  color="#D1D5DB"
                />
                <Text className="text-gray-400 mt-3 font-semibold">
                  No records found for {currentMonth}.
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text className="text-center text-red-500 mt-10 font-bold">
            Failed to load data.
          </Text>
        )}
        <View className="mb-10"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AttendanceReportScreen;

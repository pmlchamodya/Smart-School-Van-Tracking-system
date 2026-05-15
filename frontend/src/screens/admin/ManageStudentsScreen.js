import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import api from "../../services/api";

const ManageStudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch all students
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/admin/students");
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Error", "Could not load students.");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a student
  const handleDeleteStudent = (studentId, studentName) => {
    Alert.alert(
      "Remove Student",
      `Are you sure you want to permanently remove ${studentName} from the system?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/users/admin/students/${studentId}`);
              Alert.alert("Success", `${studentName} has been removed.`);
              setModalVisible(false);
              setSearchQuery("");
              loadStudents();
            } catch (error) {
              console.error("Error deleting student:", error);
              Alert.alert("Error", "Failed to remove student.");
            }
          },
        },
      ],
    );
  };

  // Filter functionality (Search by student name or school)
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const newData = students.filter((item) => {
        const nameData = item.name ? item.name.toUpperCase() : "";
        const schoolData = item.school ? item.school.toUpperCase() : "";
        const textData = text.toUpperCase();
        return (
          nameData.indexOf(textData) > -1 || schoolData.indexOf(textData) > -1
        );
      });
      setFilteredStudents(newData);
    } else {
      setFilteredStudents(students);
    }
  };

  const openStudentProfile = (student) => {
    setSelectedStudent(student);
    setModalVisible(true);
  };

  // UI for a single Student Card
  const renderStudentCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => openStudentProfile(item)}
      className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100 flex-row items-center"
    >
      <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center border-2 border-purple-200">
        <FontAwesome5 name="user-graduate" size={20} color="#7C3AED" />
      </View>

      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          <Ionicons name="school" size={12} /> {item.school} - {item.grade}
        </Text>

        <View className="flex-row items-center mt-2">
          <View
            className={`px-2 py-0.5 rounded-md border ${
              item.status === "in-van"
                ? "bg-yellow-50 border-yellow-300"
                : item.status === "school"
                  ? "bg-blue-50 border-blue-300"
                  : "bg-green-50 border-green-300"
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase ${
                item.status === "in-van"
                  ? "text-yellow-700"
                  : item.status === "school"
                    ? "text-blue-700"
                    : "text-green-700"
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteStudent(item._id, item.name)}
        className="bg-red-50 p-3 rounded-full"
      >
        <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EEF4FF" }}>
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Manage Students
          </Text>
          <Text className="text-gray-500 text-xs">
            View all registered children
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white px-4 py-3 rounded-xl mb-6 shadow-sm border border-gray-100">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          placeholder="Search by student name or school..."
          value={searchQuery}
          onChangeText={(text) => handleSearch(text)}
          className="flex-1 ml-2 text-gray-800"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Student List */}
      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" className="mt-10" />
      ) : filteredStudents.length === 0 ? (
        <View className="items-center justify-center mt-10">
          <FontAwesome5 name="user-graduate" size={50} color="#9CA3AF" />
          <Text className="text-gray-400 mt-3 font-bold">
            No students found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          renderItem={renderStudentCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* --- Student Full Profile Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[85%] p-6">
            {/* Modal Header & Close Button */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Student Profile
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-100 p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="gray" />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Avatar & Name */}
                <View className="items-center mb-6">
                  <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center border-4 border-purple-200 mb-3">
                    <FontAwesome5
                      name="user-graduate"
                      size={40}
                      color="#7C3AED"
                    />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800">
                    {selectedStudent.name}
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full mt-1 ${selectedStudent.isAbsent ? "bg-red-100" : "bg-green-100"}`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${selectedStudent.isAbsent ? "text-red-700" : "text-green-700"}`}
                    >
                      {selectedStudent.isAbsent
                        ? "Absent Today"
                        : "Attending Today"}
                    </Text>
                  </View>
                </View>

                {/* Academic & Location Info */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Academic & Location
                </Text>
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="school"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-gray-500">
                        School & Grade
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedStudent.school} - {selectedStudent.grade}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location"
                      size={20}
                      color="#6B7280"
                      className="w-8"
                    />
                    <View className="ml-3 pr-4">
                      <Text className="text-xs text-gray-500">
                        Pickup Location
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedStudent.pickupLocation || "Not Provided"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Parent Info */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Parent Details
                </Text>
                <View className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
                  <View className="flex-row items-center mb-3">
                    <Ionicons
                      name="person"
                      size={20}
                      color="#10B981"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-green-700">
                        Parent Name
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedStudent.parent_id?.name || "Unknown"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="call"
                      size={20}
                      color="#10B981"
                      className="w-8"
                    />
                    <View className="ml-3">
                      <Text className="text-xs text-green-700">
                        Contact Number
                      </Text>
                      <Text className="text-base font-semibold text-gray-800">
                        {selectedStudent.parent_id?.phoneNumber || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Driver Info */}
                <Text className="text-sm font-bold text-gray-400 uppercase mb-3 ml-1">
                  Assigned Transport
                </Text>
                <View className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                  {selectedStudent.driver_id ? (
                    <>
                      <View className="flex-row items-center mb-3">
                        <MaterialCommunityIcons
                          name="steering"
                          size={20}
                          color="#3B82F6"
                          className="w-8"
                        />
                        <View className="ml-3">
                          <Text className="text-xs text-blue-700">
                            Driver Name
                          </Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedStudent.driver_id.name}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="van-passenger"
                          size={20}
                          color="#3B82F6"
                          className="w-8"
                        />
                        <View className="ml-3">
                          <Text className="text-xs text-blue-700">
                            Vehicle Number
                          </Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedStudent.driver_id.vanDetails?.vehicleNo ||
                              "N/A"}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <View className="items-center py-2">
                      <MaterialCommunityIcons
                        name="bus-alert"
                        size={30}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-500 font-semibold mt-2">
                        No Transport Assigned Yet
                      </Text>
                    </View>
                  )}
                </View>

                {/* Delete Student Action */}
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteStudent(
                      selectedStudent._id,
                      selectedStudent.name,
                    )
                  }
                  className="bg-red-50 py-4 rounded-xl items-center border border-red-100 mb-10 flex-row justify-center"
                >
                  <MaterialIcons name="delete" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-bold ml-2">
                    Remove This Student
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageStudentsScreen;

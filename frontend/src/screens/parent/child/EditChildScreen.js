import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import api from "../../../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import SaveButton from "../../../components/button/SaveButton";

const EditChildScreen = ({ route, navigation }) => {
  // Get the child data passed from the dashboard
  const { child } = route.params;

  const [name, setName] = useState(child.name);
  const [school, setSchool] = useState(child.school);
  const [grade, setGrade] = useState(child.grade);
  const [loading, setLoading] = useState(false);

  const handleUpdateChild = async () => {
    if (!name || !school || !grade) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // Send Update Request to Backend
      const response = await api.put(`/children/${child._id}`, {
        name,
        school,
        grade,
      });

      if (response.status === 200) {
        Alert.alert("Success", "Child details updated!");
        navigation.goBack();
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-5">
      <ScrollView>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Edit Child Details
        </Text>

        <Text className="text-gray-600 mb-2 font-bold">Child's Name</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-gray-600 mb-2 font-bold">School</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-4 border border-gray-200"
          value={school}
          onChangeText={setSchool}
        />

        <Text className="text-gray-600 mb-2 font-bold">Grade</Text>
        <TextInput
          className="bg-white p-4 rounded-xl mb-6 border border-gray-200"
          value={grade}
          onChangeText={setGrade}
        />

        {/* --- SAVE BUTTON --- */}
        <SaveButton
          title="Update Changes"
          onPress={handleUpdateChild}
          loading={loading}
        />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 items-center"
        >
          <Text className="text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditChildScreen;

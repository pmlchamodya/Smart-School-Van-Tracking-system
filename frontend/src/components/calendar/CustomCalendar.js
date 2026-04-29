import React from "react";
import { Calendar } from "react-native-calendars";

const CustomCalendar = ({ markedDates, onMonthChange, currentMonth }) => {
  return (
    <Calendar
      // Set the initial month to display
      current={currentMonth + "-01"}
      // Handle Month Swipe (Left/Right Arrows)
      onMonthChange={(month) => {
        // month.dateString gives "YYYY-MM-DD", we only need "YYYY-MM"
        const newMonth = month.dateString.slice(0, 7);
        if (onMonthChange) {
          onMonthChange(newMonth);
        }
      }}
      // Custom styling for Present/Absent marks
      markingType={"custom"}
      markedDates={markedDates}
      // Theme customization to match your app
      theme={{
        backgroundColor: "#ffffff",
        calendarBackground: "#ffffff",
        textSectionTitleColor: "#6B7280",
        selectedDayBackgroundColor: "#2563EB",
        selectedDayTextColor: "#ffffff",
        todayTextColor: "#2563EB",
        dayTextColor: "#374151",
        textDisabledColor: "#D1D5DB",
        arrowColor: "#2563EB",
        monthTextColor: "#1F2937",
        textDayFontWeight: "500",
        textMonthFontWeight: "bold",
        textDayHeaderFontWeight: "bold",
      }}
      style={{
        borderRadius: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    />
  );
};

export default CustomCalendar;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { getTodayISO, formatDate } from '../../utils/dateUtils';

export default function CalendarScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction } = useAuthGuard();
  const { reminders, isLoading, loadReminders } = useReminders();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  const styles = createStyles(colors);

  useEffect(() => {
    loadReminders();
  }, []);

  // Create marked dates object for the calendar
  const getMarkedDates = () => {
    const marked: any = {};

    // Mark today
    const today = getTodayISO();
    marked[today] = {
      selected: true,
      selectedColor: colors.primary,
      textColor: colors.background,
    };

    // Mark dates with reminders
    reminders.forEach(reminder => {
      if (reminder.dueDate) {
        if (!marked[reminder.dueDate]) {
          marked[reminder.dueDate] = {
            marked: true,
            dotColor: colors.warning,
          };
        } else {
          // If already marked (e.g., today), add the dot
          marked[reminder.dueDate].marked = true;
          marked[reminder.dueDate].dotColor = colors.warning;
        }
      }
    });

    return marked;
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;
    const dateReminders = reminders.filter(reminder => reminder.dueDate === dateString);

    if (dateReminders && dateReminders.length > 0) {
      navigation.navigate('RemindersDetail', {
        title: formatDate(dateString),
        reminders: dateReminders,
      });
    }
  };

  const handleAddReminder = () => {
    const addReminderHandler = () => {
      navigation.navigate('Add', {
        prefillDate: getTodayISO(),
      });
    };
    guardAction(addReminderHandler);
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={getTodayISO()}
        onDayPress={handleDayPress}
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.text,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.background,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          dotColor: colors.warning,
          selectedDotColor: colors.background,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          textDayFontFamily: Fonts.text.regular,
          textMonthFontFamily: Fonts.display.semibold,
          textDayHeaderFontFamily: Fonts.text.medium,
          textDayFontSize: FontSizes.body,
          textMonthFontSize: FontSizes.title2,
          textDayHeaderFontSize: FontSizes.footnote,
        }}
        enableSwipeMonths={true}
        firstDay={1} // Start week on Monday (European style)
      />

      {showLoginPrompt && (
        <LoginPrompt
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          onSuccess={() => setShowLoginPrompt(false)}
        />
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

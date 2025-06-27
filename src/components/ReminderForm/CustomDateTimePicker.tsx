import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Calendar, Clock, X, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date, time?: string) => void;
  initialDate?: Date;
  initialTime?: string;
  mode: 'date' | 'time' | 'datetime';
  colors: typeof Colors.light;
}

export const CustomDateTimePickerModal: React.FC<DateTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  initialTime,
  mode,
  colors,
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime || '12:00');
  const [currentView, setCurrentView] = useState<'date' | 'time'>(
    mode === 'time' ? 'time' : 'date'
  );

  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(selectedDate.getMonth());

  // Generate calendar data
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);
    const days = [];

    // Add empty days for padding
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           displayMonth === today.getMonth() &&
           displayYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() &&
           displayMonth === selectedDate.getMonth() &&
           displayYear === selectedDate.getFullYear();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(displayYear, displayMonth, day);
    setSelectedDate(newDate);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    if (mode !== 'date') {
      const [hours, minutes] = selectedTime.split(':');
      finalDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
    onConfirm(finalDate, mode !== 'date' ? selectedTime : undefined);
    onClose();
  };

  const formatDateLocal = (date: Date) => {
    return formatDate(date);
  };

  const formatTimeLocal = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return formatTime(date);
  };

  // Get month names from translations
  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december'),
  ];

  // Get week days from translations
  const weekDays = [
    t('calendar.weekDays.sun'),
    t('calendar.weekDays.mon'),
    t('calendar.weekDays.tue'),
    t('calendar.weekDays.wed'),
    t('calendar.weekDays.thu'),
    t('calendar.weekDays.fri'),
    t('calendar.weekDays.sat'),
  ];

  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentView === 'date' ? t('add.selectDate') : t('add.selectTime')}
            </Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Check size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          {mode === 'datetime' && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, currentView === 'date' && styles.tabActive]}
                onPress={() => setCurrentView('date')}
              >
                <Calendar size={20} color={currentView === 'date' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.tabText, currentView === 'date' && styles.tabTextActive]}>
                  {t('add.selectDate')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, currentView === 'time' && styles.tabActive]}
                onPress={() => setCurrentView('time')}
              >
                <Clock size={20} color={currentView === 'time' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.tabText, currentView === 'time' && styles.tabTextActive]}>
                  {t('add.selectTime')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Picker View */}
          {currentView === 'date' && (
            <ScrollView style={styles.dateContainer} showsVerticalScrollIndicator={false}>
              {/* Month/Year Navigation */}
              <View style={styles.monthHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (displayMonth === 0) {
                      setDisplayMonth(11);
                      setDisplayYear(displayYear - 1);
                    } else {
                      setDisplayMonth(displayMonth - 1);
                    }
                  }}
                  style={styles.navButton}
                >
                  <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                  {monthNames[displayMonth]} {displayYear}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (displayMonth === 11) {
                      setDisplayMonth(0);
                      setDisplayYear(displayYear + 1);
                    } else {
                      setDisplayMonth(displayMonth + 1);
                    }
                  }}
                  style={styles.navButton}
                >
                  <ChevronRight size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Selected Date Display */}
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateLabel}>{t('add.selectedDate')}</Text>
                <Text style={styles.selectedDateText}>{formatDateLocal(selectedDate)}</Text>
              </View>

              {/* Calendar */}
              <View style={styles.calendarContainer}>
                {/* Week Days Header */}
                <View style={styles.weekDaysHeader}>
                  {weekDays.map((day) => (
                    <Text key={day} style={styles.weekDayText}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {generateCalendarDays().map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        ...(day && isToday(day) ? [styles.todayCell] : []),
                        ...(day && isSelected(day) ? [styles.selectedCell] : []),
                      ]}
                      onPress={() => day && handleDateSelect(day)}
                      disabled={!day}
                    >
                      {day && (
                        <Text
                          style={[
                            styles.dayText,
                            ...(isToday(day) ? [styles.todayText] : []),
                            ...(isSelected(day) ? [styles.selectedText] : []),
                          ]}
                        >
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}

          {/* Time Picker View */}
          {currentView === 'time' && (
            <ScrollView style={styles.timeContainer} showsVerticalScrollIndicator={false}>
              {/* Selected Time Display */}
              <View style={styles.selectedTimeContainer}>
                <Text style={styles.selectedTimeLabel}>{t('add.selectedTime')}</Text>
                <Text style={styles.selectedTimeText}>{formatTimeLocal(selectedTime)}</Text>
              </View>

              {/* Time Grid */}
              <View style={styles.timeGrid}>
                <View style={styles.timeGridContent}>
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        ...(selectedTime === time ? [styles.selectedTimeSlot] : []),
                      ]}
                      onPress={() => handleTimeSelect(time)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          ...(selectedTime === time ? [styles.timeSlotSelectedText] : []),
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 18,
    color: colors.text,
  },
  confirmButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.text.semibold,
  },
  dateContainer: {
    flex: 1,
    padding: 24,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 20,
    color: colors.text,
  },
  selectedDateContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  selectedDateLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  selectedDateText: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: colors.primary,
  },
  calendarContainer: {
    flex: 1,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 12,
  },
  todayCell: {
    backgroundColor: colors.warning + '20',
    borderWidth: 2,
    borderColor: colors.warning,
  },
  selectedCell: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
  },
  todayText: {
    color: colors.warning,
    fontFamily: Fonts.text.bold,
  },
  selectedText: {
    color: '#FFFFFF',
    fontFamily: Fonts.text.bold,
  },
  timeContainer: {
    flex: 1,
    padding: 24,
  },
  selectedTimeContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  selectedTimeLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  selectedTimeText: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: colors.primary,
  },
  timeGrid: {
    flex: 1,
  },
  timeGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  timeSlot: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
    borderWidth: 3,
  },
  timeText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
  },
  timeSlotSelectedText: {
    color: colors.primary,
    fontFamily: Fonts.text.semibold,
  },
});

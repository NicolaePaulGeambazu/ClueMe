import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Clock, Plus } from 'lucide-react-native';
import { TimeBlock } from './TimeBlock';
import { Fonts } from '../../constants/Fonts';

interface TimelineGridProps {
  date: Date;
  reminders: any[];
  onTimeSlotPress: (timeSlot: string) => void;
  onReminderPress: (reminder: any) => void;
  colors: any;
}

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  date,
  reminders,
  onTimeSlotPress,
  onReminderPress,
  colors,
}) => {
  const styles = createStyles(colors);

  const getRemindersForTimeSlot = (timeSlot: string) => {
    return reminders.filter(reminder => {
      if (!reminder.dueTime) {return false;}

      // Extract hour from timeSlot (e.g., '20:00' -> '20')
      const timeSlotHour = timeSlot.split(':')[0];

      // Extract hour from reminder time (e.g., '20:28' -> '20')
      const reminderHour = reminder.dueTime.split(':')[0];

      // Match reminders to the time slot based on hour
      return reminderHour === timeSlotHour;
    });
  };

  const formatTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isCurrentTimeSlot = (timeSlot: string) => {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeSlot = `${currentHour}:${currentMinute}`;
    return timeSlot === currentTimeSlot;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.timeline}>
        {TIME_SLOTS.map((timeSlot, index) => {
          const timeSlotReminders = getRemindersForTimeSlot(timeSlot);
          const isCurrent = isCurrentTimeSlot(timeSlot);

          return (
            <View key={timeSlot} style={styles.timeSlot}>
              <View style={styles.timeHeader}>
                <Text style={[
                  styles.timeText,
                  isCurrent && styles.currentTimeText,
                ]}>
                  {formatTime(timeSlot)}
                </Text>
                {isCurrent && (
                  <View style={[styles.currentIndicator, { backgroundColor: colors.primary }]} />
                )}
              </View>

              <View style={styles.timeSlotContent}>
                {timeSlotReminders.length > 0 ? (
                  timeSlotReminders.map((reminder) => (
                    <TimeBlock
                      key={reminder.id}
                      reminder={reminder}
                      onPress={() => onReminderPress(reminder)}
                      colors={colors}
                    />
                  ))
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlot}
                    onPress={() => onTimeSlotPress(timeSlot)}
                  >
                    <Plus size={16} color={colors.textTertiary} strokeWidth={2} />
                    <Text style={styles.emptySlotText}>Add reminder</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  timeline: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 16,
    minHeight: 60,
  },
  timeHeader: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  timeText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  currentTimeText: {
    color: colors.primary,
    fontFamily: Fonts.text.semibold,
  },
  currentIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  timeSlotContent: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 16,
    gap: 8,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptySlotText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textTertiary,
    marginLeft: 8,
  },
});

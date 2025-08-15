import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Clock, MapPin } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { CalendarEvent, getEventTypeColor } from '../../utils/calendarUtils';
import { formatTimeOnly } from '../../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

interface WeekViewProps {
  selectedDate: string;
  events: CalendarEvent[];
  onDatePress: (dateString: string) => void;
  onEventPress: (event: CalendarEvent) => void;
}

export default function WeekView({ selectedDate, events, onDatePress, onEventPress }: WeekViewProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Generate week dates
  const weekDates = useMemo(() => {
    const selected = new Date(selectedDate);
    const weekStart = startOfWeek(selected, { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    weekDates.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      grouped[dateString] = events.filter(event => event.dateString === dateString);
    });

    return grouped;
  }, [events, weekDates]);

  // Time slots for the week view
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push({
        hour,
        time: `${hour.toString().padStart(2, '0')}:00`,
      });
    }
    return slots;
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return '📅';
      case 'task': return '✓';
      case 'bill': return '💳';
      case 'med': return '💊';
      case 'note': return '📝';
      default: return '•';
    }
  };

  const renderDayHeader = (date: Date, index: number) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isSelected = dateString === selectedDate;
    const isTodayDate = isToday(date);
    const dayEvents = eventsByDate[dateString] || [];

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.dayHeader,
          isSelected && { backgroundColor: colors.primary },
          isTodayDate && !isSelected && { backgroundColor: `${colors.primary}15` },
        ]}
        onPress={() => onDatePress(dateString)}
      >
        <Text style={[
          styles.dayName,
          { color: isSelected ? colors.background : colors.textSecondary },
        ]}>
          {format(date, 'EEE')}
        </Text>
        <Text style={[
          styles.dayNumber,
          { color: isSelected ? colors.background : isTodayDate ? colors.primary : colors.text },
        ]}>
          {format(date, 'd')}
        </Text>
        {dayEvents.length > 0 && (
          <View style={[
            styles.eventIndicator,
            { backgroundColor: isSelected ? colors.background : colors.primary },
          ]}>
            <Text style={[
              styles.eventCount,
              { color: isSelected ? colors.primary : colors.background },
            ]}>
              {dayEvents.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEventInSlot = (event: CalendarEvent, slotHour: number) => {
    // Check if event should appear in this time slot
    let eventHour = 9; // Default hour
    if (event.dueTime) {
      const timeParts = event.dueTime.split(':');
      if (timeParts.length > 0) {
        const hours = parseInt(timeParts[0], 10);
        if (!isNaN(hours)) {
          eventHour = hours;
        }
      }
    }

    if (eventHour !== slotHour) {return null;}

    return (
      <TouchableOpacity
        key={event.id}
        style={[
          styles.weekEvent,
          {
            backgroundColor: `${getEventTypeColor(event.type)}15`,
            borderLeftColor: getEventTypeColor(event.type),
          },
        ]}
        onPress={() => onEventPress(event)}
      >
        <Text style={styles.weekEventIcon}>{getTypeIcon(event.type)}</Text>
        <Text style={[styles.weekEventTitle, { color: colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        {event.dueTime && (
          <Text style={[styles.weekEventTime, { color: colors.textSecondary }]}>
            {formatTimeOnly(event.dueTime)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: { hour: number; time: string }, index: number) => (
    <View key={index} style={[styles.timeSlot, { borderBottomColor: colors.borderLight }]}>
      <View style={styles.timeLabel}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          {slot.time}
        </Text>
      </View>
      <View style={styles.weekDaysContainer}>
        {weekDates.map((date, dayIndex) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateString] || [];
          const slotEvents = dayEvents.filter(event => {
            if (!event.dueTime) {return slot.hour === 9;} // Default to 9 AM
            const timeParts = event.dueTime.split(':');
            if (timeParts.length > 0) {
              const hours = parseInt(timeParts[0], 10);
              return !isNaN(hours) && hours === slot.hour;
            }
            return false;
          });

          return (
            <View key={dayIndex} style={[styles.daySlot, { borderRightColor: colors.borderLight }]}>
              {slotEvents.map(event => renderEventInSlot(event, slot.hour))}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Week Header */}
      <View style={styles.weekHeader}>
        <View style={styles.timeHeaderSpace} />
        <View style={styles.daysHeader}>
          {weekDates.map((date, index) => renderDayHeader(date, index))}
        </View>
      </View>

      {/* Week Grid */}
      <ScrollView style={styles.weekGrid} showsVerticalScrollIndicator={false}>
        {timeSlots.map((slot, index) => renderTimeSlot(slot, index))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  timeHeaderSpace: {
    width: 60,
  },
  daysHeader: {
    flex: 1,
    flexDirection: 'row',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 2,
    position: 'relative',
  },
  dayName: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.bold,
    marginTop: 2,
  },
  eventIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCount: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.bold,
  },
  weekGrid: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
  },
  timeLabel: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingTop: 4,
  },
  timeText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
  },
  weekDaysContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  daySlot: {
    flex: 1,
    borderRightWidth: 1,
    padding: 2,
    minHeight: 60,
  },
  weekEvent: {
    padding: 4,
    borderRadius: 4,
    borderLeftWidth: 2,
    marginBottom: 2,
  },
  weekEventIcon: {
    fontSize: 10,
  },
  weekEventTitle: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
    marginTop: 1,
  },
  weekEventTime: {
    fontSize: 8,
    fontFamily: Fonts.text.regular,
    marginTop: 1,
  },
});

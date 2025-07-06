import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { ChevronLeft, Plus, Clock, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';
import { 
  getTodayISO, 
  getAllCalendarEvents, 
  getEventsForDate, 
  createMarkedDates, 
  getEventTypeColor, 
  assignEventsToTimeBlocks,
  CalendarEvent
} from '../../utils/calendarUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ViewMode = 'month' | 'agenda';

export default function OptimizedCalendar({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt } = useAuthGuard();
  const { reminders, isLoading, loadReminders } = useReminders();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load reminders only once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadReminders();
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    };
    loadData();
  }, []); // Empty dependency array - only run once

  // Memoize all calendar events
  const allCalendarEvents = useMemo((): CalendarEvent[] => {
    if (!reminders || reminders.length === 0) return [];
    return getAllCalendarEvents(reminders);
  }, [reminders]);

  // Memoize marked dates
  const markedDates = useMemo(() => {
    return createMarkedDates(allCalendarEvents, selectedDate);
  }, [allCalendarEvents, selectedDate]);

  // Memoize events for selected date
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(allCalendarEvents, selectedDate);
  }, [allCalendarEvents, selectedDate]);

  // Memoize time blocks for agenda view
  const timeBlocks = useMemo(() => {
    return assignEventsToTimeBlocks(selectedDateEvents, 6, 22);
  }, [selectedDateEvents]);

  // Memoize calendar theme
  const calendarTheme = useMemo(() => ({
    backgroundColor: colors.background,
    calendarBackground: colors.background,
    textSectionTitleColor: colors.textSecondary,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.background,
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: colors.textTertiary,
    dotColor: colors.warning,
    selectedDotColor: colors.background,
    arrowColor: colors.primary,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontFamily: Fonts.text.medium,
    textMonthFontFamily: Fonts.text.semibold,
    textDayHeaderFontFamily: Fonts.text.medium,
    textDayFontSize: FontSizes.body,
    textMonthFontSize: FontSizes.title3,
    textDayHeaderFontSize: FontSizes.caption1,
    'stylesheet.calendar.header': {
      dayHeader: {
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 8,
      },
    },
    'stylesheet.day.basic': {
      base: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
      },
      text: {
        marginTop: 4,
        fontSize: FontSizes.body,
        fontFamily: Fonts.text.medium,
        color: colors.text,
        textAlign: 'center',
      },
    },
  }), [colors, Fonts, FontSizes]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleAddReminder = useCallback(() => {
    const addReminderHandler = () => {
      navigation.navigate('Add', {
        prefillDate: selectedDate,
      });
    };

    if (isAnonymous) {
      setShowLoginPrompt(true);
      return;
    }
    addReminderHandler();
  }, [isAnonymous, selectedDate, navigation, setShowLoginPrompt]);

  const handleLoginSuccess = useCallback(() => {
    navigation.navigate('Add', {
      prefillDate: selectedDate,
    });
  }, [selectedDate, navigation]);

  const handleEventPress = useCallback((event: CalendarEvent) => {
    if (event.type === 'event') {
      navigation.navigate('EditReminder', { reminderId: event.id });
    } else {
      Alert.alert(event.title, event.description || '');
    }
  }, [navigation]);

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'event': return '📅';
      case 'task': return '✓';
      case 'bill': return '💳';
      case 'med': return '💊';
      case 'note': return '📝';
      default: return '•';
    }
  }, []);

  if (showLoginPrompt) {
    return <LoginPrompt visible={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} onSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('calendar.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {formatDate(new Date(selectedDate))}
          </Text>
        </View>

        <View style={styles.viewButtons}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'month' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[
              styles.viewButtonText,
              viewMode === 'month' && { color: colors.background }
            ]}>
              {t('calendar.month')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'agenda' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('agenda')}
          >
            <Text style={[
              styles.viewButtonText,
              viewMode === 'agenda' && { color: colors.background }
            ]}>
              {t('calendar.agenda')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'month' ? (
        <View style={styles.monthViewContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showWeekNumbers={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
            enableSwipeMonths={true}
            theme={calendarTheme}
            style={styles.calendar}
          />
          
          {/* Quick Event Preview */}
          {selectedDateEvents.length > 0 && (
            <View style={[styles.eventPreview, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
              <Text style={[styles.eventPreviewTitle, { color: colors.text }]}>
                {formatDate(new Date(selectedDate))} • {selectedDateEvents.length} {selectedDateEvents.length === 1 ? t('calendar.event') : t('calendar.events')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventPreviewScroll}>
                {selectedDateEvents.slice(0, 3).map((event, index) => (
                  <TouchableOpacity
                    key={`${event.id}_${index}`}
                    style={[
                      styles.eventPreviewItem,
                      { backgroundColor: getEventTypeColor(event.type) + '15', borderLeftColor: getEventTypeColor(event.type) }
                    ]}
                    onPress={() => handleEventPress(event)}
                  >
                    <Text style={styles.eventPreviewIcon}>{getTypeIcon(event.type)}</Text>
                    <Text style={[styles.eventPreviewText, { color: colors.text }]} numberOfLines={1}>
                      {event.title}
                    </Text>
                    {event.dueTime && (
                      <Text style={[styles.eventPreviewTime, { color: colors.textSecondary }]}>
                        {formatTimeOnly(event.dueTime)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                {selectedDateEvents.length > 3 && (
                  <TouchableOpacity
                    style={[styles.eventPreviewMore, { backgroundColor: colors.borderLight }]}
                    onPress={() => setViewMode('agenda')}
                  >
                    <Text style={[styles.eventPreviewMoreText, { color: colors.textSecondary }]}>
                      +{selectedDateEvents.length - 3} more
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.agendaViewContainer}>
          <ScrollView 
            style={styles.agendaScrollView} 
            showsVerticalScrollIndicator={false}
          >
            {timeBlocks.map((block, index) => (
              <View key={index} style={[styles.timeBlock, { borderBottomColor: colors.borderLight }]}>
                <View style={styles.timeLabel}>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {block.time}
                  </Text>
                </View>
                
                <View style={styles.eventsContainer}>
                  {block.events.map((event, eventIndex) => (
                    <TouchableOpacity
                      key={`${event.id}_${eventIndex}`}
                      style={[
                        styles.eventBlock,
                        { backgroundColor: getEventTypeColor(event.type) + '15', borderLeftColor: getEventTypeColor(event.type) }
                      ]}
                      onPress={() => handleEventPress(event)}
                    >
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventIcon}>{getTypeIcon(event.type)}</Text>
                        <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                      
                      {event.type === 'event' && (event.startTime || event.endTime) && (
                        <View style={styles.eventTimeContainer}>
                          <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                            {event.startTime && formatTimeOnly(event.startTime)}
                            {event.startTime && event.endTime && ' - '}
                            {event.endTime && formatTimeOnly(event.endTime)}
                          </Text>
                        </View>
                      )}
                      
                      {event.location && (
                        <View style={styles.eventLocationContainer}>
                          <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                          <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={handleAddReminder} 
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={24} color={colors.background} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.semibold,
  },
  headerSubtitle: {
    fontSize: FontSizes.subheadline,
    fontFamily: Fonts.text.regular,
    marginTop: 2,
  },
  viewButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  viewButtonText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
    color: colors.textSecondary,
  },
  monthViewContainer: {
    flex: 1,
  },
  calendar: {
    marginBottom: 0,
  },
  eventPreview: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  eventPreviewTitle: {
    fontSize: FontSizes.subheadline,
    fontFamily: Fonts.text.medium,
    marginBottom: 12,
  },
  eventPreviewScroll: {
    flexDirection: 'row',
  },
  eventPreviewItem: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginRight: 12,
    minWidth: 120,
    maxWidth: 150,
  },
  eventPreviewIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  eventPreviewText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
    marginBottom: 2,
  },
  eventPreviewTime: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.regular,
  },
  eventPreviewMore: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  eventPreviewMoreText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
  },
  agendaViewContainer: {
    flex: 1,
  },
  agendaScrollView: {
    flex: 1,
  },
  timeBlock: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  timeLabel: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  timeText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
  },
  eventsContainer: {
    flex: 1,
  },
  eventBlock: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: FontSizes.subheadline,
    fontFamily: Fonts.text.medium,
    flex: 1,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.regular,
    marginLeft: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.regular,
    marginLeft: 4,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 
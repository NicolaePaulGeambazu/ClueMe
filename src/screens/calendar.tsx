import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import {
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
  Filter,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Repeat,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useReminderContext } from '../contexts/ReminderContext';
import { useModal } from '../contexts/ModalContext';
import { LoginPrompt } from '../components/auth/LoginPrompt';
import WeekView from '../components/calendar/WeekView';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import { formatDate, formatTimeOnly } from '../utils/dateUtils';
import {
  getTodayISO,
  getAllCalendarEvents,
  getEventsForDate,
  createMarkedDates,
  getEventTypeColor,
  assignEventsToTimeBlocks,
  CalendarEvent
} from '../utils/calendarUtils';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import InterstitialAdTrigger from '../components/ads/InterstitialAdTrigger';
import { usePremium } from '../hooks/usePremium';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type ViewMode = 'month' | 'week' | 'day' | 'agenda';
type FilterType = 'all' | 'task' | 'event' | 'bill' | 'med' | 'note';

export default function CalendarScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt } = useAuthGuard();
  const { reminders, loadReminders } = useReminderContext();
  const { isPremium } = usePremium();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showCompletedEvents, setShowCompletedEvents] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Load reminders on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadReminders();
      } catch (error) {
      }
    };
    loadData();
  }, []);

  // Memoize all calendar events with filtering
  const allCalendarEvents = useMemo((): CalendarEvent[] => {
    if (!reminders || reminders.length === 0) return [];
    
    let events = getAllCalendarEvents(reminders);
    
    // Apply type filter
    if (filterType !== 'all') {
      events = events.filter(event => event.type === filterType);
    }
    
    // Apply completed filter
    if (!showCompletedEvents) {
      events = events.filter(event => !event.completed);
    }
    
    return events;
  }, [reminders, filterType, showCompletedEvents]);

  // Memoize marked dates
  const markedDates = useMemo(() => {
    return createMarkedDates(allCalendarEvents);
  }, [allCalendarEvents]);

  // Memoize events for selected date
  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(allCalendarEvents, new Date(selectedDate));
  }, [allCalendarEvents, selectedDate]);

  // Memoize time blocks for day/agenda view
  const timeBlocks = useMemo(() => {
    return assignEventsToTimeBlocks(selectedDateEvents, 6, 22);
  }, [selectedDateEvents]);

  // Enhanced calendar theme
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
    textMonthFontFamily: Fonts.text.bold,
    textDayHeaderFontFamily: Fonts.text.semibold,
    textDayFontSize: FontSizes.body,
    textMonthFontSize: FontSizes.title2,
    textDayHeaderFontSize: FontSizes.caption1,
    'stylesheet.calendar.header': {
      dayHeader: {
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: 10,
        fontSize: FontSizes.caption1,
      },
    },
    'stylesheet.day.basic': {
      base: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      },
      text: {
        marginTop: 4,
        fontSize: FontSizes.callout,
        fontFamily: Fonts.text.semibold,
        color: colors.text,
        textAlign: 'center',
      },
    },
  }), [colors, Fonts, FontSizes]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleAddReminder = useCallback(() => {
    if (isAnonymous) {
      setShowLoginPrompt(true);
      return;
    }
    navigation.navigate('Add', {
      prefillDate: selectedDate,
    });
  }, [isAnonymous, selectedDate, navigation, setShowLoginPrompt]);

  const handleLoginSuccess = useCallback(() => {
    navigation.navigate('Add', {
      prefillDate: selectedDate,
    });
  }, [selectedDate, navigation]);

  const { showEditReminderModal } = useModal();

  const handleEventPress = useCallback((event: CalendarEvent) => {
    if (event.type === 'event') {
      showEditReminderModal(event.id);
    } else {
      Alert.alert(event.title, event.description || '');
    }
  }, [showEditReminderModal]);

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

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  }, [colors]);

  const renderFilterChips = () => {
    const filters: { type: FilterType; label: string; icon: any }[] = [
      { type: 'all', label: 'All', icon: Grid3X3 },
      { type: 'task', label: 'Tasks', icon: CheckCircle },
      { type: 'event', label: 'Events', icon: CalendarIcon },
      { type: 'bill', label: 'Bills', icon: AlertTriangle },
      { type: 'med', label: 'Medicine', icon: Plus },
      { type: 'note', label: 'Notes', icon: List },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => {
          const IconComponent = filter.icon;
          const isSelected = filterType === filter.type;
          return (
            <TouchableOpacity
              key={filter.type}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface },
                isSelected && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilterType(filter.type)}
            >
              <IconComponent 
                size={14} 
                color={isSelected ? colors.background : colors.textSecondary} 
              />
              <Text style={[
                styles.filterChipText,
                { color: isSelected ? colors.background : colors.textSecondary }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderViewModeButtons = () => {
    const modes: { mode: ViewMode; label: string; icon: any }[] = [
      { mode: 'month', label: 'Month', icon: Grid3X3 },
      { mode: 'week', label: 'Week', icon: CalendarIcon },
      { mode: 'day', label: 'Day', icon: Clock },
      { mode: 'agenda', label: 'List', icon: List },
    ];

    return (
      <View style={styles.viewModeContainer}>
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = viewMode === mode.mode;
          return (
            <TouchableOpacity
              key={mode.mode}
              style={[
                styles.viewModeButton,
                { backgroundColor: colors.surface },
                isSelected && { backgroundColor: colors.primary }
              ]}
              onPress={() => setViewMode(mode.mode)}
            >
              <IconComponent 
                size={16} 
                color={isSelected ? colors.background : colors.textSecondary} 
              />
              <Text style={[
                styles.viewModeText,
                { color: isSelected ? colors.background : colors.textSecondary }
              ]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderEventCard = (event: CalendarEvent, index: number) => (
    <TouchableOpacity
      key={`${event.id}_${index}`}
      style={[
        styles.eventCard,
        { 
          backgroundColor: colors.surface,
          borderLeftColor: getEventTypeColor(event.type),
        }
      ]}
      onPress={() => handleEventPress(event)}
    >
      <View style={styles.eventCardHeader}>
        <View style={[styles.eventIconContainer, { backgroundColor: `${getEventTypeColor(event.type)}15` }]}>
          <Text style={styles.eventIcon}>{getTypeIcon(event.type)}</Text>
        </View>
        <View style={styles.eventCardContent}>
          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
            {event.title}
          </Text>
          {event.description && (
            <Text style={[styles.eventDescription, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.description}
            </Text>
          )}
        </View>
        <View style={styles.eventCardActions}>
          {event.isRecurring && <Repeat size={14} color={colors.primary} />}
          {event.priority && (
            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(event.priority) }]} />
          )}
          {event.completed && <CheckCircle size={14} color={colors.success} />}
        </View>
      </View>
      
      {(event.dueTime || event.location) && (
        <View style={styles.eventCardMeta}>
          {event.dueTime && (
            <View style={[styles.metaChip, { backgroundColor: `${colors.primary}10` }]}>
              <Clock size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
                {formatTimeOnly(event.dueTime)}
              </Text>
            </View>
          )}
          {event.location && (
            <View style={[styles.metaChip, { backgroundColor: `${colors.secondary}10` }]}>
              <MapPin size={12} color={colors.secondary} />
              <Text style={[styles.metaText, { color: colors.secondary }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTimeBlockView = () => (
    <ScrollView style={styles.timeBlockContainer} showsVerticalScrollIndicator={false}>
      {timeBlocks.map((block, index) => (
        <View key={index} style={[styles.timeBlock, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.timeLabel}>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {block.time}
            </Text>
            <View style={[styles.timeLine, { backgroundColor: colors.borderLight }]} />
          </View>
          
          <View style={styles.eventsContainer}>
            {block.events.length === 0 ? (
              <View style={styles.emptyTimeSlot}>
                <Text style={[styles.emptyTimeSlotText, { color: colors.textTertiary }]}>
                  No events
                </Text>
              </View>
            ) : (
              block.events.map((event, eventIndex) => renderEventCard(event, eventIndex))
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAgendaView = () => (
    <ScrollView style={styles.agendaContainer} showsVerticalScrollIndicator={false}>
      {selectedDateEvents.length === 0 ? (
        <View style={styles.emptyAgenda}>
          <CalendarIcon size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyAgendaTitle, { color: colors.text }]}>
            No events for {formatDate(new Date(selectedDate))}
          </Text>
          <Text style={[styles.emptyAgendaSubtitle, { color: colors.textSecondary }]}>
            Tap the + button to add a new event
          </Text>
        </View>
      ) : (
        <View style={styles.agendaList}>
          <Text style={[styles.agendaHeader, { color: colors.text }]}>
            {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} on {formatDate(new Date(selectedDate))}
          </Text>
          {selectedDateEvents.map((event, index) => renderEventCard(event, index))}
        </View>
      )}
    </ScrollView>
  );

  if (showLoginPrompt) {
    return <LoginPrompt visible={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} onSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Enhanced Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {allCalendarEvents.length} events
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionButton, { backgroundColor: colors.background }]}
            onPress={() => setShowCompletedEvents(!showCompletedEvents)}
          >
            {showCompletedEvents ? (
              <Eye size={20} color={colors.primary} />
            ) : (
              <EyeOff size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerActionButton, { backgroundColor: colors.background }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={showFilters ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Selector */}
      {renderViewModeButtons()}

      {/* Filter Chips */}
      {showFilters && renderFilterChips()}

      {/* Calendar Content */}
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
          
          {/* Quick Event Preview for Month View */}
          {selectedDateEvents.length > 0 && (
            <View style={[styles.eventPreview, { backgroundColor: colors.surface }]}>
              <View style={styles.eventPreviewHeader}>
                <Text style={[styles.eventPreviewTitle, { color: colors.text }]}>
                  {formatDate(new Date(selectedDate))}
                </Text>
                <Text style={[styles.eventPreviewCount, { color: colors.textSecondary }]}>
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.eventPreviewList}>
                  {selectedDateEvents.slice(0, 3).map((event, index) => (
                    <TouchableOpacity
                      key={`preview_${event.id}_${index}`}
                      style={[
                        styles.eventPreviewCard,
                        { 
                          backgroundColor: `${getEventTypeColor(event.type)}15`,
                          borderLeftColor: getEventTypeColor(event.type)
                        }
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
                        +{selectedDateEvents.length - 3}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      ) : viewMode === 'week' ? (
        <WeekView
          selectedDate={selectedDate}
          events={allCalendarEvents}
          onDatePress={setSelectedDate}
          onEventPress={handleEventPress}
        />
      ) : viewMode === 'day' ? (
        renderTimeBlockView()
      ) : (
        renderAgendaView()
      )}

      {/* Banner Ad - Bottom of Calendar Screen (only for free users) */}
      {!isPremium && (
        <BannerAdComponent style={{ marginBottom: 20 }} />
      )}

      {/* Interstitial Ad Trigger - Show after user views 5 different dates */}
      <InterstitialAdTrigger
        triggerOnAction={true}
        actionCompleted={selectedDate !== getTodayISO()}
      />

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity 
        onPress={handleAddReminder} 
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color={colors.background} strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.title1,
    fontFamily: Fonts.text.bold,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  viewModeText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  filterContent: {
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  filterChipText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
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
    borderTopColor: colors.borderLight,
  },
  eventPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventPreviewTitle: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
  },
  eventPreviewCount: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
  },
  eventPreviewList: {
    flexDirection: 'row',
    gap: 12,
  },
  eventPreviewCard: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    minWidth: 120,
    maxWidth: 160,
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
    minWidth: 60,
  },
  eventPreviewMoreText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
  },
  timeBlockContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeBlock: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    minHeight: 80,
  },
  timeLabel: {
    width: 80,
    alignItems: 'flex-end',
    paddingRight: 16,
    position: 'relative',
  },
  timeText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    marginBottom: 8,
  },
  timeLine: {
    position: 'absolute',
    right: 0,
    top: 20,
    width: 12,
    height: 1,
  },
  eventsContainer: {
    flex: 1,
    gap: 8,
  },
  emptyTimeSlot: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyTimeSlotText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.regular,
    fontStyle: 'italic',
  },
  agendaContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyAgenda: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyAgendaTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.bold,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyAgendaSubtitle: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
  },
  agendaList: {
    paddingVertical: 16,
  },
  agendaHeader: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
    marginBottom: 16,
  },
  eventCard: {
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 16,
  },
  eventCardContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
  },
  eventCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventCardMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.medium,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});

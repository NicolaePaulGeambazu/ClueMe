import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User, Filter } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';;
import { TimelineGrid } from '../../components/Planner/TimelineGrid';
import { TimeBlock } from '../../components/Planner/TimeBlock';
import { formatDate } from '../../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

export default function PlannerScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  const { reminders, isLoading, loadReminders, useFirebase } = useReminders();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  const styles = createStyles(colors);

  useEffect(() => {
    loadReminders();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const handleTimeSlotPress = (timeSlot: string) => {
    const createReminderAction = () => {
      setSelectedTimeSlot(timeSlot);
      navigation.navigate('Add', { 
        prefillTime: timeSlot,
        prefillDate: currentDate.toISOString().split('T')[0]
      });
    };

    guardAction(createReminderAction);
  };

  const handleReminderPress = (reminder: any) => {
    const viewReminderAction = () => {
      // Navigate to reminder detail/edit screen
      console.log('View reminder:', reminder.id);
    };

    guardAction(viewReminderAction);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDateLocal = (date: Date) => {
    return formatDate(date);
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getRemindersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reminders.filter(reminder => 
      reminder.dueDate === dateStr && !reminder.completed
    );
  };

  const getRemindersForTimeSlot = (date: Date, timeSlot: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return reminders.filter(reminder => 
      reminder.dueDate === dateStr && 
      reminder.dueTime === timeSlot &&
      !reminder.completed
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateDate('prev')}
          >
            <ChevronLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.dateTitle}>
              {viewMode === 'daily' 
                ? formatDateLocal(currentDate)
                : `${formatDateLocal(getWeekDates()[0])} - ${formatDateLocal(getWeekDates()[6])}`
              }
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => navigateDate('next')}
          >
            <ChevronRight size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerControls}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'daily' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('daily')}
            >
              <Text style={[
                styles.toggleText,
                viewMode === 'daily' && styles.toggleTextActive
              ]}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'weekly' && styles.toggleButtonActive
              ]}
              onPress={() => setViewMode('weekly')}
            >
              <Text style={[
                styles.toggleText,
                viewMode === 'weekly' && styles.toggleTextActive
              ]}>Week</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => guardAction(() => navigation.navigate('Add'))}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {isAnonymous && (
        <View style={styles.anonymousNotice}>
          <Text style={styles.noticeText}>
            Sign in to access the full planner with all your reminders and family sharing features.
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {viewMode === 'daily' ? (
          <TimelineGrid
            date={currentDate}
            reminders={getRemindersForDate(currentDate)}
            onTimeSlotPress={handleTimeSlotPress}
            onReminderPress={handleReminderPress}
            colors={colors}
          />
        ) : (
          <View style={styles.weeklyView}>
            {getWeekDates().map((date, index) => (
              <View key={index} style={styles.weekDay}>
                <Text style={styles.weekDayHeader}>
                  {formatDateLocal(date)}
                </Text>
                <Text style={styles.weekDayDate}>
                  {date.getDate()}
                </Text>
                <View style={styles.weekDayReminders}>
                  {getRemindersForDate(date).slice(0, 3).map((reminder) => (
                    <TimeBlock
                      key={reminder.id}
                      reminder={reminder}
                      onPress={() => handleReminderPress(reminder)}
                      colors={colors}
                      compact={true}
                    />
                  ))}
                  {getRemindersForDate(date).length > 3 && (
                    <Text style={styles.moreReminders}>
                      +{getRemindersForDate(date).length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={() => executeAfterAuth(() => console.log('Planner access granted'))}
        title="Planner Access"
        message="Sign in to access the full planner with all your reminders and family sharing features."
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  headerCenter: {
    alignItems: 'center',
  },
  greeting: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 18,
    color: colors.text,
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 12,
  },
  anonymousNotice: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    margin: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  weeklyView: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  weekDayHeader: {
    fontFamily: Fonts.text.semibold,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  weekDayDate: {
    fontFamily: Fonts.display.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  weekDayReminders: {
    width: '100%',
    gap: 4,
  },
  moreReminders: {
    fontFamily: Fonts.text.regular,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
}); 
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-big-calendar';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { 
  getAllCalendarEvents, 
  getEventTypeColor
} from '../../utils/calendarUtils';
import { Mode } from 'react-native-big-calendar';

const { height: screenHeight } = Dimensions.get('window');

interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: string;
  description?: string;
  location?: string;
  color?: string;
}

export default function SimpleCalendar({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt } = useAuthGuard();
  const { reminders, loadReminders } = useReminders();
  const [view, setView] = useState<Mode>('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const events = useMemo((): BigCalendarEvent[] => {
    if (!reminders || reminders.length === 0) return [];
    
    const appEvents = getAllCalendarEvents(reminders);
    return appEvents.map(event => {
      const start = new Date(event.date);
      const end = new Date(event.date);
      
      if (event.startTime) {
        const [hours, minutes] = event.startTime.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
      }
      
      if (event.endTime) {
        const [hours, minutes] = event.endTime.split(':').map(Number);
        end.setHours(hours, minutes, 0, 0);
      } else if (event.startTime) {
        end.setHours(start.getHours() + 1, start.getMinutes(), 0, 0);
      } else {
        end.setHours(23, 59, 59, 999);
      }

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        allDay: !event.startTime,
        type: event.type,
        description: event.description,
        location: event.location,
        color: getEventTypeColor(event.type),
      };
    });
  }, [reminders]);

  const handleAddReminder = useCallback(() => {
    if (isAnonymous) {
      setShowLoginPrompt(true);
      return;
    }
    navigation.navigate('Add', {
      prefillDate: date.toISOString().split('T')[0],
    });
  }, [isAnonymous, date, navigation, setShowLoginPrompt]);

  const handleLoginSuccess = useCallback(() => {
    navigation.navigate('Add', {
      prefillDate: date.toISOString().split('T')[0],
    });
  }, [date, navigation]);

  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    if (event.type === 'event') {
      navigation.navigate('EditReminder', { reminderId: event.id });
    } else {
      Alert.alert(event.title, event.description || '');
    }
  }, [navigation]);

  const handleSelectSlot = useCallback((slotInfo: any) => {
    const selectedDate = slotInfo.start.toISOString().split('T')[0];
    const selectedTime = slotInfo.start.toTimeString().slice(0, 5);
    navigation.navigate('Add', {
      prefillDate: selectedDate,
      prefillTime: selectedTime,
    });
  }, [navigation]);

  const getEventStyle = useCallback((event: any) => ({
    backgroundColor: event.color || colors.primary,
    borderRadius: 4,
    opacity: 0.8,
  }), [colors.primary]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (showLoginPrompt) {
    return <LoginPrompt visible={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} onSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Simple Header */}
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
            {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* View Mode Buttons */}
        <View style={styles.viewButtons}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              view === 'month' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setView('month')}
          >
            <Text style={[
              styles.viewButtonText,
              view === 'month' && { color: colors.background }
            ]}>
              {t('calendar.month')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewButton,
              view === 'schedule' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setView('schedule')}
          >
            <Text style={[
              styles.viewButtonText,
              view === 'schedule' && { color: colors.background }
            ]}>
              {t('calendar.agenda')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Calendar Component */}
      <Calendar
        events={events}
        height={screenHeight * 0.75}
        mode={view}
        date={date}
        onChangeDate={([start]) => setDate(start)}
        onPressEvent={handleSelectEvent}
        onPressCell={handleSelectSlot}
        eventCellStyle={getEventStyle}
        locale="en"
        showTime
        ampm={false}
        swipeEnabled
        showAdjacentMonths
        minHour={6}
        maxHour={22}
        overlapOffset={8}
        showAllDayEventCell
        showVerticalScrollIndicator={false}
      />

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
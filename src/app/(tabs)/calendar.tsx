import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { ChevronLeft, ChevronRight, Plus, Import, Calendar as CalendarIcon, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { isAnonymous } = useAuth();
  const { reminders, loadReminders } = useReminders();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [importing, setImporting] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    loadReminders();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Build calendar grid
  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split('T')[0];
    calendarDays.push(dateStr);
  }

  // Group reminders by date
  const remindersByDate: Record<string, any[]> = {};
  reminders.forEach(rem => {
    if (rem.dueDate) {
      if (!remindersByDate[rem.dueDate]) remindersByDate[rem.dueDate] = [];
      remindersByDate[rem.dueDate].push(rem);
    }
  });

  // Emoji/dot for event types
  const getEventDot = (reminders: any[]) => {
    if (!reminders || reminders.length === 0) return null;
    // Show up to 3 dots/emojis for different types
    const typeToEmoji: Record<string, string> = {
      task: '•',
      bill: '💳',
      med: '💊',
      event: '📅',
      note: '📝',
    };
    const types = Array.from(new Set(reminders.map(r => r.type)));
    return (
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
        {types.slice(0, 3).map((type, idx) => (
          <Text key={type + idx} style={{ fontSize: 14 }}>{typeToEmoji[type] || '•'}</Text>
        ))}
      </View>
    );
  };

  // Reminders for selected day
  const selectedReminders = remindersByDate[selectedDate] || [];

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Import from iOS Reminders/Calendar (placeholder)
  const handleImport = async () => {
    setImporting(true);
    // TODO: Implement actual import logic using Expo Calendar/Permissions
    setTimeout(() => {
      setImporting(false);
      Alert.alert('Import', t('calendar.importSuccess'));
    }, 1200);
  };

  // Delete reminder function
  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      t('calendar.deleteReminder'),
      t('calendar.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('calendar.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement actual delete logic
              console.log('Deleting reminder:', reminderId);
              await loadReminders(); // Reload reminders after deletion
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert(t('common.error'), t('calendar.deleteError'));
            }
          },
        },
      ]
    );
  };

  // Render swipeable reminder item
  const renderReminderItem = ({ item }: { item: any }) => {
    const renderRightActions = () => (
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error }]}
        onPress={() => handleDeleteReminder(item.id)}
      >
        <Trash2 size={20} color="white" />
        <Text style={styles.deleteButtonText}>{t('calendar.delete')}</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.reminderCard}>
          <View style={styles.reminderRow}>
            <Text style={styles.reminderIcon}>{item.type === 'bill' ? '💳' : item.type === 'med' ? '💊' : item.type === 'event' ? '📅' : item.type === 'note' ? '📝' : '•'}</Text>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            {item.isFavorite && <Text style={styles.flagIcon}>🚩</Text>}
          </View>
          <View style={styles.reminderMetaRow}>
            {item.dueTime && <Text style={styles.reminderTime}>{item.dueTime}</Text>}
            {item.repeat && <Text style={styles.reminderRepeat}>🔁</Text>}
            {item.completed && <Text style={styles.reminderCompleted}>✔️</Text>}
            {item.tags && item.tags.length > 0 && (
              <Text style={styles.reminderTags}>{item.tags.map((t: string) => `#${t}`).join(' ')}</Text>
            )}
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('prev')}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth('next')}>
          <ChevronRight size={22} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.importButton} onPress={handleImport} disabled={importing}>
            <Import size={20} color={colors.primary} />
            <Text style={styles.importText}>{importing ? t('calendar.importing') : t('calendar.import')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.calendarGridContainer}>
        <View style={styles.weekHeader}>
          {[
            t('calendar.weekDays.sun'),
            t('calendar.weekDays.mon'),
            t('calendar.weekDays.tue'),
            t('calendar.weekDays.wed'),
            t('calendar.weekDays.thu'),
            t('calendar.weekDays.fri'),
            t('calendar.weekDays.sat')
          ].map(day => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((dateStr, idx) => {
            const isToday = dateStr === getTodayString();
            const isSelected = dateStr === selectedDate;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && styles.selectedCell
                ]}
                onPress={() => dateStr && setSelectedDate(dateStr)}
                disabled={!dateStr}
              >
                <Text style={[
                  styles.dayText,
                  isToday && styles.todayText,
                  isSelected && styles.selectedText
                ]}>
                  {dateStr ? parseInt(dateStr.split('-')[2], 10) : ''}
                </Text>
                {dateStr && getEventDot(remindersByDate[dateStr] || [])}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.remindersListContainer}>
        <Text style={styles.remindersListTitle}>{t('calendar.reminders')}</Text>
        {selectedReminders.length === 0 ? (
          <Text style={styles.emptyReminders}>{t('calendar.noReminders')}</Text>
        ) : (
          <FlatList
            data={selectedReminders}
            keyExtractor={item => item.id}
            renderItem={renderReminderItem}
          />
        )}
      </View>
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={() => {}}
        title={t('calendar.calendarAccess')}
        message={t('calendar.calendarAccessMessage')}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    marginHorizontal: 2,
  },
  monthTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title2,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary + '10',
  },
  importText: {
    fontFamily: Fonts.button,
    fontSize: FontSizes.footnote,
    color: colors.primary,
    marginLeft: 4,
  },
  calendarGridContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    margin: 2,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Fonts.text.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  selectedCell: {
    backgroundColor: colors.primary + '20',
  },
  dayText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  todayText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.primary,
    textAlign: 'center',
  },
  selectedText: {
    color: colors.primary,
  },
  remindersListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  remindersListTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  emptyReminders: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reminderIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  reminderTitle: {
    flex: 1,
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  flagIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
  reminderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTime: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    marginRight: 8,
  },
  reminderRepeat: {
    fontSize: 13,
    marginRight: 8,
  },
  reminderCompleted: {
    fontSize: 13,
    color: colors.success,
    marginRight: 8,
  },
  reminderTags: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textTertiary,
    marginLeft: 8,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    backgroundColor: colors.error,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    fontFamily: Fonts.button,
    fontSize: FontSizes.footnote,
    color: 'white',
    marginTop: 4,
  },
});
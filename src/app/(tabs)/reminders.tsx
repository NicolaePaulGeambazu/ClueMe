import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Animated, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, CheckCircle, AlertCircle, Timer, List, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useReminders } from '../../hooks/useReminders';
import { Colors } from '../../constants/Colors';
import { filterReminders, sortReminders } from '../../utils/reminderUtils';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';

interface RemindersScreenProps {
  navigation: any;
  route: any;
}

export default function RemindersScreen({ navigation, route }: RemindersScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { reminders, isLoading, loadReminders, deleteReminder } = useReminders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'total');
  
  const tabs = [
    { key: 'total', label: t('home.stats.total') },
    { key: 'pending', label: t('home.stats.pending') },
    { key: 'favorites', label: t('home.stats.favorites') },
    { key: 'overdue', label: t('home.stats.overdue') },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      t('reminders.deleteReminder'),
      t('reminders.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('reminders.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminder(reminderId);
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert(t('common.error'), t('reminders.deleteError'));
            }
          },
        },
      ]
    );
  };

  const getFilteredReminders = () => {
    switch (activeTab) {
      case 'total':
        return sortReminders.byCreated(reminders);
      case 'pending':
        const pendingReminders = filterReminders.byCompleted(reminders, false);
        return sortReminders.byDueDate(pendingReminders, 'asc');
      case 'favorites':
        const favoriteReminders = filterReminders.byFavorite(reminders);
        return sortReminders.byCreated(favoriteReminders);
      case 'overdue':
        const overdueReminders = filterReminders.byOverdue(reminders);
        return sortReminders.byDueDate(overdueReminders, 'asc');
      default:
        return reminders;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'total':
        return t('reminders.noReminders');
      case 'pending':
        return t('reminders.noPendingReminders');
      case 'favorites':
        return t('reminders.noFavoriteReminders');
      case 'overdue':
        return t('reminders.noOverdueReminders');
      default:
        return t('reminders.noReminders');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('reminders.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Custom Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              { backgroundColor: colors.surface },
              activeTab === tab.key && { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? '#FFFFFF' : colors.textSecondary }
            ]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <RemindersList 
        reminders={getFilteredReminders()}
        isLoading={isLoading}
        emptyMessage={getEmptyMessage()}
        colors={colors}
        onDeleteReminder={handleDeleteReminder}
      />
    </SafeAreaView>
  );
}

// Swipeable Reminder Component
interface SwipeableReminderProps {
  reminder: any;
  colors: any;
  onDelete: (id: string) => void;
}

const SwipeableReminder: React.FC<SwipeableReminderProps> = ({ reminder, colors, onDelete }) => {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -60) {
        // Swipe left - open delete
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        setIsOpen(true);
      } else {
        // Swipe right or not enough - close
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        setIsOpen(false);
      }
    }
  };

  const closeSwipe = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(deleteOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setIsOpen(false);
  };

  const handleDelete = () => {
    closeSwipe();
    onDelete(reminder.id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '✓';
      case 'bill': return '💳';
      case 'med': return '💊';
      case 'event': return '📅';
      case 'note': return '📝';
      default: return '•';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete Button Background with Opacity Animation */}
      <Animated.View 
        style={[
          styles.deleteButton,
          { 
            backgroundColor: colors.error,
            opacity: deleteOpacity,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.deleteButtonContent}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={styles.deleteIconContainer}>
            <Trash2 size={20} color="white" strokeWidth={2} />
          </View>
          <Text style={styles.deleteButtonText}>{t('reminders.delete')}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Reminder Card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.reminderCard,
            { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              transform: [{ translateX }],
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isOpen ? 0.1 : 0.05,
              shadowRadius: isOpen ? 8 : 4,
              elevation: isOpen ? 4 : 2,
            }
          ]}
        >
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderTypeIcon}>{getTypeIcon(reminder.type)}</Text>
            <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={2}>
              {reminder.title}
            </Text>
            {reminder.isFavorite && <Star size={16} color={colors.warning} fill={colors.warning} style={{ marginLeft: 4 }} />}
            {reminder.completed && <CheckCircle size={16} color={colors.success} style={{ marginLeft: 4 }} />}
          </View>
          
          {reminder.description ? (
            <Text style={[styles.reminderDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {reminder.description}
            </Text>
          ) : null}
          
          <View style={styles.reminderMetaRow}>
            {reminder.dueDate && (
              <View style={styles.reminderMetaItem}>
                <Timer size={14} color={colors.textSecondary} />
                <Text style={[styles.reminderMetaText, { color: colors.textSecondary }]}>
                  {formatDate(reminder.dueDate)}{reminder.dueTime ? ` ${formatTimeOnly(reminder.dueTime)}` : ''}
                </Text>
              </View>
            )}
            {reminder.priority && (
              <View style={[styles.reminderMetaItem, { backgroundColor: getPriorityColor(reminder.priority) + '15', borderRadius: 6, paddingHorizontal: 6 }]}>
                <Text style={[styles.reminderMetaText, { color: getPriorityColor(reminder.priority) }]}>
                  {reminder.priority}
                </Text>
              </View>
            )}
            {reminder.tags && reminder.tags.length > 0 && (
              <View style={styles.reminderMetaItem}>
                <Text style={[styles.reminderMetaText, { color: colors.textSecondary }]}>
                  {reminder.tags.map((tag: string) => `#${tag}`).join(' ')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Shared RemindersList Component
interface RemindersListProps {
  reminders: any[];
  isLoading: boolean;
  emptyMessage: string;
  colors: any;
  onDeleteReminder: (id: string) => void;
}

function RemindersList({ reminders, isLoading, emptyMessage, colors, onDeleteReminder }: RemindersListProps) {
  const { t } = useTranslation();

  const renderReminder = ({ item }: { item: any }) => (
    <SwipeableReminder
      reminder={item}
      colors={colors}
      onDelete={onDeleteReminder}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (reminders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <List size={48} color={colors.textSecondary} strokeWidth={1} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reminders}
      renderItem={renderReminder}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.semibold,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    textAlign: 'center',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  swipeableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.semibold,
    color: 'white',
    textAlign: 'center',
  },
  reminderCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  reminderTitle: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.medium,
    lineHeight: LineHeights.body,
  },
  reminderDescription: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    lineHeight: LineHeights.callout,
    marginBottom: 12,
  },
  reminderMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  reminderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderMetaText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
  },
}); 
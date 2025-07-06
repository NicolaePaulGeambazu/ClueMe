import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList, Animated, Alert, Modal, Dimensions, Platform } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, CheckCircle, AlertCircle, Timer, List, Trash2, Edit, ChevronDown, SortAsc, SortDesc, Repeat, Clock, Calendar, Tag, Bell, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useReminders } from '../hooks/useReminders';
import { Colors } from '../constants/Colors';
import { filterReminders, sortReminders, showRecurringDeleteConfirmation, isRecurringReminder, getRecurringPatternDescription } from '../utils/reminderUtils';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import { formatDate, formatTimeOnly, isOverdue as isOverdueUtil } from '../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RemindersScreenProps {
  navigation: any;
  route: any;
}

export default function RemindersScreen({ navigation, route }: RemindersScreenProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { reminders, isLoading, error, loadReminders, deleteReminder } = useReminders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'total');
  
  // Sorting state
  const [sortOption, setSortOption] = useState<'chronological' | 'name' | 'priority' | 'created' | 'dueDate'>('chronological');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Debug log only when relevant data changes
  useEffect(() => {
    if (__DEV__) {
      console.log('📋 RemindersScreen rendering:', {
        isLoading,
        remindersCount: reminders?.length || 0,
        activeTab,
        sortOption,
        sortDirection,
        filteredCount: filteredReminders?.length || 0,
        error
      });
    }
  }, [isLoading, reminders, activeTab, sortOption, sortDirection, error]);

  // Load reminders on mount
  useEffect(() => {
    loadReminders();
  }, []);

  const tabs = useMemo(() => [
    { key: 'total', label: t('home.stats.total'), icon: List },
    { key: 'pending', label: t('home.stats.pending'), icon: Clock },
    { key: 'favorites', label: t('home.stats.favorites'), icon: Star },
    { key: 'overdue', label: t('home.stats.overdue'), icon: AlertCircle },
  ], [t]);

  const sortOptions = useMemo(() => [
    { key: 'chronological', label: t('reminders.sortOptions.chronological'), icon: Calendar },
    { key: 'name', label: t('reminders.sortOptions.name'), icon: SortAsc },
    { key: 'priority', label: t('reminders.sortOptions.priority'), icon: AlertCircle },
    { key: 'created', label: t('reminders.sortOptions.created'), icon: Clock },
    { key: 'dueDate', label: t('reminders.sortOptions.dueDate'), icon: Timer },
  ], [t]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  }, [loadReminders]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleDeleteReminder = useCallback(async (reminderId: string) => {
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
  }, [t, deleteReminder]);

  const handleEditReminder = useCallback((reminderId: string) => {
    navigation.navigate('EditReminder', { reminderId });
  }, [navigation]);

  const getSortedReminders = useCallback((remindersToSort: any[]) => {
    switch (sortOption) {
      case 'chronological':
        return sortReminders.chronological(remindersToSort, sortDirection);
      case 'name':
        return sortReminders.byTitle(remindersToSort, sortDirection);
      case 'priority':
        return sortReminders.byPriority(remindersToSort);
      case 'created':
        return sortReminders.byCreated(remindersToSort, sortDirection);
      case 'dueDate':
        return sortReminders.byDueDate(remindersToSort, sortDirection);
      default:
        return remindersToSort;
    }
  }, [sortOption, sortDirection]);

  const filteredReminders = useMemo(() => {
    if (!reminders || reminders.length === 0) {
      console.log('No reminders available');
      return [];
    }
    
    let filtered;
    switch (activeTab) {
      case 'total':
        filtered = reminders;
        break;
      case 'pending':
        filtered = filterReminders.byCompleted(reminders, false);
        break;
      case 'favorites':
        filtered = filterReminders.byFavorite(reminders);
        break;
      case 'overdue':
        filtered = filterReminders.byOverdue(reminders);
        break;
      default:
        filtered = reminders;
    }
    
    const sorted = getSortedReminders(filtered || []);
    console.log(`Filtered reminders for ${activeTab}:`, sorted?.length || 0);
    return sorted;
  }, [reminders, activeTab, getSortedReminders]);

  const emptyMessage = useMemo(() => {
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
  }, [activeTab, t]);

  // Extracted empty state for clarity
  const EmptyState = () => {
    const IconComponent = tabs.find(tab => tab.key === activeTab)?.icon || List;
    
    return (
      <Animated.View 
        style={[
          styles.centerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
          <IconComponent size={56} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyText, { color: colors.text }]}> 
          {emptyMessage}
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          {t('reminders.tapPlusToAdd')}
        </Text>
      </Animated.View>
    );
  };

  // Check if this is being used as home screen (no route params)
  const isHomeScreen = !route?.params?.initialTab;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {!isHomeScreen && (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <View style={[styles.iconButton, { backgroundColor: colors.surface }]}>
              <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('reminders.title')}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowSortModal(true)} 
            style={styles.sortButton}
          >
            <View style={[styles.iconButton, { backgroundColor: colors.primary + '15' }]}>
              {sortDirection === 'asc' ? (
                <SortAsc size={20} color={colors.primary} strokeWidth={2} />
              ) : (
                <SortDesc size={20} color={colors.primary} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComponent = tab.icon;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  { 
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <IconComponent 
                  size={18} 
                  color={isActive ? '#FFFFFF' : colors.textSecondary} 
                  strokeWidth={2}
                />
                <Text style={[
                  styles.tabLabel,
                  { 
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                    fontFamily: isActive ? Fonts.text.semibold : Fonts.text.medium,
                  },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {isHomeScreen && (
          <TouchableOpacity 
            onPress={() => setShowSortModal(true)} 
            style={styles.homeSortButton}
          >
            <View style={[styles.iconButton, { backgroundColor: colors.primary + '15' }]}>
              {sortDirection === 'asc' ? (
                <SortAsc size={18} color={colors.primary} strokeWidth={2} />
              ) : (
                <SortDesc size={18} color={colors.primary} strokeWidth={2} />
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.centerContainer}>
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '10' }]}>
            <AlertCircle size={48} color={colors.error} strokeWidth={1.5} />
            <Text style={[styles.errorText, { color: colors.error }]}> 
              {t('common.error')}
            </Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        </View>
      ) : (
        <RemindersList
          reminders={filteredReminders}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          colors={colors}
          onDeleteReminder={handleDeleteReminder}
          onEditReminder={handleEditReminder}
          EmptyState={EmptyState}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate('Add')} 
        style={[styles.fab, { backgroundColor: colors.primary }]}
      >
        <Plus size={28} color={colors.background} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Sorting Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <Animated.View
            style={[
              styles.sortModalContainer,
              { 
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            
            <View style={styles.sortModalHeader}>
              <Text style={[styles.sortModalTitle, { color: colors.text }]}>
                {t('reminders.sortBy')}
              </Text>
            </View>

            <View style={styles.sortOptionsContainer}>
              {sortOptions.map((option) => {
                const isActive = sortOption === option.key;
                const IconComponent = option.icon;
                
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      isActive && { 
                        backgroundColor: colors.primary + '10',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setSortOption(option.key as any);
                      setShowSortModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconComponent 
                      size={20} 
                      color={isActive ? colors.primary : colors.textSecondary} 
                      strokeWidth={2}
                    />
                    <Text style={[
                      styles.sortOptionText,
                      { 
                        color: isActive ? colors.primary : colors.text,
                        fontFamily: isActive ? Fonts.text.semibold : Fonts.text.regular,
                      },
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.sortDirectionContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.directionOption,
                  sortDirection === 'asc' && { backgroundColor: colors.primary + '10' },
                ]}
                onPress={() => setSortDirection('asc')}
                activeOpacity={0.7}
              >
                <SortAsc size={20} color={sortDirection === 'asc' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.directionText,
                  { 
                    color: sortDirection === 'asc' ? colors.primary : colors.text,
                    fontFamily: sortDirection === 'asc' ? Fonts.text.semibold : Fonts.text.regular,
                  }
                ]}>
                  {t('reminders.sortDirection.ascending')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.directionOption,
                  sortDirection === 'desc' && { backgroundColor: colors.primary + '10' },
                ]}
                onPress={() => setSortDirection('desc')}
                activeOpacity={0.7}
              >
                <SortDesc size={20} color={sortDirection === 'desc' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.directionText,
                  { 
                    color: sortDirection === 'desc' ? colors.primary : colors.text,
                    fontFamily: sortDirection === 'desc' ? Fonts.text.semibold : Fonts.text.regular,
                  }
                ]}>
                  {t('reminders.sortDirection.descending')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Swipeable Reminder Component
interface SwipeableReminderProps {
  reminder: any;
  colors: any;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const SwipeableReminder: React.FC<SwipeableReminderProps> = React.memo(({ reminder, colors, onDelete, onEdit }) => {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
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
            toValue: -100,
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
        closeSwipe();
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
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      closeSwipe();
      if (isRecurringReminder(reminder)) {
        showRecurringDeleteConfirmation(
          reminder,
          () => onDelete(reminder.id),
          () => onDelete(reminder.id)
        );
      } else {
        onDelete(reminder.id);
      }
    });
  };

  const handleEdit = () => {
    onEdit(reminder.id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return { component: CheckCircle, emoji: null };
      case 'bill': return { component: null, emoji: '💳' };
      case 'med': return { component: null, emoji: '💊' };
      case 'event': return { component: Calendar, emoji: null };
      case 'note': return { component: null, emoji: '📝' };
      default: return { component: Bell, emoji: null };
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

  const isOverdue = () => {
    if (!reminder.dueDate || reminder.completed) return false;
    
    try {
      return isOverdueUtil(reminder.dueDate, reminder.completed, reminder.dueTime, reminder);
    } catch (error) {
      console.warn('Error checking if reminder is overdue:', error);
      const dueDate = new Date(reminder.dueDate);
      const now = new Date();
      return dueDate < now;
    }
  };

  const typeIcon = getTypeIcon(reminder.type);

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete Button Background */}
      <Animated.View
        style={[
          styles.deleteButton,
          {
            backgroundColor: colors.error,
            opacity: deleteOpacity,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButtonContent}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={[styles.deleteIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Trash2 size={22} color="white" strokeWidth={2.5} />
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
              borderColor: isOverdue() ? colors.error + '30' : colors.border,
              borderWidth: 1,
              transform: [{ translateX }],
              shadowColor: colors.shadow,
            },
            isOverdue() && styles.overdueCard,
          ]}
        >
          <View style={styles.reminderContent}>
            <View style={styles.reminderLeft}>
              <View style={[
                styles.typeIconContainer,
                { backgroundColor: colors.primary + '10' }
              ]}>
                {typeIcon.emoji ? (
                  <Text style={styles.reminderTypeEmoji}>{typeIcon.emoji}</Text>
                ) : typeIcon.component ? (
                  React.createElement(typeIcon.component, {
                    size: 20,
                    color: colors.primary,
                    strokeWidth: 2
                  })
                ) : null}
              </View>
            </View>

            <View style={styles.reminderMiddle}>
              <View style={styles.reminderHeader}>
                <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>
                  {reminder.title}
                </Text>
                <View style={styles.reminderBadges}>
                  {reminder.isRecurring && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                      <Repeat size={12} color={colors.primary} strokeWidth={2} />
                    </View>
                  )}
                  {reminder.isFavorite && (
                    <View style={[styles.badge, { backgroundColor: colors.warning + '15' }]}>
                      <Star size={12} color={colors.warning} fill={colors.warning} strokeWidth={2} />
                    </View>
                  )}
                  {reminder.completed && (
                    <View style={[styles.badge, { backgroundColor: colors.success + '15' }]}>
                      <CheckCircle size={12} color={colors.success} fill={colors.success} strokeWidth={2} />
                    </View>
                  )}
                </View>
              </View>

              {reminder.description ? (
                <Text style={[styles.reminderDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                  {reminder.description}
                </Text>
              ) : null}

              <View style={styles.reminderMetaRow}>
                {reminder.dueDate && (
                  <View style={styles.reminderMetaItem}>
                    <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                    <Text style={[styles.reminderMetaText, { color: colors.textSecondary }]}>
                      {formatDate(reminder.dueDate)}{reminder.dueTime ? ` ${formatTimeOnly(reminder.dueTime)}` : ''}
                    </Text>
                  </View>
                )}
                
                {reminder.priority && (
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(reminder.priority) + '15' }
                  ]}>
                    <Text style={[
                      styles.priorityText,
                      { color: getPriorityColor(reminder.priority) }
                    ]}>
                      {reminder.priority.charAt(0).toUpperCase() + reminder.priority.slice(1)}
                    </Text>
                  </View>
                )}
              </View>

              {reminder.tags && reminder.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  <Tag size={12} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[styles.tagsText, { color: colors.textTertiary }]} numberOfLines={1}>
                    {reminder.tags.map((tag: string) => `#${tag}`).join(' ')}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={[styles.editIconContainer, { backgroundColor: colors.background }]}>
                <Edit size={16} color={colors.textSecondary} strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </View>

          {isOverdue() && (
            <View style={[styles.overdueIndicator, { backgroundColor: colors.error }]} />
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
});

// Shared RemindersList Component
interface RemindersListProps {
  reminders: any[];
  isLoading: boolean;
  emptyMessage: string;
  colors: any;
  onDeleteReminder: (id: string) => void;
  onEditReminder: (id: string) => void;
  EmptyState: React.ComponentType;
}

function RemindersList({ reminders, isLoading, emptyMessage, colors, onDeleteReminder, onEditReminder, EmptyState }: RemindersListProps) {
  const { t } = useTranslation();

  const renderReminder = ({ item }: { item: any }) => {
    return (
      <SwipeableReminder
        reminder={item}
        colors={colors}
        onDelete={onDeleteReminder}
        onEdit={onEditReminder}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.loadingText, { color: colors.primary }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  if (reminders.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={reminders}
        renderItem={renderReminder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              // Trigger refresh if needed
            }}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
  },
  backButton: {
    marginRight: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    textAlign: 'center',
  },
  sortButton: {
    marginLeft: 16,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsScrollContent: {
    paddingRight: 12,
    gap: 12,
  },
  homeSortButton: {
    marginLeft: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.medium,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: FontSizes.headline,
    fontFamily: Fonts.text.semibold,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSizes.headline,
    fontFamily: Fonts.text.semibold,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  loadingText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.medium,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#C0C0C0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sortModalHeader: {
    marginBottom: 24,
  },
  sortModalTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.bold,
    textAlign: 'center',
  },
  sortOptionsContainer: {
    marginBottom: 24,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 12,
  },
  sortOptionText: {
    fontSize: FontSizes.body,
    flex: 1,
  },
  sortDirectionContainer: {
    borderTopWidth: 1,
    paddingTop: 24,
    gap: 8,
  },
  directionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  directionText: {
    fontSize: FontSizes.body,
    flex: 1,
  },
  swipeableContainer: {
    marginBottom: 0,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  deleteButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteButtonText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    color: 'white',
  },
  reminderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  overdueCard: {
    borderWidth: 2,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderLeft: {
    marginRight: 12,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderTypeEmoji: {
    fontSize: 20,
  },
  reminderMiddle: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
    flex: 1,
  },
  reminderBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderDescription: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    marginBottom: 8,
  },
  reminderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tagsText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  editIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  overdueIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

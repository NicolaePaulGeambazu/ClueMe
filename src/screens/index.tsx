import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useReminderContext } from '../contexts/ReminderContext';
import { useFamily } from '../contexts/FamilyContext';
import { usePremium } from '../hooks/usePremium';
import { useModal } from '../contexts/ModalContext';
import { useSettings } from '../contexts/SettingsContext';
import PremiumUpgradeModal from '../components/premium/PremiumUpgradeModal';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import { TextStyles } from '../utils/textScaling';
import {
  Calendar,
  Clock,
  Users,
  Settings,
  Bell,
  AlertCircle,
  Repeat,
  Sparkles,
  TrendingUp,
  Trash2,
  Edit,
  MapPin,
} from 'lucide-react-native';
import { GridIcon } from '../components/common/GridIcon';
import { filterReminders, getRecurringPatternDescription } from '../utils/reminderUtils';
import { formatDate, formatTimeOnly, getTodayISO } from '../utils/dateUtils';
import { format as formatDateFns } from 'date-fns';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';
import { isRecurringReminder } from '../utils/reminderUtils';

import type { Reminder } from '../design-system/reminders/types';
import type { GestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

interface IndexScreenProps {
  navigation: any; // You can replace 'any' with the proper navigation type if available
}

const { width: screenWidth } = Dimensions.get('window');

const ICONS: Record<string, string> = {
  task: '📋',
  event: '📅',
  note: '📝',
  reminder: '⏰',
  bill: '💳',
  med: '💊',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: Colors.light.error,
  medium: Colors.light.warning,
  low: Colors.light.success,
};
const MODAL_OPACITY = 0.4;
const MODAL_BG = `rgba(0,0,0,${MODAL_OPACITY})`;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 100;
const FAB_MENU_ANIMATION_DURATION = 200;

const IndexScreen: React.FC<IndexScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const {  isAnonymous } = useAuth();
  const { reminders, isLoading, isInitialized, error, loadReminders, deleteReminder } = useReminderContext();
  const { fabPosition, setFabPosition } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showNotificationDebug, setShowNotificationDebug] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState('');
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false);
  const { isPremium, hasFeature } = usePremium();
  
  // FAB drag state
  const fabTranslateX = useRef(new Animated.Value(0)).current;
  const [showFabHint, setShowFabHint] = useState(true);
  const [hasDraggedFab, setHasDraggedFab] = useState(false);
  const fabHintAnim = useRef(new Animated.Value(0)).current;

  // FAB hint animation
  useEffect(() => {
    if (showFabHint && !hasDraggedFab) {
      const startHintAnimation = () => {
        Animated.sequence([
          Animated.timing(fabHintAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fabHintAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Repeat the animation after 3 seconds
          setTimeout(startHintAnimation, 3000);
        });
      };
      
      startHintAnimation();
    }
  }, [showFabHint, hasDraggedFab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  // Memoize derived data
  const todayReminders = useMemo(() => {
    if (!reminders || !isInitialized) return [];
    const today = getTodayISO();
    return reminders.filter(reminder => {
      if (!reminder.dueDate) return false;
      
      // Convert reminder date to YYYY-MM-DD format for comparison
      const reminderDate = new Date(reminder.dueDate);
      const reminderDateString = formatDateFns(reminderDate, 'yyyy-MM-dd');
      
      return reminderDateString === today;
    });
  }, [reminders, isInitialized]);

  const stats = useMemo(() => {
    if (!reminders || !isInitialized) return { total: 0, pending: 0, favorites: 0, overdue: 0 };
    return {
      total: reminders.length,
      pending: filterReminders.byCompleted(reminders, false).length,
      favorites: filterReminders.byFavorite(reminders).length,
      overdue: filterReminders.byOverdue(reminders).length,
    };
  }, [reminders, isInitialized]);

  const getTypeIcon = (type: string) => {
    return ICONS[type] || ICONS.task;
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  };

  const handleFabPress = () => {
    setShowFabMenu(!showFabMenu);
  };

  const handleFabDrag = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    // Calculate the center of the screen
    const screenCenter = screenWidth / 2;
    const currentPosition = fabPosition === 'left' ? 0 : screenWidth - 80; // 80 is FAB width + margins
    
    // Update the animated value
    fabTranslateX.setValue(translationX);
  };

  const handleFabDragEnd = (event: any) => {
    const { translationX } = event.nativeEvent;
    
    // Determine which side the FAB should snap to
    const screenCenter = screenWidth / 2;
    const newPosition = translationX > 0 ? 'right' : 'left';
    
    // Only update if position actually changed
    if (newPosition !== fabPosition) {
      setFabPosition(newPosition);
    }
    
    // Mark that user has dragged the FAB and hide hint
    if (!hasDraggedFab) {
      setHasDraggedFab(true);
      setShowFabHint(false);
    }
    
    // Reset the animated value
    fabTranslateX.setValue(0);
  };

  const handleQuickAction = (action: string) => {
    setShowFabMenu(false);
    switch (action) {
      case 'add':
        navigation.navigate('Add');
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'countdown':
        navigation.navigate('Countdown');
        break;
      case 'lists':
        navigation.navigate('Lists');
        break;
      case 'family':
        navigation.navigate('Family');
        break;
    }
  };

  const handleDeleteReminder = (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    if (isRecurringReminder(reminder)) {
      // Show recurring delete modal with proper props
      setSelectedReminderId(reminderId);
      setShowDeleteConfirmation(true);
    } else {
      // Show regular delete modal
      setSelectedReminderId(reminderId);
      setShowDeleteConfirmation(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedReminderId) {
      try {
        // Find the reminder to get its details
        const reminder = reminders.find(r => r.id === selectedReminderId);
        if (reminder) {
          // Use the delete reminder function from useReminders
          await deleteReminder(selectedReminderId);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('errors.unknown'));
      } finally {
        // Only close modal after deletion completes (success or error)
        setSelectedReminderId('');
        setShowDeleteConfirmation(false);
      }
    }
  };

  const handleConfirmRecurringDelete = async (deleteAll: boolean) => {
    if (selectedReminderId) {
      try {
        // Find the reminder to get its details
        const reminder = reminders.find(r => r.id === selectedReminderId);
        if (reminder) {
          // Use the delete reminder function from useReminders
          await deleteReminder(selectedReminderId);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('errors.unknown'));
      } finally {
        // Only close modal after deletion completes (success or error)
        setSelectedReminderId('');
        setShowDeleteConfirmation(false);
      }
    }
  };

  const { showEditReminderModal } = useModal();

  const handleEditReminder = (reminderId: string) => {
    showEditReminderModal(reminderId);
  };

  // Swipeable Home Reminder Component
  interface SwipeableHomeReminderProps {
    reminder: Reminder;
    colors: typeof Colors['light'];
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    isFirst: boolean;
  }

  const SwipeableHomeReminder: React.FC<SwipeableHomeReminderProps> = React.memo(({ 
    reminder, 
    colors, 
    onDelete, 
    onEdit, 
    isFirst 
  }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const deleteOpacity = useRef(new Animated.Value(0)).current;
    const editOpacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const [isOpen, setIsOpen] = useState(false);

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event: GestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationX } = (event.nativeEvent as any);

        if (translationX < -SWIPE_THRESHOLD) {
          // Swipe left - open actions with enhanced animation
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: -140,
              useNativeDriver: true,
              tension: 80,
              friction: 9,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(editOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(cardScale, {
                toValue: 0.98,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.spring(cardScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 150,
                friction: 10,
              }),
            ]),
          ]).start(() => setIsOpen(true));
        } else {
          // Close with smooth animation
          closeSwipe();
        }
      }
    };

    const closeSwipe = () => {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(deleteOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(editOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
      ]).start(() => setIsOpen(false));
    };

    const handleDelete = () => {
      // Enhanced delete animation with feedback
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
      ]).start(() => {
        closeSwipe();
        onDelete(reminder.id);
      });
    };

    const handleEdit = () => {
      // Enhanced edit animation with feedback
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 10,
        }),
      ]).start(() => {
        closeSwipe();
        onEdit(reminder.id);
      });
    };

    const handlePress = () => {
      if (!isOpen) {
        onEdit(reminder.id);
      }
    };

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={{
          transform: [{ translateX }, { scale: cardScale }],
          marginTop: isFirst ? 12 : 0,
          marginBottom: 10,
          position: 'relative',
        }}>
          {/* Swipe Actions - Positioned to be revealed by swipe */}
          <View style={{
            position: 'absolute',
            right: -140, // Position outside the card
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            zIndex: 1,
            width: 140, // Width to match the swipe distance
            backgroundColor: colors.surface,
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16,
            borderBottomRightRadius: 16,
            borderBottomLeftRadius: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: -2, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
          }}>
            <Animated.View style={{ 
              opacity: editOpacity,
              transform: [{ scale: editOpacity }],
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.background,
                  padding: 16,
                  borderRadius: 20,
                  marginRight: 12,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <Edit size={20} color={colors.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ 
              opacity: deleteOpacity,
              transform: [{ scale: deleteOpacity }],
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.error,
                  padding: 16,
                  borderRadius: 20,
                  marginRight: 12,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: colors.error + '30',
                }}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Trash2 size={20} color={colors.background} strokeWidth={2.5} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Main Card Row */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: colors.shadow,
                shadowOpacity: 0.08,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
                minHeight: 56,
                overflow: 'hidden', // Ensure content doesn't show outside bounds
              },
              // Add subtle swipe indicator
              {
                borderLeftWidth: 3,
                borderLeftColor: colors.primary + '20',
              }
            ]}
            onPress={handlePress}
          >
            {/* Left: Title and Location */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: FontSizes.body,
                  fontFamily: Fonts.text.semibold,
                  color: colors.text,
                  flexShrink: 1,
                  flexWrap: 'nowrap',
                  maxWidth: screenWidth * 0.45,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {reminder.title}
              </Text>
              {reminder.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                  <MapPin size={12} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={{
                    fontSize: FontSizes.caption1,
                    fontFamily: Fonts.text.regular,
                    color: colors.textTertiary,
                    flexShrink: 1,
                  }} numberOfLines={1}>
                    {reminder.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Center: Recurring icon/label */}
            {reminder.isRecurring ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 }}>
                <Repeat size={18} color={colors.primary} style={{ marginRight: 2 }} />
                <Text style={{ color: colors.primary, fontSize: FontSizes.caption1, fontFamily: Fonts.text.medium }}>
                  {getRecurringPatternDescription(reminder)}
                </Text>
              </View>
            ) : <View style={{ width: 24 }} />}

            {/* Right: Due date/time */}
            <View style={{ alignItems: 'flex-end', minWidth: 70 }}>
              <Text style={{
                color: colors.textSecondary,
                fontSize: FontSizes.callout,
                fontFamily: Fonts.text.medium,
              }}>
                {reminder.dueDate ? formatDate(reminder.dueDate) : ''}
              </Text>
              {reminder.dueTime && (
                <Text style={{
                  color: colors.textTertiary,
                  fontSize: FontSizes.caption1,
                  fontFamily: Fonts.text.regular,
                }}>
                  {formatTimeOnly(reminder.dueTime)}
                </Text>
              )}
              {/* Swipe hint indicator */}
              <View style={{
                marginTop: 4,
                opacity: 0.3,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.textTertiary,
                  marginRight: 2,
                }} />
                <View style={{
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.textTertiary,
                  marginRight: 2,
                }} />
                <View style={{
                  width: 2,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: colors.textTertiary,
                }} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    );
  });

  // Extracted empty state for clarity
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={theme === 'dark' 
          ? require('../assets/images/empty-box-dark.png') 
          : require('../assets/images/empty-box.png')}
        style={styles.emptyImage as import('react-native').ImageStyle}
        resizeMode="contain"
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('home.noEventsToday')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}> 
        {t('home.noEventsTodayDescription')}
      </Text>
      {isAnonymous && (
        <TouchableOpacity 
          style={[styles.signInButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.signInButtonText, { color: '#FFFFFF' }]}> 
            {t('home.signIn')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Focus Mode Banner */}
      
      {/* Enhanced Hero Header with White Background */}
      <View style={[styles.heroContainer, { backgroundColor: '#FFFFFF' }]}>
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <View style={styles.greetingContainer}>
              <Sparkles size={24} color={colors.primary} style={styles.sparkleIcon} />
              <Text style={[styles.heroGreeting, { color: colors.text }]}>
                {isAnonymous ? t('home.welcomeAnonymous') : t('home.welcomeBack')}
              </Text>
            </View>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              {isAnonymous ? t('home.anonymousBannerDescription') : t('home.subtitle')}
            </Text>
          </View>
          
        </View>
      </View>

      <ScrollView
        style={[
          styles.content, 
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >

        {/* Enhanced Stats Summary */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'total' })}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Bell size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.stats.total')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'pending' })}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Clock size={20} color={colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.stats.pending')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'overdue' })}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.error}15` }]}>
              <AlertCircle size={20} color={colors.error} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats.overdue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home.stats.overdue')}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Reminders */}
        <View style={styles.todayContainer}>
          <View style={styles.todayHeader}>
            <View style={styles.sectionTitleContainer}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('home.todaysEvents')}
              </Text>
            </View>
            <View style={[styles.dateChip, { backgroundColor: colors.surface }]}>
              <Text style={[styles.todayDate, { color: colors.textSecondary }]}>
                {formatDate(new Date())}
              </Text>
            </View>
          </View>
          {error ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.error }]}> 
                {t('common.error')}: {error}
              </Text>
            </View>
          ) : !isInitialized ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}> 
                {t('common.loading')}
              </Text>
            </View>
          ) : todayReminders.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.remindersList}>
                {todayReminders.map((reminder, index) => (
                <SwipeableHomeReminder
                  key={reminder.id}
                  reminder={reminder}
                  colors={colors}
                  onDelete={handleDeleteReminder}
                  onEdit={handleEditReminder}
                  isFirst={index === 0}
                />
              ))}
            </View>
          )}
        </View>

        {/* Interstitial Ad Trigger - Show after user completes 3 actions */}

      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <View style={[
        styles.fabContainer,
        fabPosition === 'left' ? styles.fabContainerLeft : styles.fabContainerRight
      ]}>
        {showFabMenu && (
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickAction('calendar')}
            >
              <View style={[styles.fabMenuIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Calendar size={20} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickAction('countdown')}
            >
              <View style={[styles.fabMenuIconContainer, { backgroundColor: `${colors.warning}15` }]}>
                <Clock size={20} color={colors.warning} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickAction('family')}
            >
              <View style={[styles.fabMenuIconContainer, { backgroundColor: `${colors.tertiary}15` }]}>
                <Users size={20} color={colors.tertiary} />
              </View>
            </TouchableOpacity>
          </View>
        )}
        <PanGestureHandler
          onGestureEvent={handleFabDrag}
          onHandlerStateChange={(event) => {
            if (event.nativeEvent.state === State.END) {
              handleFabDragEnd(event);
            }
          }}
        >
          <Animated.View
            style={[
              styles.fab,
              { 
                backgroundColor: colors.success,
                transform: [
                  { translateX: fabTranslateX },
                  { 
                    scale: fabHintAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    })
                  }
                ]
              }
            ]}
          >
                          <TouchableOpacity
                style={styles.fabTouchable}
                onPress={handleFabPress}
                activeOpacity={0.8}
              >
                <GridIcon size={24} color="#FFFFFF" />
                {showFabHint && !hasDraggedFab && (
                  <View style={styles.fabDragHint}>
                    <Text style={styles.fabDragHintText}>↔</Text>
                  </View>
                )}
              </TouchableOpacity>
          </Animated.View>
        </PanGestureHandler>
      </View>

              {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <DeleteConfirmationModal
            visible={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            onConfirm={handleConfirmDelete}
            onConfirmRecurring={handleConfirmRecurringDelete}
            title={t('reminders.deleteConfirmation.title')}
            message={t('reminders.deleteConfirmation.message')}
            itemName={reminders.find(r => r.id === selectedReminderId)?.title}
            isRecurring={reminders.find(r => r.id === selectedReminderId)?.isRecurring}
            reminder={reminders.find(r => r.id === selectedReminderId) as any}
            type="reminder"
          />
        )}

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          visible={showPremiumUpgrade}
          onClose={() => setShowPremiumUpgrade(false)}
        />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    paddingTop: 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientLayer1: {
    position: 'absolute',
    top: -200,
    left: -50,
    right: -50,
    bottom: 0,
    borderRadius: 150,
    zIndex: -4,
  },
  gradientLayer2: {
    position: 'absolute',
    top: -150,
    left: -30,
    right: -30,
    bottom: 0,
    borderRadius: 100,
    zIndex: -3,
  },
  gradientLayer3: {
    position: 'absolute',
    top: -100,
    left: -20,
    right: -20,
    bottom: 0,
    borderRadius: 50,
    zIndex: -2,
  },
  gradientLayer4: {
    position: 'absolute',
    top: -50,
    left: -10,
    right: -10,
    bottom: 0,
    borderRadius: 25,
    zIndex: -1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroContent: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sparkleIcon: {
    marginRight: 8,
  },
  heroGreeting: {
    ...TextStyles.largeTitle,
  } as any,
  heroSubtitle: {
    ...TextStyles.callout,
  } as any,
  heroButton: {
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: {
    ...TextStyles.title1,
    marginBottom: 4,
  },
  subtitle: {
    ...TextStyles.body,
  } as any,
  headerButton: {
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayContainer: {
    marginBottom: 32,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TextStyles.title2,
    marginLeft: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  todayDate: {
    ...TextStyles.caption1,
  } as any,
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    ...TextStyles.body,
    marginTop: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    ...TextStyles.title1,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    ...TextStyles.callout,
    textAlign: 'center',
    marginBottom: 24,
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    ...TextStyles.callout,
    color: '#FFFFFF',
  } as any,
  remindersList: {
    gap: 16,
  },
  reminderCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  firstReminderCard: {
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderIcon: {
    fontSize: 18,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    ...TextStyles.callout,
  } as any,
  reminderDescription: {
    ...TextStyles.caption1,
    marginTop: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    ...TextStyles.caption2,
    marginLeft: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  recurringInfoContainer: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  recurringInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringInfoText: {
    ...TextStyles.caption1,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    ...TextStyles.title1,
    marginBottom: 4,
  },
  statLabel: {
    ...TextStyles.caption1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as any,
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fabContainerLeft: {
    left: 10,
  },
  fabContainerRight: {
    right: 10,
  },
  fabMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fabMenuItem: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  fabMenuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabDragHint: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  fabDragHintText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: MODAL_BG,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    ...TextStyles.title2,
  },
  modalClose: {
    ...TextStyles.title2,
    padding: 8,
  },
  swipeableContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  actionButtonsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  editButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  deleteButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.semibold,
    color: 'white',
    marginTop: 4,
  },
  reminderTouchable: {
    flex: 1,
  },
});

export default IndexScreen;

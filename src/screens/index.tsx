import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
  Dimensions,
  Alert,
  Animated,
  ActivityIndicator,
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
  ChevronRight,
  Plus,
  User,
  Crown,
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
  navigation: any;
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
  const { isAnonymous } = useAuth();
  const { reminders, isLoading, isInitialized, isDataFullyLoaded, error, loadReminders, deleteReminder, stats } = useReminderContext();
  const { family, familyMembers, currentMember, isOwner } = useFamily();
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
      Animated.loop(
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
        ])
      ).start();
    }
  }, [showFabHint, hasDraggedFab]);

  // Filter reminders for today
  const todayReminders = useMemo(() => {
    if (!reminders || reminders.length === 0) return [];
    
    const today = getTodayISO();
    return filterReminders.byToday(reminders);
  }, [reminders]);

  // Separate reminders by owner vs assigned
  const { myReminders, familyReminders } = useMemo(() => {
    if (!reminders || !currentMember) {
      return { myReminders: [], familyReminders: [] };
    }

    const my = reminders.filter(r => r.userId === currentMember.userId);
    const family = reminders.filter(r => r.userId !== currentMember.userId && r.familyId === currentMember.familyId);
    
    return { myReminders: my, familyReminders: family };
  }, [reminders, currentMember]);

  // Get today's reminders for each category
  const todayMyReminders = useMemo(() => {
    if (!myReminders || myReminders.length === 0) return [];
    return filterReminders.byToday(myReminders);
  }, [myReminders]);

  const todayFamilyReminders = useMemo(() => {
    if (!familyReminders || familyReminders.length === 0) return [];
    return filterReminders.byToday(familyReminders);
  }, [familyReminders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReminders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFabPress = () => {
    setShowFabMenu(!showFabMenu);
  };

  const handleFabDrag = Animated.event(
    [{ nativeEvent: { translationX: fabTranslateX } }],
    { useNativeDriver: true }
  );

  const handleFabDragEnd = (event: GestureHandlerStateChangeEvent) => {
    const { translationX } = event.nativeEvent as any;
    
    if (Math.abs(translationX) > 50) {
      setFabPosition(translationX > 0 ? 'left' : 'right');
    }
    
    Animated.spring(fabTranslateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
    
    setHasDraggedFab(true);
    setShowFabHint(false);
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
    if (!reminder) {return;}

    if (isRecurringReminder(reminder)) {
      setSelectedReminderId(reminderId);
      setShowDeleteConfirmation(true);
    } else {
      setSelectedReminderId(reminderId);
      setShowDeleteConfirmation(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedReminderId) {
      try {
        const reminder = reminders.find(r => r.id === selectedReminderId);
        if (reminder) {
          await deleteReminder(selectedReminderId);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('errors.unknown'));
      } finally {
        setSelectedReminderId('');
        setShowDeleteConfirmation(false);
      }
    }
  };

  const handleConfirmRecurringDelete = async (deleteAll: boolean) => {
    if (selectedReminderId) {
      try {
        const reminder = reminders.find(r => r.id === selectedReminderId);
        if (reminder) {
          await deleteReminder(selectedReminderId);
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('errors.unknown'));
      } finally {
        setSelectedReminderId('');
        setShowDeleteConfirmation(false);
      }
    }
  };

  const { showEditReminderModal } = useModal();

  const handleEditReminder = (reminderId: string) => {
    showEditReminderModal(reminderId);
  };

  // Modern Task Item Component (No Cards)
  const TaskItem = ({ reminder, isFamilyTask = false }: { reminder: Reminder; isFamilyTask?: boolean }) => {
    const member = familyMembers?.find(m => m.userId === reminder.userId);
    const isOverdue = reminder.dueDate ? new Date(reminder.dueDate) < new Date() : false;
    const isToday = reminder.dueDate ? formatDate(new Date(reminder.dueDate)) === formatDate(new Date()) : false;
    
    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          { 
            borderLeftColor: isFamilyTask ? colors.tertiary : colors.primary,
            backgroundColor: colors.surface,
          }
        ]}
        onPress={() => handleEditReminder(reminder.id)}
        activeOpacity={0.7}
      >
        <View style={styles.taskItemHeader}>
          <View style={styles.taskItemLeft}>
            <View style={[
              styles.taskTypeIndicator,
              { backgroundColor: isFamilyTask ? colors.tertiary : colors.primary }
            ]} />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={2}>
                {reminder.title}
              </Text>
              {reminder.description && (
                <Text style={[styles.taskDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                  {reminder.description}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.taskItemRight}>
            {isFamilyTask && member && (
              <View style={styles.familyMemberBadge}>
                <User size={12} color={colors.tertiary} />
                <Text style={[styles.familyMemberName, { color: colors.tertiary }]}>
                  {member.name}
                </Text>
              </View>
            )}
            
            <View style={styles.taskTimeContainer}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.taskTime, { color: colors.textSecondary }]}>
                {reminder.dueTime || ''}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.taskItemFooter}>
          <View style={styles.taskMeta}>
            {reminder.type && (
              <View style={[styles.categoryChip, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {reminder.type}
                </Text>
              </View>
            )}
            
            {reminder.priority && (
              <View style={[
                styles.priorityChip,
                { backgroundColor: `${PRIORITY_COLORS[reminder.priority]}15` }
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: PRIORITY_COLORS[reminder.priority] }
                ]}>
                  {reminder.priority}
                </Text>
              </View>
            )}
            
            {reminder.isRecurring && (
              <View style={[styles.recurringChip, { backgroundColor: `${colors.warning}15` }]}>
                <Repeat size={12} color={colors.warning} />
                <Text style={[styles.recurringText, { color: colors.warning }]}>
                  {getRecurringPatternDescription(reminder)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.taskActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => handleEditReminder(reminder.id)}
            >
              <Edit size={14} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${colors.error}15` }]}
              onPress={() => handleDeleteReminder(reminder.id)}
            >
              <Trash2 size={14} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty State Component
  const EmptyState = ({ title, description, showAddButton = false }: { 
    title: string; 
    description: string; 
    showAddButton?: boolean;
  }) => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
        <Bell size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {description}
      </Text>
      {showAddButton && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Add')}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <Sparkles size={20} color={colors.primary} />
              <Text style={[styles.greeting, { color: colors.text }]}>
                {isAnonymous ? t('home.welcomeAnonymous') : t('home.welcomeBack')}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isAnonymous ? t('home.anonymousBannerDescription') : t('home.subtitle')}
            </Text>
          </View>
          
          {family && (
            <TouchableOpacity
              style={[styles.familyButton, { backgroundColor: `${colors.tertiary}15` }]}
              onPress={() => navigation.navigate('Family')}
            >
              <Users size={16} color={colors.tertiary} />
              <Text style={[styles.familyButtonText, { color: colors.tertiary }]}>
                {family.name}
              </Text>
              {isOwner && <Crown size={12} color={colors.tertiary} />}
            </TouchableOpacity>
          )}
        </View>
      </View>

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


        {/* My Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Tasks Today
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionButton}
              onPress={() => navigation.navigate('Reminders')}
            >
              <Text style={[styles.sectionButtonText, { color: colors.primary }]}>View All</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {todayMyReminders.length === 0 ? (
            <EmptyState
              title="No tasks today"
              description="You're all caught up! Add a new task to get started."
              showAddButton={true}
            />
          ) : (
            <FlatList
              data={todayMyReminders}
              renderItem={({ item }) => <TaskItem reminder={item} />}
              keyExtractor={(item) => item.id}
              style={styles.tasksList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={5}
              updateCellsBatchingPeriod={16}
              scrollEnabled={false}
              getItemLayout={(data, index) => ({
                length: 80,
                offset: 80 * index,
                index,
              })}
            />
          )}
        </View>

        {/* Family Tasks Section - Only show for family owners */}
        {isOwner && family && todayFamilyReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Users size={20} color={colors.tertiary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Family Tasks Today
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sectionButton}
                onPress={() => navigation.navigate('Family')}
              >
                <Text style={[styles.sectionButtonText, { color: colors.tertiary }]}>View All</Text>
                <ChevronRight size={16} color={colors.tertiary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={todayFamilyReminders}
              renderItem={({ item }) => <TaskItem reminder={item} isFamilyTask={true} />}
              keyExtractor={(item) => item.id}
              style={styles.tasksList}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={5}
              updateCellsBatchingPeriod={16}
              scrollEnabled={false}
              getItemLayout={(data, index) => ({
                length: 80,
                offset: 80 * index,
                index,
              })}
            />
          </View>
        )}


      </ScrollView>

      {/* Floating Action Button */}
      <View style={[
        styles.fabContainer,
        fabPosition === 'left' ? styles.fabContainerLeft : styles.fabContainerRight,
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
                    }),
                  },
                ],
              },
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
};

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
  // New styles for modern home screen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  familyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  familyButtonText: {
    ...TextStyles.caption1,
    marginLeft: 8,
  },


  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionButtonText: {
    ...TextStyles.caption1,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent', // Default to transparent
  },
  taskItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTypeIndicator: {
    width: 8,
    height: 20,
    borderRadius: 4,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    ...TextStyles.callout,
    fontFamily: Fonts.text.semibold,
  },
  taskDescription: {
    ...TextStyles.caption1,
    marginTop: 4,
  },
  taskItemRight: {
    alignItems: 'flex-end',
  },
  familyMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  familyMemberName: {
    ...TextStyles.caption1,
    fontFamily: Fonts.text.medium,
    marginLeft: 4,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskTime: {
    ...TextStyles.caption1,
    fontFamily: Fonts.text.regular,
  },
  taskItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    ...TextStyles.caption1,
    fontFamily: Fonts.text.medium,
  },
  priorityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    ...TextStyles.caption1,
    fontFamily: Fonts.text.medium,
  },
  recurringChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recurringText: {
    ...TextStyles.caption1,
    fontFamily: Fonts.text.medium,
    marginLeft: 4,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    ...TextStyles.callout,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});

export default IndexScreen;

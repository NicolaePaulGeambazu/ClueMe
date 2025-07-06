import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useReminders } from '../hooks/useReminders';
import { useFamily } from '../contexts/FamilyContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import {
  Plus,
  Calendar,
  Clock,
  List,
  Users,
  Settings,
  Bell,
  Timer,
  Star,
  CheckCircle,
  AlertCircle,
  Repeat,
  Sparkles,
  TrendingUp
} from 'lucide-react-native';
import { GridIcon } from '../components/common/GridIcon';
import { filterReminders, sortReminders, getRecurringPatternDescription } from '../utils/reminderUtils';
import { formatDate, formatTimeOnly, getTodayISO } from '../utils/dateUtils';
import { format as formatDateFns } from 'date-fns';
import { NotificationDebug } from '../components/NotificationDebug';
import BannerAdComponent from '../components/ads/BannerAdComponent';

const { width: screenWidth } = Dimensions.get('window');

export default function IndexScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { reminders, isLoading, error, loadReminders } = useReminders();
  const { familyMembers } = useFamily();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showNotificationDebug, setShowNotificationDebug] = useState(false);



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  // Memoize derived data
  const todayReminders = useMemo(() => {
    if (!reminders) return [];
    const today = getTodayISO();
    return reminders.filter(reminder => {
      if (!reminder.dueDate) return false;
      
      // Convert reminder date to YYYY-MM-DD format for comparison
      const reminderDate = new Date(reminder.dueDate);
      const reminderDateString = formatDateFns(reminderDate, 'yyyy-MM-dd');
      
      return reminderDateString === today;
    });
  }, [reminders]);

  const stats = useMemo(() => {
    if (!reminders) return { total: 0, pending: 0, favorites: 0, overdue: 0 };
    return {
      total: reminders.length,
      pending: filterReminders.byCompleted(reminders, false).length,
      favorites: filterReminders.byFavorite(reminders).length,
      overdue: filterReminders.byOverdue(reminders).length,
    };
  }, [reminders]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋';
      case 'event': return '📅';
      case 'note': return '📝';
      case 'reminder': return '⏰';
      case 'bill': return '💳';
      case 'med': return '💊';
      default: return '📋';
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

  const handleFabPress = () => {
    setShowFabMenu(!showFabMenu);
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

  // Extracted empty state for clarity
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={theme === 'dark' 
          ? require('../assets/images/empty-box-dark.png') 
          : require('../assets/images/empty-box.png')}
        style={styles.emptyImage}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Enhanced Hero Header */}
      <View style={[styles.heroContainer, { backgroundColor: `${colors.primary}08` }]}>
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
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: colors.surface, marginLeft: 8 }]}
            onPress={() => setShowNotificationDebug(true)}
          >
            <Bell size={22} color={colors.text} />
          </TouchableOpacity>
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

        {/* Enhanced Stats Summary */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'total' })}
          >
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <List size={20} color={colors.primary} />
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
          ) : isLoading ? (
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
                <TouchableOpacity
                  key={reminder.id}
                  style={[
                    styles.reminderCard,
                    { backgroundColor: colors.surface },
                    index === 0 && styles.firstReminderCard
                  ]}
                  onPress={() => navigation.navigate('EditReminder', { reminderId: reminder.id })}
                >
                  <View style={styles.reminderHeader}>
                    <View style={[styles.reminderIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={styles.reminderIcon}>{getTypeIcon(reminder.type)}</Text>
                    </View>
                    <View style={styles.reminderContent}>
                      <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>
                        {reminder.title}
                      </Text>
                      {reminder.description && (
                        <Text style={[styles.reminderDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                          {reminder.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.reminderActions}>
                      {reminder.isFavorite && <Star size={16} color={colors.warning} fill={colors.warning} />}
                      {reminder.hasNotification && <Bell size={16} color={colors.primary} />}
                      {reminder.completed && <CheckCircle size={16} color={colors.success} />}
                    </View>
                  </View>
                  
                  <View style={styles.reminderMeta}>
                    {reminder.dueTime && (
                      <View style={[styles.metaItem, styles.metaChip, { backgroundColor: `${colors.primary}10` }]}>
                        <Timer size={12} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.primary }]}>
                          {formatTimeOnly(reminder.dueTime)}
                        </Text>
                      </View>
                    )}
                    
                    {reminder.priority && (
                      <View style={[styles.metaItem, styles.metaChip, { backgroundColor: `${getPriorityColor(reminder.priority)}15` }]}>
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(reminder.priority) }]} />
                        <Text style={[styles.metaText, { color: getPriorityColor(reminder.priority) }]}>{reminder.priority}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Recurring Information */}
                  {reminder.isRecurring && (
                    <View style={[styles.recurringInfoContainer, { backgroundColor: `${colors.primary}08` }]}>
                      <View style={styles.recurringInfoRow}>
                        <Repeat size={12} color={colors.primary} />
                        <Text style={[styles.recurringInfoText, { color: colors.primary }]}>
                          {getRecurringPatternDescription(reminder) || `Recurring (${reminder.repeatPattern || 'custom'})`}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Banner Ad - Bottom of Home Screen (temporarily disabled) */}
        {/* <BannerAdComponent style={{ marginTop: 20, marginBottom: 20 }} /> */}
      </ScrollView>

      {/* Notification Debug Modal */}
      {showNotificationDebug && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Notification Debug</Text>
              <TouchableOpacity onPress={() => setShowNotificationDebug(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <NotificationDebug />
          </View>
        </View>
      )}

      {/* Enhanced Floating Action Button */}
      <View style={styles.fabContainer}>
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
              onPress={() => handleQuickAction('lists')}
            >
              <View style={[styles.fabMenuIconContainer, { backgroundColor: `${colors.secondary}15` }]}>
                <List size={20} color={colors.secondary} />
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
            <TouchableOpacity
              style={[styles.fabMenuItem, { backgroundColor: colors.surface }]}
              onPress={() => handleQuickAction('add')}
            >
              <View style={[styles.fabMenuIconContainer, { backgroundColor: `${colors.success}15` }]}>
                <Plus size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.success }]}
          onPress={handleFabPress}
        >
          <GridIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    fontSize: FontSizes.largeTitle,
    fontFamily: Fonts.text.bold,
    fontWeight: '700',
  },
  heroSubtitle: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.medium,
    lineHeight: LineHeights.callout,
  },
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
    fontSize: FontSizes.title1,
    fontFamily: Fonts.text.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    fontWeight: '700',
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
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
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
    fontSize: FontSizes.title1,
    fontFamily: Fonts.text.bold,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
    lineHeight: LineHeights.callout,
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
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
    fontWeight: '600',
  },
  reminderDescription: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
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
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.semibold,
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
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    marginTop: -10,
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
    fontSize: FontSizes.title1,
    fontFamily: Fonts.text.bold,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
  },
  modalClose: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    padding: 8,
  },
});

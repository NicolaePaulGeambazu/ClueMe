import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useReminderContext } from '../contexts/ReminderContext';
import { usePremium } from '../hooks/usePremium';
import { Colors } from '../constants/Colors';
import {
  Calendar,
  Clock,
  Users,
  Bell,
  AlertCircle,
  Plus,
  CheckCircle,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import {
  FluidContainer,
  FluidCard,
  FluidList,
  FluidButton,
  FluidHeader,
} from '../components/design-system';
import { filterReminders } from '../utils/reminderUtils';
import { formatDate, formatTimeOnly, getTodayISO } from '../utils/dateUtils';
import { toastManager } from '../components/common/ToastContainer';

interface HomeFluidProps {
  navigation: any;
}

const HomeFluid: React.FC<HomeFluidProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { reminders, isLoading, loadReminders, deleteReminder, stats } = useReminderContext();
  const { isPremium } = usePremium();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReminders();
    } catch (error) {
      toastManager.show({
        title: 'Error',
        message: 'Failed to refresh reminders',
        type: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get today's reminders
  const todayReminders = useMemo(() => {
    const today = getTodayISO();
    return filterReminders.byDate(reminders, today).slice(0, 5);
  }, [reminders]);

  // Get overdue reminders
  const overdueReminders = useMemo(() => {
    return filterReminders.byOverdue(reminders).slice(0, 3);
  }, [reminders]);

  // Get upcoming reminders
  const upcomingReminders = useMemo(() => {
    return filterReminders.byUpcoming(reminders, 7).slice(0, 3);
  }, [reminders]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const getUserName = () => {
    if (isAnonymous) return t('home.guest');
    return user?.displayName || user?.email?.split('@')[0] || t('home.user');
  };

  const renderReminderItem = (reminder: any, index: number) => (
    <FluidCard
      key={reminder.id}
      onPress={() => navigation.navigate('EditReminder', { reminderId: reminder.id })}
      borderColor={reminder.priority === 'high' ? colors.error : 
                  reminder.priority === 'medium' ? colors.warning : colors.primary}
    >
      <View style={styles.reminderItem}>
        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={1}>
              {reminder.title}
            </Text>
            {reminder.priority === 'high' && (
              <AlertCircle size={16} color={colors.error} />
            )}
          </View>
          
          {reminder.description && (
            <Text style={[styles.reminderDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {reminder.description}
            </Text>
          )}
          
          <View style={styles.reminderMeta}>
            {reminder.dueTime && (
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {formatTimeOnly(reminder.dueTime)}
                </Text>
              </View>
            )}
            
            {reminder.assignedTo && reminder.assignedTo.length > 0 && (
              <View style={styles.metaItem}>
                <Users size={14} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {reminder.assignedTo.length}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => {
            // Toggle completion
            toastManager.show({
              title: 'Reminder Updated',
              message: `${reminder.title} marked as ${reminder.completed ? 'incomplete' : 'complete'}`,
              type: 'success',
            });
          }}
          style={styles.checkButton}
        >
          <CheckCircle 
            size={24} 
            color={reminder.completed ? colors.success : colors.textTertiary}
            fill={reminder.completed ? colors.success : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </FluidCard>
  );

  const renderStatsCard = (title: string, value: number, icon: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity onPress={onPress} style={styles.statCard}>
      <FluidContainer variant="elevated" padding="medium">
        <View style={styles.statContent}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
            {icon}
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
      </FluidContainer>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <FluidContainer padding="large" style={styles.heroSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {getUserName()}
          </Text>
          <Text style={[styles.todayDate, { color: colors.textTertiary }]}>
            {formatDate(new Date())}
          </Text>
        </FluidContainer>

        {/* Quick Stats */}
        <FluidContainer padding="medium">
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Today',
              todayReminders.length,
              <Calendar size={20} color={colors.primary} />,
              () => navigation.navigate('Reminders', { initialTab: 'today' })
            )}
            {renderStatsCard(
              'Overdue',
              overdueReminders.length,
              <AlertCircle size={20} color={colors.error} />,
              () => navigation.navigate('Reminders', { initialTab: 'overdue' })
            )}
            {renderStatsCard(
              'Upcoming',
              upcomingReminders.length,
              <TrendingUp size={20} color={colors.success} />,
              () => navigation.navigate('Reminders', { initialTab: 'upcoming' })
            )}
            {renderStatsCard(
              'Total',
              stats?.total || 0,
              <Bell size={20} color={colors.primary} />,
              () => navigation.navigate('Reminders')
            )}
          </View>
        </FluidContainer>

        {/* Overdue Reminders */}
        {overdueReminders.length > 0 && (
          <FluidContainer padding="medium">
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Overdue
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders', { initialTab: 'overdue' })}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <FluidList spacing="small">
              {overdueReminders.map(renderReminderItem)}
            </FluidList>
          </FluidContainer>
        )}

        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <FluidContainer padding="medium">
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders', { initialTab: 'today' })}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <FluidList spacing="small">
              {todayReminders.map(renderReminderItem)}
            </FluidList>
          </FluidContainer>
        )}

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <FluidContainer padding="medium">
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders', { initialTab: 'upcoming' })}>
                <Text style={[styles.sectionAction, { color: colors.primary }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>
            <FluidList spacing="small">
              {upcomingReminders.map(renderReminderItem)}
            </FluidList>
          </FluidContainer>
        )}

        {/* Empty State */}
        {todayReminders.length === 0 && overdueReminders.length === 0 && upcomingReminders.length === 0 && (
          <FluidContainer padding="large" style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
              <CheckCircle size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              You have no reminders for today. Great job staying organized!
            </Text>
            <FluidButton
              title="Add Reminder"
              onPress={() => navigation.navigate('Add')}
              style={styles.addButton}
            />
          </FluidContainer>
        )}

        {/* Quick Actions */}
        <FluidContainer padding="medium" style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Add')}
            >
              <Plus size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Add</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Calendar')}
            >
              <Calendar size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Lists')}
            >
              <Star size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Lists</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('Family')}
            >
              <Users size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Family</Text>
            </TouchableOpacity>
          </View>
        </FluidContainer>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '400',
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  todayDate: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  sectionAction: {
    fontSize: 16,
    fontWeight: '500',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addButton: {
    marginTop: 16,
  },
  quickActions: {
    marginTop: 24,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minWidth: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HomeFluid;

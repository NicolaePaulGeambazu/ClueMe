import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Clock, Star, Plus, Search, Bell, User, Calendar, Filter, Users, Settings, ChevronRight, CheckCircle, AlertCircle, Timer, List } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { getReminderStats } from '../../utils/reminderUtils';
import { getGreeting } from '../../utils/dateUtils';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  const { reminders, isLoading, loadReminders, useFirebase } = useReminders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const styles = createStyles(colors);

  const stats = getReminderStats(reminders);

  // Sort reminders by updatedAt descending
  const recentReminders = [...reminders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Helper for type icon/emoji
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

  // Helper for priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReminders();
    setIsRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    const quickActionHandler = () => {
      switch (action) {
        case 'add_reminder':
          navigation.navigate('Add');
          break;
        case 'view_calendar':
          navigation.navigate('Calendar');
          break;
        case 'search':
          navigation.navigate('Search');
          break;
        case 'filter':
          navigation.navigate('Categories');
          break;
        case 'family':
          navigation.navigate('Family');
          break;
        case 'categories':
          navigation.navigate('Categories');
          break;
        case 'countdown':
          navigation.navigate('Countdown');
          break;
        case 'lists':
          navigation.navigate('Lists');
          break;
        default:
          console.log('Quick action:', action);
      }
    };

    guardAction(quickActionHandler);
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(() => {
      console.log('Action completed after login');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {isAnonymous ? t('home.welcomeAnonymous') : `${t('home.welcomeBack')}${user?.displayName ? `, ${user.displayName}` : ''}`}
          </Text>
        </View>
      </View>

      {isAnonymous && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.bannerTitle}>{t('home.anonymousBannerTitle')}</Text>
          <Text style={styles.bannerDescription}>
            {t('home.anonymousBannerDescription')}
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => setShowLoginPrompt(true)}
          >
            <Text style={styles.signInButtonText}>{t('home.signIn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isAnonymous && (
        <View style={styles.storageBanner}>
          <Text style={styles.storageText}>
            {useFirebase 
              ? t('home.firebaseConnected')
              : t('home.localStorage')
            }
          </Text>
        </View>
      )}

      <View style={styles.mainContent}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
        >
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'total' })}
          >
            <TrendingUp size={24} color={colors.primary} strokeWidth={2} />
            <Text style={styles.statsValue}>{stats.total}</Text>
            <Text style={styles.statsLabel}>{t('home.stats.total')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'pending' })}
          >
            <Clock size={24} color={colors.warning} strokeWidth={2} />
            <Text style={styles.statsValue}>{stats.pending}</Text>
            <Text style={styles.statsLabel}>{t('home.stats.pending')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'favorites' })}
          >
            <Star size={24} color={colors.success} strokeWidth={2} />
            <Text style={styles.statsValue}>{stats.favorites}</Text>
            <Text style={styles.statsLabel}>{t('home.stats.favorites')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Reminders', { initialTab: 'overdue' })}
          >
            <AlertCircle size={24} color={colors.error} strokeWidth={2} />
            <Text style={styles.statsValue}>{stats.overdue}</Text>
            <Text style={styles.statsLabel}>{t('home.stats.overdue')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {showQuickActions ? (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionsHeader}
              onPress={() => setShowQuickActions(!showQuickActions)}
            >
              <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
              <ChevronRight 
                size={20} 
                color={colors.textSecondary} 
                strokeWidth={2}
                style={[
                  styles.chevron,
                  { transform: [{ rotate: showQuickActions ? '90deg' : '0deg' }] }
                ]}
              />
            </TouchableOpacity>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('view_calendar')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                  <Calendar size={24} color={colors.secondary} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionLabel}>{t('home.calendar')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('family')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.tertiary + '15' }]}>
                  <Users size={24} color={colors.tertiary} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionLabel}>{t('home.family')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('countdown')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Timer size={24} color={colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionLabel}>{t('home.countdown')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => handleQuickAction('lists')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '15' }]}>
                  <List size={24} color={colors.secondary} strokeWidth={2.5} />
                </View>
                <Text style={styles.actionLabel}>{t('home.lists')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.collapsedQuickActionsHeader}
              onPress={() => setShowQuickActions(!showQuickActions)}
            >
              <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
              <ChevronRight 
                size={20} 
                color={colors.textSecondary} 
                strokeWidth={2}
                style={[
                  styles.chevron,
                  { transform: [{ rotate: showQuickActions ? '90deg' : '0deg' }] }
                ]}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        style={[styles.content, { flex: showQuickActions ? 1 : undefined }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
          {recentReminders.length === 0 ? (
            <Text style={styles.emptyActivity}>{t('home.noRecentActivity')}</Text>
          ) : (
            recentReminders.slice(0, 10).map((reminder) => (
              <View key={reminder.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTypeIcon}>{getTypeIcon(reminder.type)}</Text>
                  <Text style={styles.activityTitle}>{reminder.title}</Text>
                  {reminder.isFavorite && <Star size={16} color={colors.warning} fill={colors.warning} style={{ marginLeft: 4 }} />}
                  {reminder.completed && <CheckCircle size={16} color={colors.success} style={{ marginLeft: 4 }} />}
                </View>
                {reminder.description ? (
                  <Text style={styles.activityDescription}>{reminder.description}</Text>
                ) : null}
                <View style={styles.activityMetaRow}>
                  {reminder.dueDate && (
                    <View style={styles.activityMetaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={styles.activityMetaText}>{reminder.dueDate}{reminder.dueTime ? ` ${reminder.dueTime}` : ''}</Text>
                    </View>
                  )}
                  {reminder.priority && (
                    <View style={[styles.activityMetaItem, { backgroundColor: getPriorityColor(reminder.priority) + '15', borderRadius: 6, paddingHorizontal: 6 }] }>
                      <Text style={[styles.activityMetaText, { color: getPriorityColor(reminder.priority) }]}>{reminder.priority}</Text>
                    </View>
                  )}
                  {reminder.assignedTo && (
                    <View style={styles.activityMetaItem}>
                      <User size={14} color={colors.textSecondary} />
                      <Text style={styles.activityMetaText}>{reminder.assignedTo}</Text>
                    </View>
                  )}
                  {reminder.tags && reminder.tags.length > 0 && (
                    <View style={styles.activityMetaItem}>
                      <Text style={styles.activityMetaText}>{reminder.tags.map((t: string) => `#${t}`).join(' ')}</Text>
                    </View>
                  )}
                  <View style={styles.activityMetaItem}>
                    <Text style={styles.activityMetaText}>{reminder.updatedAt}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title={t('home.welcomeAnonymous')}
        message={t('home.anonymousBannerDescription')}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title2,
    color: colors.text,
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.text,
  },
  welcomeBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  bannerTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  bannerDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  signInButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  storageBanner: {
    backgroundColor: colors.secondary + '15',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  storageText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 4,
    gap: 12,
  },
  statCard: {
    width: 120,
    height: 100,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title1,
    color: colors.text,
  },
  statsLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  quickActions: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border + '20',
  },
  actionLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: 13,
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recentActivitySection: {
    marginTop: 8,
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  activityTitle: {
    flex: 1,
    fontFamily: Fonts.text.semibold,
    fontSize: 15,
    color: colors.text,
  },
  activityDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  activityMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 2,
  },
  activityMetaText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  emptyActivity: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
  featuresSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  chevron: {
    width: 20,
    height: 20,
  },
  quickActionText: {
    fontFamily: Fonts.button,
    fontSize: FontSizes.footnote,
    color: colors.primary,
    marginTop: 8,
  },
  reminderTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 4,
  },
  reminderTime: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
  },
  reminderDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: LineHeights.subheadline,
  },
  categoryName: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  categoryCount: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  mainContent: {
    // Container for stats and quick actions
  },
  collapsedQuickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 12,
    marginBottom: 16,
  },
});
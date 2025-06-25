import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Clock, Star, Plus, Search, Bell, User, Calendar, Filter, Users, Settings, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { getReminderStats } from '../../utils/reminderUtils';
import { getGreeting } from '../../utils/dateUtils';

export default function HomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  const { reminders, isLoading, loadReminders, useFirebase } = useReminders();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const styles = createStyles(colors);

  const stats = getReminderStats(reminders);

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
          <Text style={styles.title}>
            {isAnonymous ? 'Welcome to ClearCue' : `Welcome back${user?.displayName ? `, ${user.displayName}` : ''}`}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Search')}
          >
            <Search size={24} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => isAnonymous ? setShowLoginPrompt(true) : navigation.navigate('Profile')}
          >
            {isAnonymous ? (
              <User size={24} color={colors.primary} strokeWidth={2} />
            ) : (
              <Bell size={24} color={colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isAnonymous && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.bannerTitle}>You're using ClearCue anonymously</Text>
          <Text style={styles.bannerDescription}>
            Sign in to save your reminders permanently and sync across devices
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => setShowLoginPrompt(true)}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isAnonymous && (
        <View style={styles.storageBanner}>
          <Text style={styles.storageText}>
            {useFirebase 
              ? '📱 Connected to Firebase (cloud sync enabled)'
              : '💾 Using local storage (Firebase unavailable)'
            }
          </Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color={colors.primary} strokeWidth={2} />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statCard}>
          <Clock size={24} color={colors.warning} strokeWidth={2} />
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statCard}>
          <Star size={24} color={colors.success} strokeWidth={2} />
          <Text style={styles.statNumber}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
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
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('add_reminder')}
            >
              <Plus size={24} color={colors.primary} strokeWidth={2} />
              <Text style={styles.actionLabel}>Add Reminder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('view_calendar')}
            >
              <Calendar size={24} color={colors.secondary} strokeWidth={2} />
              <Text style={styles.actionLabel}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('search')}
            >
              <Search size={24} color={colors.success} strokeWidth={2} />
              <Text style={styles.actionLabel}>Search</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => handleQuickAction('filter')}
            >
              <Filter size={24} color={colors.warning} strokeWidth={2} />
              <Text style={styles.actionLabel}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {reminders.length > 0 ? (
            <View style={styles.recentList}>
              {reminders.slice(0, 3).map((reminder) => (
                <View key={reminder.id} style={styles.recentItem}>
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentItemTitle}>{reminder.title}</Text>
                    <Text style={styles.recentItemType}>{reminder.type.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.priorityDot, { backgroundColor: 
                    reminder.priority === 'high' ? colors.error : 
                    reminder.priority === 'medium' ? colors.warning : colors.success 
                  }]} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptyDescription}>
                {isAnonymous 
                  ? 'Start by creating your first reminder or sign in to see your saved reminders'
                  : 'Your recent reminders and activities will appear here'
                }
              </Text>
              {!isAnonymous && (
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => navigation.navigate('Add')}
                >
                  <Text style={styles.addFirstButtonText}>Create Your First Reminder</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Bell size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Notifications</Text>
                <Text style={styles.featureDescription}>Never miss important reminders</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Calendar size={20} color={colors.success} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Calendar Integration</Text>
                <Text style={styles.featureDescription}>View all your reminders in one place</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Star size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Priority Management</Text>
                <Text style={styles.featureDescription}>Focus on what matters most</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title="Welcome to ClearCue"
        message="Sign in to save your reminders permanently and sync across devices."
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
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  bannerDescription: {
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  recentSection: {
    marginBottom: 32,
  },
  recentList: {
    gap: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  recentItemType: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFirstButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
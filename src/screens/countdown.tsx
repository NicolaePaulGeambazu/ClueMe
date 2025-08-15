import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Calendar,
  ArrowLeft,
  AlertCircle,
  Timer,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Bell,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { LoginPrompt } from '../components/auth/LoginPrompt';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import firebaseService from '../services/firebaseService';
import { formatDate, formatTime } from '../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

interface Countdown {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  targetTime?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  color?: string;
  emoji?: string;
  category?: string;
  isImportant?: boolean;
  notificationEnabled?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  percentage: number;
}

// Predefined color themes for countdowns
const COUNTDOWN_THEMES = [
  { primary: '#FF6B6B', secondary: '#FFE0E0' },
  { primary: '#4ECDC4', secondary: '#E0F9F7' },
  { primary: '#45B7D1', secondary: '#E0F4F9' },
  { primary: '#F7B731', secondary: '#FFF4E0' },
  { primary: '#5F27CD', secondary: '#EDE7F6' },
  { primary: '#00D2D3', secondary: '#E0F9F9' },
];

export default function CountdownScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous, requireAuth } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();

  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const [collapsedCards, setCollapsedCards] = useState<{ [key: string]: boolean }>({});
  const cardAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  const styles = createStyles(colors);

  // Check if accessed from navigation (has navigation prop)
  const isFromNavigation = !!navigation;

  useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  // Load countdowns from Firebase
  const loadCountdowns = useCallback(async () => {
    try {
      setIsLoading(true);
      if (isAnonymous) {
        setCountdowns([]);
        return;
      }

      if (!user?.uid) {
        setCountdowns([]);
        return;
      }

      const userCountdowns = await firebaseService.getCountdowns(user.uid);
      setCountdowns(userCountdowns);
    } catch (error: any) {

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to load countdowns';
      let errorTitle = 'Countdown Loading Error';

      if (error.code === 'permission-denied') {
        errorMessage = 'You don\'t have permission to access countdowns. Please try signing out and back in.';
        errorTitle = 'Permission Denied';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'You need to be signed in to access countdowns. Please sign in again.';
        errorTitle = 'Authentication Required';
      } else if (error.message && error.message.includes('Firebase permission denied')) {
        errorMessage = 'Unable to access countdowns due to permission issues. Please try refreshing or signing out and back in.';
        errorTitle = 'Access Denied';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error while loading countdowns. Please check your connection and try again.';
        errorTitle = 'Network Error';
      } else {
        errorMessage = `Failed to load countdowns: ${error.message || 'Unknown error'}. Please try refreshing.`;
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            setTimeout(() => loadCountdowns(), 1000); // Retry after 1 second
          },
        },
      ]);

      // Set empty array to show empty state
      setCountdowns([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, isAnonymous, t]);

  // Set up real-time listener for countdowns (only for authenticated users)
  useEffect(() => {
    if (isAnonymous || !user?.uid) {
      setCountdowns([]);
      return;
    }

    const unsubscribe = firebaseService.onUserCountdownsChange(user.uid, (updatedCountdowns) => {
      setCountdowns(updatedCountdowns);
      setIsLoading(false);
    });

    // Cleanup listener on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user?.uid, isAnonymous]);

  // Initial load for non-anonymous users
  useEffect(() => {
    if (!isAnonymous && user?.uid) {
      loadCountdowns();
    } else if (isAnonymous) {
      // For anonymous users, just set loading to false
      setIsLoading(false);
    }
  }, [loadCountdowns, user?.uid, isAnonymous]);

  // Timer effect for active countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => [...prev]); // Trigger re-render to update timers
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ensure navigation state is properly managed when modal is closed
  useEffect(() => {
    if (!showLoginPrompt) {
      // Reset all modal-related states when modal is closed
      setIsLoading(true);
    }
  }, [showLoginPrompt]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCountdowns();
    setIsRefreshing(false);
  };

  const calculateTimeRemaining = (targetDate: string, targetTime?: string) => {
    const now = new Date();
    const target = new Date(targetDate);

    if (targetTime) {
      const [hours, minutes] = targetTime.split(':');
      target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      target.setHours(23, 59, 59, 999);
    }

    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0, percentage: 100 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Calculate percentage for progress bar (assuming 30 days as max for percentage calculation)
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const percentage = Math.min(100, Math.max(0, ((maxDuration - difference) / maxDuration) * 100));

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      totalSeconds: Math.floor(difference / 1000),
      percentage,
    };
  };

  const formatTimeUnit = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const handleAddCountdown = () => {
    const addAction = () => {
      navigation.navigate('AddCountdown');
    };

    guardAction(addAction);
  };

  const handleEditCountdown = (countdown: Countdown) => {
    const editAction = () => {
      // Convert Date objects to strings for navigation serialization
      const serializedCountdown = {
        ...countdown,
        createdAt: countdown.createdAt instanceof Date ? countdown.createdAt.toISOString() : countdown.createdAt,
        updatedAt: countdown.updatedAt instanceof Date ? countdown.updatedAt.toISOString() : countdown.updatedAt,
      };
      navigation.navigate('AddCountdown', { countdown: serializedCountdown });
    };

    guardAction(editAction);
  };

  const handleDeleteCountdown = (countdown: Countdown) => {
    const deleteAction = async () => {
      try {
        await firebaseService.deleteCountdown(countdown.id);
        setCountdowns(prev => prev.filter(c => c.id !== countdown.id));
      } catch (error) {
        Alert.alert(t('common.error'), 'Failed to delete countdown');
      }
    };

    Alert.alert(
      t('countdown.delete'),
      t('countdown.deleteConfirm', { title: countdown.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('countdown.delete'),
          style: 'destructive',
          onPress: deleteAction,
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good Morning';}
    if (hour < 17) {return 'Good Afternoon';}
    return 'Good Evening';
  };

  const formatDateLocal = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return formatDate(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeLocal = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return formatTime(date);
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(() => {
      loadCountdowns();
    });
  };

  const handleShareCountdown = (countdown: Countdown) => {
    const timeRemaining = calculateTimeRemaining(countdown.targetDate, countdown.targetTime);
    const shareText = `${countdown.title} - ${timeRemaining.isExpired ? 'Time\'s up!' : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m remaining`}`;

    // For now, just show an alert. In a real app, you'd use Share API
    Alert.alert(
      'Share Countdown',
      `Share "${countdown.title}"?\n\n${shareText}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          // Here you would implement actual sharing
          Alert.alert('Shared!', 'Countdown shared successfully');
        }},
      ]
    );
  };

  const handleNotifyCountdown = (countdown: Countdown) => {
    const timeRemaining = calculateTimeRemaining(countdown.targetDate, countdown.targetTime);

    if (timeRemaining.isExpired) {
      Alert.alert('Countdown Expired', 'This countdown has already expired!');
      return;
    }

    Alert.alert(
      'Set Notification',
      `Set a notification for "${countdown.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Notify', onPress: () => {
          // Here you would implement actual notification scheduling
          Alert.alert('Notification Set!', 'You\'ll be notified when the countdown is about to expire');
        }},
      ]
    );
  };

  // Initialize animation for a countdown card
  const getCardAnimation = (countdownId: string) => {
    if (!cardAnimations[countdownId]) {
      cardAnimations[countdownId] = new Animated.Value(1);
    }
    return cardAnimations[countdownId];
  };

  const handleCollapse = (countdownId: string) => {
    const animation = getCardAnimation(countdownId);
    const isCurrentlyCollapsed = collapsedCards[countdownId] || false;

    // Animate the transition
    Animated.timing(animation, {
      toValue: isCurrentlyCollapsed ? 1 : 0.95,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setCollapsedCards(prev => ({ ...prev, [countdownId]: !prev[countdownId] }));
  };

  const handleCollapseAll = () => {
    const allCollapsed = countdowns.reduce((acc, countdown) => {
      acc[countdown.id] = true;
      return acc;
    }, {} as { [key: string]: boolean });

    setCollapsedCards(allCollapsed);
  };

  const handleExpandAll = () => {
    setCollapsedCards({});
  };

  const isAllCollapsed = countdowns.length > 0 && countdowns.every(countdown => collapsedCards[countdown.id]);
  const isAllExpanded = countdowns.length > 0 && countdowns.every(countdown => !collapsedCards[countdown.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { position: 'relative' }]}>
      {/* Show navigation header when accessed from quick actions */}
      {isFromNavigation && (
        <Animated.View
          style={[
            styles.navigationHeader,
            {
              opacity: fadeAnim,
              transform: [{ scale: headerScale }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.navigationTitle}>{t('countdown.title')}</Text>
          <View style={styles.navigationSpacer} />
        </Animated.View>
      )}

      {/* Show regular header when not from navigation */}
      {!isFromNavigation && (
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: headerScale }],
            },
          ]}
        >
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>{t('countdown.title')}</Text>
          </View>
          <View style={styles.headerStats}>
            {countdowns.length > 0 && (
              <View style={styles.collapseControls}>
                {!isAllCollapsed && (
                  <TouchableOpacity
                    style={styles.collapseAllButton}
                    onPress={handleCollapseAll}
                  >
                    <ChevronUp size={16} color={colors.primary} />
                    <Text style={styles.collapseAllText}>Collapse</Text>
                  </TouchableOpacity>
                )}
                {!isAllExpanded && (
                  <TouchableOpacity
                    style={styles.collapseAllButton}
                    onPress={handleExpandAll}
                  >
                    <ChevronDown size={16} color={colors.primary} />
                    <Text style={styles.collapseAllText}>Expand</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.statItem}>
              <Timer size={20} color={colors.primary} />
              <Text style={styles.statValue}>{countdowns.length}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {isAnonymous && (
        <Animated.View
          style={[
            styles.anonymousNotice,
            { opacity: fadeAnim },
          ]}
        >
          <Sparkles size={20} color={colors.primary} />
          <Text style={styles.noticeText}>
            {t('countdown.anonymousNotice')}
          </Text>
        </Animated.View>
      )}

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
        {countdowns.length === 0 ? (
          <Animated.View
            style={[
              styles.emptyState,
              { opacity: fadeAnim },
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <Clock size={64} color={colors.primary} strokeWidth={1.5} />
              <View style={styles.emptyBadge}>
                <Zap size={20} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>{t('countdown.noCountdowns')}</Text>
            <Text style={styles.emptyDescription}>
              {t('countdown.noCountdownsDescription')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddCountdown}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>{t('countdown.createCountdown')}</Text>
            </TouchableOpacity>

            {/* Feature highlights */}
            <View style={styles.featureHighlights}>
              <View style={styles.featureItem}>
                <Target size={20} color={colors.primary} />
                <Text style={styles.featureText}>Track important dates</Text>
              </View>
              <View style={styles.featureItem}>
                <Bell size={20} color={colors.primary} />
                <Text style={styles.featureText}>Get notified on time</Text>
              </View>
              <View style={styles.featureItem}>
                <TrendingUp size={20} color={colors.primary} />
                <Text style={styles.featureText}>Visualize your progress</Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.countdownList}>
            {countdowns.map((countdown, index) => {
              const timeRemaining = calculateTimeRemaining(countdown.targetDate, countdown.targetTime);
              const isExpired = timeRemaining.isExpired;
              const theme = COUNTDOWN_THEMES[index % COUNTDOWN_THEMES.length];
              const isCollapsed = collapsedCards[countdown.id] || false;
              const animation = getCardAnimation(countdown.id);

              return (
                <Animated.View
                  key={countdown.id}
                  style={[
                    styles.countdownCard,
                    {
                      opacity: animation.interpolate({
                        inputRange: [0.95, 1],
                        outputRange: [0.95, 1],
                      }),
                    },
                  ]}
                >
                  <View style={[styles.cardContent, { backgroundColor: theme.primary }]}>
                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${timeRemaining.percentage}%`,
                              backgroundColor: 'rgba(255,255,255,0.8)',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Header */}
                    <View style={styles.countdownHeader}>
                      <View style={styles.countdownInfo}>
                        <View style={styles.titleRow}>
                          {countdown.emoji && <Text style={styles.emoji}>{countdown.emoji}</Text>}
                          <Text style={styles.countdownTitle} numberOfLines={1}>
                            {countdown.title}
                          </Text>
                          {isCollapsed && (
                            <View style={styles.collapsedIndicator}>
                              <Text style={styles.collapsedText}>
                                {isExpired ? 'Expired' : `${timeRemaining.days}d ${timeRemaining.hours}h`}
                              </Text>
                            </View>
                          )}
                        </View>
                        {countdown.description && (
                          <Text style={styles.countdownDescription} numberOfLines={2}>
                            {countdown.description}
                          </Text>
                        )}
                        <View style={styles.countdownMeta}>
                          <Calendar size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.countdownMetaText}>
                            {formatDateLocal(countdown.targetDate)}
                            {countdown.targetTime && ` at ${formatTimeLocal(countdown.targetTime)}`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.countdownActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditCountdown(countdown)}
                        >
                          <Edit size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteCountdown(countdown)}
                        >
                          <Trash2 size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Timer Display */}
                    {!isCollapsed && (
                      <View style={styles.timerContainer}>
                        {isExpired ? (
                          <View style={styles.expiredContainer}>
                            <AlertCircle size={32} color="#FFFFFF" strokeWidth={2} />
                            <Text style={styles.expiredText}>Time's Up!</Text>
                          </View>
                        ) : (
                          <View style={styles.timerGrid}>
                            <View style={styles.timerUnit}>
                              <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.days)}</Text>
                              <Text style={styles.timerLabel}>DAYS</Text>
                            </View>
                            <Text style={styles.timerSeparator}>:</Text>
                            <View style={styles.timerUnit}>
                              <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.hours)}</Text>
                              <Text style={styles.timerLabel}>HOURS</Text>
                            </View>
                            <Text style={styles.timerSeparator}>:</Text>
                            <View style={styles.timerUnit}>
                              <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.minutes)}</Text>
                              <Text style={styles.timerLabel}>MINS</Text>
                            </View>
                            <Text style={styles.timerSeparator}>:</Text>
                            <View style={styles.timerUnit}>
                              <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.seconds)}</Text>
                              <Text style={styles.timerLabel}>SECS</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Quick Actions */}
                    {!isCollapsed && !isExpired && (
                      <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.quickActionButton} onPress={() => handleNotifyCountdown(countdown)}>
                          <Bell size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.quickActionText}>Notify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quickActionButton} onPress={() => handleShareCountdown(countdown)}>
                          <Share2 size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.quickActionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Collapse Button - moved to bottom center */}
                    <View style={styles.collapseContainer}>
                      <TouchableOpacity
                        style={styles.collapseButton}
                        onPress={() => handleCollapse(countdown.id)}
                        activeOpacity={0.7}
                      >
                        {isCollapsed ? (
                          <ChevronDown size={16} color="rgba(255,255,255,0.9)" />
                        ) : (
                          <ChevronUp size={16} color="rgba(255,255,255,0.9)" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) for Add */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCountdown}
        activeOpacity={0.85}
        testID="countdown-fab"
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={handleLoginSuccess}
        title={t('countdown.signinTitle')}
        message={t('countdown.signinMessage')}
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
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title1,
    color: colors.text,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statValue: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  emptyBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  featureHighlights: {
    marginTop: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
  },
  countdownList: {
    gap: 16,
    paddingVertical: 16,
  },
  countdownCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  countdownInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  countdownTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: '#FFFFFF',
    flex: 1,
  },
  countdownDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    lineHeight: 20,
  },
  countdownMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  countdownMetaText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  countdownActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  expiredText: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: '#FFFFFF',
  },
  timerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  timerUnit: {
    alignItems: 'center',
    minWidth: 50,
  },
  timerValue: {
    fontFamily: Fonts.display.bold,
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
  },
  timerLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 1,
  },
  timerSeparator: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickActionText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navigationTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title2,
    color: colors.text,
    flex: 1,
  },
  navigationSpacer: {
    width: 40,
  },
  anonymousNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.primary,
    textAlign: 'center',
  },
  collapseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  collapseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  collapsedText: {
    fontFamily: Fonts.text.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  collapseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapseAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  collapseAllText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.primary,
  },
});

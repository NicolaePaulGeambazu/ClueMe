import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit, Trash2, Clock, Calendar, X, Check, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import firebaseService from '../../services/firebaseService';
import { formatDate, formatTime } from '../../utils/dateUtils';

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
}

export default function CountdownScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();

  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    targetTime: '',
  });

  const styles = createStyles(colors);

  // Check if accessed from navigation (has navigation prop)
  const isFromNavigation = !!navigation;

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
        console.log('⏰ User is anonymous, skipping countdown load');
        setCountdowns([]);
        return;
      }

      if (!user?.uid) {
        console.log('⏰ No user UID available, skipping countdown load');
        setCountdowns([]);
        return;
      }

      console.log('⏰ Loading countdowns for user:', user.uid);
      const userCountdowns = await firebaseService.getCountdowns(user.uid);
      console.log('⏰ Successfully loaded countdowns:', userCountdowns.length);
      setCountdowns(userCountdowns);
    } catch (error: any) {
      console.error('❌ Error loading countdowns:', error);

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
            console.log('⏰ Retrying countdown load...');
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

  // Set up real-time listener for countdowns
  useEffect(() => {
    if (isAnonymous || !user?.uid) {
      setCountdowns([]);
      return;
    }

    console.log('⏰ Setting up countdowns listener for user:', user.uid);
    const unsubscribe = firebaseService.onUserCountdownsChange(user.uid, (updatedCountdowns) => {
      console.log('⏰ Countdowns updated via real-time listener:', updatedCountdowns.length);
      setCountdowns(updatedCountdowns);
      setIsLoading(false);
    });

    // Cleanup listener on unmount or user change
    return () => {
      console.log('⏰ Cleaning up countdowns listener');
      unsubscribe();
    };
  }, [user?.uid, isAnonymous]);

  // Initial load for non-anonymous users
  useEffect(() => {
    if (!isAnonymous && user?.uid) {
      loadCountdowns();
    }
  }, [loadCountdowns, user?.uid, isAnonymous]);

  // Timer effect for active countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => [...prev]); // Trigger re-render to update timers
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
  };

  const formatTimeUnit = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const handleAddCountdown = () => {
    const addAction = () => {
      setFormData({
        title: '',
        description: '',
        targetDate: '',
        targetTime: '',
      });
      setShowAddModal(true);
    };

    guardAction(addAction);
  };

  const handleEditCountdown = (countdown: Countdown) => {
    const editAction = () => {
      setFormData({
        title: countdown.title,
        description: countdown.description || '',
        targetDate: countdown.targetDate,
        targetTime: countdown.targetTime || '',
      });
      setEditingCountdown(countdown);
      setShowAddModal(true);
    };

    guardAction(editAction);
  };

  const handleDeleteCountdown = (countdown: Countdown) => {
    const deleteAction = async () => {
      try {
        await firebaseService.deleteCountdown(countdown.id);
        setCountdowns(prev => prev.filter(c => c.id !== countdown.id));
      } catch (error) {
        console.error('Error deleting countdown:', error);
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

  const handleSaveCountdown = async () => {
    if (!formData.title.trim() || !formData.targetDate) {
      Alert.alert(t('common.error'), t('countdown.validation.titleRequired'));
      return;
    }

    try {
      if (editingCountdown) {
        // Update existing countdown
        const updatedCountdown = {
          ...editingCountdown,
          ...formData,
          updatedAt: new Date(),
        };
        await firebaseService.updateCountdown(updatedCountdown);
        console.log('✅ Countdown updated successfully:', updatedCountdown.id);
        setEditingCountdown(null);
      } else {
        // Add new countdown
        const newCountdown: Countdown = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user?.uid || '',
          color: colors.primary,
        };
        await firebaseService.createCountdown(newCountdown);
        console.log('✅ Countdown created successfully:', newCountdown.id);
      }

      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        targetDate: '',
        targetTime: '',
      });
    } catch (error: any) {
      console.error('❌ Error saving countdown:', error);

      let errorMessage = 'Failed to save countdown';
      let errorTitle = 'Save Error';

      if (error.code === 'permission-denied') {
        errorMessage = 'You don\'t have permission to save countdowns. Please try signing out and back in.';
        errorTitle = 'Permission Denied';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'You need to be signed in to save countdowns. Please sign in again.';
        errorTitle = 'Authentication Required';
      } else if (error.message && error.message.includes('Firebase permission denied')) {
        errorMessage = 'Unable to save countdown due to permission issues. Please try refreshing or signing out and back in.';
        errorTitle = 'Access Denied';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error while saving countdown. Please check your connection and try again.';
        errorTitle = 'Network Error';
      } else {
        errorMessage = `Failed to save countdown: ${error.message || 'Unknown error'}. Please try again.`;
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            console.log('⏰ Retrying countdown save...');
            setTimeout(() => handleSaveCountdown(), 1000); // Retry after 1 second
          },
        },
      ]);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good Morning';}
    if (hour < 17) {return 'Good Afternoon';}
    return 'Good Evening';
  };

  const formatDateLocal = (dateString: string) => {
    const date = new Date(dateString);
    return formatDate(date);
  };

  const formatTimeLocal = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return formatTime(date);
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(() => {
      loadCountdowns();
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Show navigation header when accessed from quick actions */}
      {isFromNavigation && (
        <View style={styles.navigationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.navigationTitle}>{t('countdown.title')}</Text>
          <View style={styles.navigationSpacer} />
        </View>
      )}

      {/* Show regular header when not from navigation */}
      {!isFromNavigation && (
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>{t('countdown.title')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCountdown}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {/* Show add button for navigation mode */}
      {isFromNavigation && (
        <View style={styles.navigationAddButton}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCountdown}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      {isAnonymous && (
        <View style={styles.anonymousNotice}>
          <Text style={styles.noticeText}>
            {t('countdown.anonymousNotice')}
          </Text>
        </View>
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
          <View style={styles.emptyState}>
            <Clock size={64} color={colors.textTertiary} strokeWidth={1} />
            <Text style={styles.emptyTitle}>{t('countdown.noCountdowns')}</Text>
            <Text style={styles.emptyDescription}>
              {t('countdown.noCountdownsDescription')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddCountdown}
            >
              <Text style={styles.emptyButtonText}>{t('countdown.createCountdown')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.countdownList}>
            {countdowns.map((countdown) => {
              const timeRemaining = calculateTimeRemaining(countdown.targetDate, countdown.targetTime);
              const isExpired = timeRemaining.isExpired;

              return (
                <View key={countdown.id} style={styles.countdownCard}>
                  <View style={styles.countdownHeader}>
                    <View style={styles.countdownInfo}>
                      <Text style={styles.countdownTitle}>{countdown.title}</Text>
                      {countdown.description && (
                        <Text style={styles.countdownDescription}>{countdown.description}</Text>
                      )}
                      <View style={styles.countdownMeta}>
                        <Calendar size={14} color={colors.textSecondary} />
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
                        <Edit size={16} color={colors.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteCountdown(countdown)}
                      >
                        <Trash2 size={16} color={colors.error} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.timerContainer}>
                    {isExpired ? (
                      <View style={styles.expiredContainer}>
                        <AlertCircle size={24} color={colors.error} strokeWidth={2} />
                        <Text style={styles.expiredText}>{t('countdown.timesUp')}</Text>
                      </View>
                    ) : (
                      <View style={styles.timerGrid}>
                        <View style={styles.timerUnit}>
                          <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.days)}</Text>
                          <Text style={styles.timerLabel}>{t('countdown.days')}</Text>
                        </View>
                        <View style={styles.timerSeparator}>
                          <Text style={styles.timerSeparatorText}>:</Text>
                        </View>
                        <View style={styles.timerUnit}>
                          <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.hours)}</Text>
                          <Text style={styles.timerLabel}>{t('countdown.hours')}</Text>
                        </View>
                        <View style={styles.timerSeparator}>
                          <Text style={styles.timerSeparatorText}>:</Text>
                        </View>
                        <View style={styles.timerUnit}>
                          <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.minutes)}</Text>
                          <Text style={styles.timerLabel}>{t('countdown.minutes')}</Text>
                        </View>
                        <View style={styles.timerSeparator}>
                          <Text style={styles.timerSeparatorText}>:</Text>
                        </View>
                        <View style={styles.timerUnit}>
                          <Text style={styles.timerValue}>{formatTimeUnit(timeRemaining.seconds)}</Text>
                          <Text style={styles.timerLabel}>{t('countdown.seconds')}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCountdown ? t('countdown.editCountdown') : t('countdown.newCountdown')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('countdown.titleLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder={t('countdown.titlePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('countdown.descriptionLabel')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder={t('countdown.descriptionPlaceholder')}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('countdown.targetDateLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.targetDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetDate: text }))}
                placeholder={t('countdown.targetDatePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('countdown.targetTimeLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={formData.targetTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetTime: text }))}
                placeholder={t('countdown.targetTimePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('countdown.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCountdown}
            >
              <Check size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.saveButtonText}>{t('countdown.save')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
    paddingVertical: 16,
    backgroundColor: colors.surface,
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
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  anonymousNotice: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 20,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  countdownList: {
    gap: 16,
    paddingVertical: 16,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border + '20',
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  countdownInfo: {
    flex: 1,
  },
  countdownTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  countdownDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  countdownMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countdownMetaText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  countdownActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    marginBottom: 16,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  expiredText: {
    fontFamily: Fonts.display.semibold,
    fontSize: 18,
    color: colors.error,
    marginLeft: 8,
  },
  timerGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  timerUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  timerValue: {
    fontFamily: Fonts.display.bold,
    fontSize: 28,
    color: colors.text,
    lineHeight: 32,
  },
  timerLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  timerSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  timerSeparatorText: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 20,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: colors.text,
    marginLeft: 16,
  },
  navigationSpacer: {
    flex: 1,
  },
  navigationAddButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 16,
  },
});

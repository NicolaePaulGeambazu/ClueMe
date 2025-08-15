import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Easing,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useFamily } from '../../../hooks/useFamily';
import { useModal } from '../../../contexts/ModalContext';
import { usePremium } from '../../../hooks/usePremium';
import { useRevenueCatPaywall } from '../../../hooks/useRevenueCatPaywall';
import monetizationService from '../../../services/monetizationService';
import { Colors } from '../../../constants/Colors';
import SmallPaywallModal from '../../premium/SmallPaywallModal';
import FullScreenPaywall from '../../premium/FullScreenPaywall';
import { premiumStatusManager } from '../../../services/premiumStatusManager';
import premiumService from '../../../services/premiumService';
import { CustomDateTimePickerModal } from '../../ReminderForm/CustomDateTimePicker';
import { RepeatOptions } from '../../ReminderForm/RepeatOptions';
import NotificationTimingModal from '../NotificationTimingModal';
import InterstitialAdTrigger from '../../ads/InterstitialAdTrigger';
import { QuickAddHeader } from './QuickAddHeader';
import { QuickAddForm } from './QuickAddForm';
import { QuickAddSheets } from './QuickAddSheets';
import { FamilyMemberDrawer } from '../FamilyMemberDrawer';
import { DateTimeSelectionModal } from './DateTimeSelectionModal';
import { useQuickAddForm, ReminderData } from './useQuickAddForm';
import { createStyles } from './styles';
import { SubTask } from '../../../design-system/reminders/types';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminder: ReminderData) => Promise<void>;
  onAdvanced: (data: ReminderData) => void;
  prefillDate?: string;
  prefillTime?: string;
  prefillData?: ReminderData;
}

export default function QuickAddModal({
  visible,
  onClose,
  onSave,
  onAdvanced,
  prefillDate,
  prefillTime,
  prefillData,
}: QuickAddModalProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { members } = useFamily();
  const { showDatePicker: showGlobalDatePicker } = useModal();
  const premiumHook = usePremium();
  const { isPremium } = premiumHook;
  const { 
    showPaywall, 
    showSmallPaywall, 
    showFullScreenPaywall, 
    hidePaywall,
    paywallMessage 
  } = useRevenueCatPaywall();

  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Debug: Log family members for assignment debugging
  useEffect(() => {
    if (members.length > 0) {
      console.log('[QuickAddModal] Family members for assignment:', members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
      })));
    } else {
      console.log('[QuickAddModal] No family members available for assignment');
    }
  }, [members]);

  // Animation
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const form = useQuickAddForm(prefillData, prefillDate, prefillTime);
  const [isSaving, setIsSaving] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isChunked, setIsChunked] = useState(false);
  const [showTaskChunking, setShowTaskChunking] = useState(false);
  const [dateTimeModalState, setDateTimeModalState] = useState<null | 'main' | 'customDate' | 'customTime'>(null);
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [tempDate, setTempDate] = useState<string>(form.selectedDate);
  const [tempTime, setTempTime] = useState<string>(form.selectedTime);
  const [tempCustomDate, setTempCustomDate] = useState<Date | null>(form.customDateValue);
  const [tempCustomTime, setTempCustomTime] = useState<string>(form.customTimeValue);

  // Debug: Log when assignments change
  useEffect(() => {
    if (form.assignedTo.length > 0) {
      console.log('[QuickAddModal] Current assignments:', form.assignedTo);
    }
  }, [form.assignedTo]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Clean entrance animation with just slide and fade
      Animated.parallel([
        // Fade in overlay
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Modal slides up smoothly
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        }),
      ]).start();
    } else {
      // Clean exit animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Handlers
  const handleSave = async () => {
    if (!form.title.trim()) {return;}

    try {
      setIsSaving(true);

      // Check monetization limits before creating reminder
      if (!isPremium && user?.uid && !justUpgraded) {
        console.log('[QuickAddModal] Checking monetization limits for user:', user.uid);
        const monetizationResult = await monetizationService.checkReminderCreation(user.uid);
        
        console.log('[QuickAddModal] Monetization result:', {
          shouldShow: monetizationResult.shouldShow,
          isBlocking: monetizationResult.isBlocking,
          currentCount: monetizationResult.currentCount,
          limit: monetizationResult.limit,
          message: monetizationResult.message
        });
        
        if (monetizationResult.shouldShow) {
          // Show paywall modal
          if (monetizationResult.isBlocking) {
            console.log('[QuickAddModal] Blocking reminder creation - showing full screen paywall');
            // Block the action and show full screen paywall
            showPaywall('fullscreen', monetizationResult.message, monetizationResult.triggerType);
            return; // Don't proceed with creation
          } else {
            console.log('[QuickAddModal] Showing warning paywall but allowing creation');
            // Show warning but allow creation
            showPaywall('small', monetizationResult.message, monetizationResult.triggerType);
          }
        } else {
          console.log('[QuickAddModal] No paywall needed, proceeding with creation');
        }
      } else {
        console.log('[QuickAddModal] Skipping monetization check - isPremium:', isPremium, 'userId:', user?.uid);
      }

      // Debug: Log the reminder data being saved
      const reminderData = form.createReminderData();
      console.log('[QuickAddModal] Saving reminder with assignments:', {
        title: reminderData.title,
        dueDate: reminderData.dueDate,
        dueTime: reminderData.dueTime,
        assignedTo: reminderData.assignedTo,
        assignedToCount: reminderData.assignedTo?.length || 0,
        isRecurring: reminderData.isRecurring,
        repeatPattern: reminderData.repeatPattern,
        recurringEndDate: reminderData.recurringEndDate,
        customInterval: reminderData.customInterval,
        recurringPattern: reminderData.recurringPattern
      });

      await onSave(reminderData);

      // Reset form
      form.setTitle('');
      form.setLocation('');
      form.setSelectedDate('today');
      form.setSelectedTime('in1hour');
      form.setCustomTimeValue('');
      form.setCustomDateValue(null);
      form.setIsRecurring(false);
      form.setRecurringPattern({
        type: 'none',
        interval: 1,
        days: [],
        endCondition: 'never',
        endDate: null,
        endOccurrences: undefined,
      });

      form.setAssignedTo([]);
      form.setNotificationTimings([]);

      // Reset task chunking
      setSubTasks([]);
      setIsChunked(false);

      // Close modal after successful save
      onClose();
    } catch (error) {
      console.error('[QuickAddModal] Error saving reminder:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleDatePickerConfirm = (date: Date) => {
    form.setCustomDateValue(date);
    form.setShowLocalDatePicker(false);
  };

  const handleTimePickerConfirm = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    form.setCustomTimeValue(timeString);
    form.setShowTimePicker(false);
  };

  // New full-page modal handlers
  const handleDateTimeModalConfirm = (dateValue: string, timeValue: string) => {
    form.handleDateSelect(dateValue);
    form.handleTimeSelect(timeValue);
  };

  const handleDateTimeModalClose = () => {
    form.setShowDateTimeModal(false);
  };

  const handleTaskChunkingSave = (newSubTasks: SubTask[]) => {
    setSubTasks(newSubTasks);
    setIsChunked(newSubTasks.length > 0);
    setShowTaskChunking(false);
  };

  const handleTaskChunkingClose = () => {
    setShowTaskChunking(false);
  };

  // Handle upgrade after successful purchase
  const handleUpgrade = async () => {
    try {
      console.log('[QuickAddModal] Handling upgrade after purchase...');
      
      // Set flag to prevent paywall from showing again
      setJustUpgraded(true);
      
      // Refresh premium status manager
      await premiumStatusManager.refreshStatus();
      console.log('[QuickAddModal] Premium status manager refreshed after upgrade');
      
      // Refresh premium service
      await premiumService.refreshPremiumStatus();
      console.log('[QuickAddModal] Premium service refreshed after upgrade');
      
      // Add a longer delay to ensure status is properly updated and cached
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      hidePaywall();
      
      // Reset the flag after a delay
      setTimeout(() => {
        setJustUpgraded(false);
      }, 5000);
    } catch (error) {
      console.error('[QuickAddModal] Error refreshing premium status:', error);
      hidePaywall();
    }
  };

  if (!visible) {return null;}

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
            backgroundColor: `rgba(0, 0, 0, ${opacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            })})`,
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={handleClose}
          activeOpacity={1}
          disabled={false}
        >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          enabled={true}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                backgroundColor: colors.background,
                opacity: opacityAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0], // Clean slide up animation
                    }),
                  },
                ],
              },
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
            onResponderGrant={(e) => e.stopPropagation()}
            onResponderMove={(e) => e.stopPropagation()}
            onResponderRelease={(e) => e.stopPropagation()}
          >
            <View style={styles.keyboardView}>
              <QuickAddHeader
                onClose={handleClose}
                onSave={handleSave}
                isSaving={isSaving}
                isDisabled={!form.title.trim()}
                isEditing={!!prefillData}
                colors={colors}
                styles={styles}
              />

              <QuickAddForm
                title={form.title}
                setTitle={form.setTitle}
                location={form.location}
                setLocation={form.setLocation}
                selectedDate={form.selectedDate}
                selectedTime={form.selectedTime}
                customTimeValue={form.customTimeValue}
                customDateValue={form.customDateValue}
                isRecurring={form.isRecurring}

                assignedTo={form.assignedTo}
                notificationTimings={form.notificationTimings}
                isPremium={isPremium}
                dateOptions={form.dateOptions}
                getTimeOptions={form.getTimeOptions}
                getRecurringDescriptionText={form.getRecurringDescriptionText}
                getAssignedMembersText={form.getAssignedMembersText}
                getAssignedMembersDetails={form.getAssignedMembersDetails}
                members={members}
                onDatePress={() => {
                  setTempDate(form.selectedDate);
                  setTempTime(form.selectedTime);
                  setTempCustomDate(form.customDateValue);
                  setTempCustomTime(form.customTimeValue);
                  setDateTimeModalState('main');
                }}
                onRecurringPress={() => form.setShowRepeatOptions(true)}
                onNotificationPress={() => form.setShowNotificationModal(true)}
                onFamilyPress={() => form.setShowFamilyPicker(true)}
                isChunked={isChunked}
                subTasksCount={subTasks.length}
                colors={colors}
                styles={styles}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        <QuickAddSheets
          showDateSheet={form.showDateSheet}
          showTimeSheet={form.showTimeSheet}
          showFamilyPicker={false} // Disabled - using drawer instead
          dateOptions={form.dateOptions}
          timeOptions={form.getTimeOptions()}
          members={members}
          assignedTo={form.assignedTo}
          onDateSelect={form.handleDateSelect}
          onTimeSelect={form.handleTimeSelect}
          onFamilyMemberToggle={form.handleFamilyMemberToggle}
          onCloseDateSheet={() => form.setShowDateSheet(false)}
          onCloseTimeSheet={() => form.setShowTimeSheet(false)}
          onCloseFamilyPicker={() => form.setShowFamilyPicker(false)}
          colors={colors}
          styles={styles}
        />

        {/* Family Member Drawer - Vaul-style */}
        <FamilyMemberDrawer
          visible={form.showFamilyPicker}
          onClose={() => form.setShowFamilyPicker(false)}
          members={members}
          assignedTo={form.assignedTo}
          onToggleMember={form.handleFamilyMemberToggle}
          colors={colors}
        />

        {/* Date Picker Modal */}
        <CustomDateTimePickerModal
          visible={form.showLocalDatePicker}
          onClose={() => form.setShowLocalDatePicker(false)}
          onConfirm={handleDatePickerConfirm}
          initialDate={new Date()}
          mode="date"
          colors={colors}
        />

        {/* Time Picker Modal */}
        <CustomDateTimePickerModal
          visible={form.showTimePicker}
          onClose={() => form.setShowTimePicker(false)}
          onConfirm={handleTimePickerConfirm}
          initialDate={new Date()}
          mode="time"
          colors={colors}
        />

        {/* Enhanced Repeat Options Modal */}
        {form.showRepeatOptions && (
          <RepeatOptions
            visible={form.showRepeatOptions}
            onClose={() => form.setShowRepeatOptions(false)}
            isRecurring={form.isRecurring}
            onRecurringChange={form.setIsRecurring}
            repeatPattern={form.recurringPattern.type}
            onRepeatPatternChange={(pattern) => {
              form.setRecurringPattern(prev => ({ ...prev, type: pattern }));
            }}
            customInterval={form.recurringPattern.interval}
            onCustomIntervalChange={(interval) => {
              form.setRecurringPattern(prev => ({ ...prev, interval }));
            }}
            colors={colors}
            repeatDays={form.recurringPattern.days}
            onRepeatDaysChange={(days) => {
              form.setRecurringPattern(prev => ({ ...prev, days }));
            }}
            recurringStartDate={undefined}
            onRecurringStartDateChange={() => {}}
            recurringEndDate={form.recurringPattern.endDate || undefined}
            onRecurringEndDateChange={(date) => {
              form.setRecurringPattern(prev => ({ ...prev, endDate: date || null }));
            }}
            recurringEndAfter={form.recurringPattern.endOccurrences}
            onRecurringEndAfterChange={(count) => {
              form.setRecurringPattern(prev => ({ ...prev, endOccurrences: count }));
            }}
            onDatePickerOpen={(mode) => {
              if (mode === 'end') {
                const currentEndDate = form.recurringPattern.endDate || new Date();
                showGlobalDatePicker('end', currentEndDate, (date) => {
                  form.setRecurringPattern(prev => ({
                    ...prev,
                    endDate: date,
                  }));
                });
              }
            }}
            userTier={isPremium ? 'apex' : 'free'}
          />
        )}

        {/* Notification Timing Modal */}
        <NotificationTimingModal
          visible={form.showNotificationModal}
          onClose={() => form.setShowNotificationModal(false)}
          onSelect={form.setNotificationTimings}
          currentTimings={form.notificationTimings}
        />

        {/* Interstitial Ad Trigger - Show after user creates 3 reminders */}
        <InterstitialAdTrigger
          triggerOnAction={true}
          actionCompleted={isSaving && form.title.trim().length > 0}
        />

        {/* Paywall Modals */}
        <SmallPaywallModal
          visible={showSmallPaywall}
          onClose={hidePaywall}
          onUpgrade={handleUpgrade}
          message={paywallMessage}
          triggerFeature="reminder_limit"
        />

        <FullScreenPaywall
          visible={showFullScreenPaywall}
          onClose={hidePaywall}
          onUpgrade={handleUpgrade}
          triggerFeature="reminder_limit"
        />

        {/* New Full-Page Date/Time Selection Modal */}
        <DateTimeSelectionModal
          visible={!!dateTimeModalState}
          onClose={() => setDateTimeModalState(null)}
          onConfirm={(
            dateValue: string,
            timeValue: string,
            customDate: Date | null,
            customTime: string
          ) => {
            form.setSelectedDate(dateValue);
            form.setSelectedTime(timeValue);
            if (dateValue === 'custom') {form.setCustomDateValue(customDate);}
            if (timeValue === 'custom') {form.setCustomTimeValue(customTime);}
            setDateTimeModalState(null);
          }}
          currentDate={tempDate}
          currentTime={tempTime}
          customDateValue={tempCustomDate}
          customTimeValue={tempCustomTime}
          dateOptions={form.dateOptions}
          timeOptions={form.getTimeOptions()}
          colors={colors}
          modalState={dateTimeModalState}
          setModalState={setDateTimeModalState}
          setTempDate={setTempDate}
          setTempTime={setTempTime}
          setTempCustomDate={setTempCustomDate}
          setTempCustomTime={setTempCustomTime}
          tempDate={tempDate}
          tempTime={tempTime}
        />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useFamily } from '../../../hooks/useFamily';
import { useModal } from '../../../contexts/ModalContext';
import { usePremium } from '../../../hooks/usePremium';
import { Colors } from '../../../constants/Colors';
import { CustomDateTimePickerModal } from '../../ReminderForm/CustomDateTimePicker';
import { RepeatOptions } from '../../ReminderForm/RepeatOptions';
import NotificationTimingModal from '../NotificationTimingModal';
import InterstitialAdTrigger from '../../ads/InterstitialAdTrigger';
import { TaskChunkingModal } from '../TaskChunkingModal';
import { QuickAddHeader } from './QuickAddHeader';
import { QuickAddForm } from './QuickAddForm';
import { QuickAddFooter } from './QuickAddFooter';
import { QuickAddSheets } from './QuickAddSheets';
import { useQuickAddForm, ReminderData } from './useQuickAddForm';
import { createStyles } from './styles';
import { SubTask } from '../../../design-system/reminders/types';
import { suggestSubTasks, createSubTasksFromSuggestions } from '../../../utils/taskChunkingUtils';

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
  const { isPremium } = usePremium();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Form state and logic
  const form = useQuickAddForm(prefillData, prefillDate, prefillTime);
  const [isSaving, setIsSaving] = useState(false);

  // Task chunking state
  const [showTaskChunking, setShowTaskChunking] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isChunked, setIsChunked] = useState(false);

  // Animation effects
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Handlers
  const handleSave = async () => {
    if (!form.title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const reminderData = form.createReminderData();
      
      // Add task chunking data if present
      if (isChunked && subTasks.length > 0) {
        reminderData.isChunked = true;
        reminderData.subTasks = subTasks;
        reminderData.chunkedProgress = 0; // Will be calculated by the service
      }
      
      await onSave(reminderData);
      handleClose();
    } catch (error) {
      console.error('Failed to save reminder:', error);
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

  // Task chunking handlers
  const handleBreakDownTask = () => {
    if (subTasks.length === 0) {
      // Auto-suggest sub-tasks for new chunking
      const suggestions = suggestSubTasks(form.title);
      const initialSubTasks = createSubTasksFromSuggestions(suggestions);
      setSubTasks(initialSubTasks);
    }
    setShowTaskChunking(true);
  };

  const handleTaskChunkingSave = (newSubTasks: SubTask[]) => {
    setSubTasks(newSubTasks);
    setIsChunked(newSubTasks.length > 0);
    setShowTaskChunking(false);
  };

  const handleTaskChunkingClose = () => {
    setShowTaskChunking(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
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
                opacity: opacityAnim 
              }
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
                isEditing={!!prefillData}
                colors={colors}
                styles={styles}
              />

              <QuickAddForm
                title={form.title}
                setTitle={form.setTitle}
                selectedDate={form.selectedDate}
                selectedTime={form.selectedTime}
                customTimeValue={form.customTimeValue}
                customDateValue={form.customDateValue}
                isRecurring={form.isRecurring}
                timezone={form.timezone}
                assignedTo={form.assignedTo}
                notificationTimings={form.notificationTimings}
                isPremium={isPremium}
                dateOptions={form.dateOptions}
                getTimeOptions={form.getTimeOptions}
                getRecurringDescriptionText={form.getRecurringDescriptionText}
                getAssignedMembersText={form.getAssignedMembersText}
                onDatePress={() => form.setShowDateSheet(true)}
                onTimePress={() => form.setShowTimeSheet(true)}
                onRecurringPress={() => form.setShowRepeatOptions(true)}
                onNotificationPress={() => form.setShowNotificationModal(true)}
                onFamilyPress={() => form.setShowFamilyPicker(true)}
                onBreakDownTask={handleBreakDownTask}
                isChunked={isChunked}
                subTasksCount={subTasks.length}
                colors={colors}
                styles={styles}
              />

              <QuickAddFooter
                onSave={handleSave}
                isSaving={isSaving}
                isDisabled={!form.title.trim()}
                isEditing={!!prefillData}
                colors={colors}
                styles={styles}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>

        <QuickAddSheets
          showDateSheet={form.showDateSheet}
          showTimeSheet={form.showTimeSheet}
          showFamilyPicker={form.showFamilyPicker}
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
                    endDate: date 
                  }));
                });
              }
            }}
            userTier="free"
          />
        )}

        {/* Notification Timing Modal */}
        <NotificationTimingModal
          visible={form.showNotificationModal}
          onClose={() => form.setShowNotificationModal(false)}
          onSelect={form.setNotificationTimings}
          currentTimings={form.notificationTimings}
        />

        {/* Task Chunking Modal */}
        <TaskChunkingModal
          visible={showTaskChunking}
          onClose={handleTaskChunkingClose}
          onSave={handleTaskChunkingSave}
          initialSubTasks={subTasks}
          taskTitle={form.title}
        />

        {/* Interstitial Ad Trigger - Show after user creates 3 reminders */}
        <InterstitialAdTrigger
          triggerOnAction={true}
          actionCompleted={isSaving && form.title.trim().length > 0}
        />
      </TouchableOpacity>
    </View>
  );
} 
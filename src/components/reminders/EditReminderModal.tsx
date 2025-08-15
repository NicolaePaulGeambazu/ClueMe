import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QuickAddModal from './QuickAddModal';

import { useReminders } from '../../hooks/useReminders';
import { useAuth } from '../../contexts/AuthContext';
import { reminderService } from '../../services/firebaseService';
import { DateTime } from 'luxon';
import { SubTask } from '../../design-system/reminders/types';

interface EditReminderModalProps {
  visible: boolean;
  onClose: () => void;
  reminderId: string;
}

export default function EditReminderModal({
  visible,
  onClose,
  reminderId,
}: EditReminderModalProps) {
  const navigation = useNavigation();
  const { updateReminder } = useReminders();
  const { user } = useAuth();

  // Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [wizardInitialData, setWizardInitialData] = useState<any>(null);
  const [originalReminder, setOriginalReminder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load reminder data when modal becomes visible
  useEffect(() => {
    if (visible && reminderId && user?.uid) {
      loadReminderData();
    }
  }, [visible, reminderId, user?.uid]);

  const loadReminderData = async () => {
    if (!reminderId) {return;}

    setIsLoading(true);
    try {

      // Get reminder directly by ID
      const reminder = await reminderService.getReminderById(reminderId);

      if (!reminder) {
        onClose();
        return;
      }

      setOriginalReminder(reminder);

      // Convert reminder data to form format
      const dueDate = reminder.dueDate instanceof Date ? reminder.dueDate :
                     typeof reminder.dueDate === 'string' ? new Date(reminder.dueDate) : new Date();
      const dueDateTime = DateTime.fromJSDate(dueDate);
      if (reminder.dueTime) {
        const [hours, minutes] = reminder.dueTime.split(':').map(Number);
        dueDateTime.set({ hour: hours, minute: minutes });
      }

      // Prepare initial data for the wizard
      const initialData = {
        title: reminder.title,
        description: reminder.description || '',
        dueDate: reminder.dueDate instanceof Date ? reminder.dueDate : new Date(),
        dueTime: reminder.dueTime || '15:00',
        isRecurring: reminder.isRecurring || false,
        repeatPattern: reminder.repeatPattern || 'none',
        assignedTo: reminder.assignedTo || [],
        priority: reminder.priority || 'medium',
        hasNotification: reminder.hasNotification !== false, // Default to true
        notificationTimings: reminder.notificationTimings || [
          { type: 'before', value: 15, label: '15 minutes before' },
        ],
        // Task chunking data
        isChunked: reminder.isChunked || false,
        subTasks: reminder.subTasks || [],
        chunkedProgress: reminder.chunkedProgress || 0,
      };

      setWizardInitialData(initialData);

    } catch (error) {
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddSave = async (reminderData: any) => {
    try {

      if (!originalReminder) {
        throw new Error('No original reminder data available');
      }

      // Only update the fields that should be changed, not the entire reminder object
      const updates = {
        title: reminderData.title,
        location: reminderData.location,
        dueDate: reminderData.dueDate,
        dueTime: reminderData.dueTime,
        isRecurring: reminderData.isRecurring,
        recurringPattern: reminderData.recurringPattern,
        repeatPattern: reminderData.repeatPattern,
        recurringEndDate: reminderData.recurringEndDate,
        recurringEndAfter: reminderData.recurringEndAfter,
        customInterval: reminderData.customInterval,
        repeatDays: reminderData.repeatDays,
        occurrences: reminderData.occurrences,

        assignedTo: reminderData.assignedTo,
        hasNotification: reminderData.hasNotification,
        notificationTimings: reminderData.notificationTimings,
        // Task chunking fields
        isChunked: reminderData.isChunked,
        subTasks: reminderData.subTasks,
        chunkedProgress: reminderData.chunkedProgress,
        updatedAt: new Date(),
      };

      await updateReminder(reminderId, updates);

      handleClose();
    } catch (error) {
      throw error; // Re-throw to let QuickAddModal handle it
    }
  };



  const handleClose = () => {
    setShowQuickAdd(true);
    setWizardInitialData(null);
    setOriginalReminder(null);
    onClose();
  };

  const handleAdvanced = (data: any) => {
    // For now, just merge the data with existing wizard data
    const mergedData = { ...wizardInitialData, ...data };
    setWizardInitialData(mergedData);
  };

  // If not visible, render nothing
  if (!visible) {
    return null;
  }

  // If loading, show loading state
  if (isLoading) {
    return null; // You could add a loading modal here if needed
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      >
        {/* Quick Add Modal with prefilled data */}
        <QuickAddModal
          visible={showQuickAdd}
          onClose={handleClose}
          onSave={handleQuickAddSave}
          onAdvanced={handleAdvanced}
          prefillData={wizardInitialData}
        />


      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
});

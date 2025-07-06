import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QuickAddModal from './QuickAddModal';
import ReminderWizard from './ReminderWizard';
import { useReminders } from '../../hooks/useReminders';
import { useAuth } from '../../contexts/AuthContext';
import { reminderService } from '../../services/firebaseService';
import { DateTime } from 'luxon';

interface EditReminderModalProps {
  visible: boolean;
  onClose: () => void;
  reminderId: string;
}

export default function EditReminderModal({ 
  visible, 
  onClose, 
  reminderId 
}: EditReminderModalProps) {
  const navigation = useNavigation();
  const { updateReminder } = useReminders();
  const { user } = useAuth();
  
  // Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<any>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState(1);
  const [originalReminder, setOriginalReminder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load reminder data when modal becomes visible
  useEffect(() => {
    if (visible && reminderId && user?.uid) {
      loadReminderData();
    }
  }, [visible, reminderId, user?.uid]);

  const loadReminderData = async () => {
    if (!reminderId) return;

    setIsLoading(true);
    try {
      console.log('🔄 EditReminderModal: Loading reminder data...', { reminderId });
      
      // Get reminder directly by ID
      const reminder = await reminderService.getReminderById(reminderId);
      
      if (!reminder) {
        console.error('❌ EditReminderModal: Reminder not found');
        onClose();
        return;
      }

      setOriginalReminder(reminder);
      
      // Convert reminder data to form format
      const dueDateTime = reminder.dueDate ? DateTime.fromJSDate(reminder.dueDate) : DateTime.now();
      if (reminder.dueTime) {
        const [hours, minutes] = reminder.dueTime.split(':').map(Number);
        dueDateTime.set({ hour: hours, minute: minutes });
      }

      // Prepare initial data for the wizard
      const initialData = {
        title: reminder.title,
        description: reminder.description || '',
        dueDate: reminder.dueDate || new Date(),
        dueTime: reminder.dueTime || '15:00',
        isRecurring: reminder.isRecurring || false,
        repeatPattern: reminder.repeatPattern || 'none',
        assignedTo: reminder.assignedTo || [],
        priority: reminder.priority || 'medium',
        hasNotification: reminder.hasNotification !== false, // Default to true
        notificationTimings: reminder.notificationTimings || [
          { type: 'before', value: 15, label: '15 minutes before' }
        ],
      };

      setWizardInitialData(initialData);
      console.log('✅ EditReminderModal: Reminder data loaded successfully', initialData);

    } catch (error) {
      console.error('❌ EditReminderModal: Error loading reminder:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddSave = async (reminderData: any) => {
    try {
      console.log('🔄 EditReminderModal: Starting reminder update...', { title: reminderData.title });
      
      if (!originalReminder) {
        throw new Error('No original reminder data available');
      }

      // Merge the new data with the original reminder
      const updatedReminder = {
        ...originalReminder,
        ...reminderData,
        updatedAt: new Date(),
      };
      
      await updateReminder(reminderId, updatedReminder);
      
      console.log('✅ EditReminderModal: Reminder updated successfully, closing modal...');
      handleClose();
    } catch (error) {
      console.error('❌ EditReminderModal: Error updating reminder:', error);
      throw error; // Re-throw to let QuickAddModal handle it
    }
  };

  const handleWizardSave = async (reminderData: any) => {
    try {
      console.log('🔄 EditReminderModal: Starting wizard reminder update...', { title: reminderData.title });
      
      if (!originalReminder) {
        throw new Error('No original reminder data available');
      }

      // Merge the new data with the original reminder
      const updatedReminder = {
        ...originalReminder,
        ...reminderData,
        updatedAt: new Date(),
      };
      
      await updateReminder(reminderId, updatedReminder);
      
      console.log('✅ EditReminderModal: Wizard reminder updated successfully, closing modal...');
      handleClose();
    } catch (error) {
      console.error('❌ EditReminderModal: Error updating wizard reminder:', error);
      throw error;
    }
  };

  const handleClose = () => {
    console.log('🔄 EditReminderModal: handleClose called...');
    setShowQuickAdd(true);
    setShowWizard(false);
    setWizardInitialData(null);
    setWizardInitialStep(1);
    setOriginalReminder(null);
    onClose();
    console.log('✅ EditReminderModal: handleClose completed');
  };

  const handleWizardClose = () => {
    console.log('🔄 EditReminderModal: Wizard close called...');
    setShowWizard(false);
    setShowQuickAdd(true);
    setWizardInitialData(null);
    setWizardInitialStep(1);
  };

  const handleAdvanced = (data: any) => {
    console.log('🔄 EditReminderModal: Advanced options requested...', data);
    setShowQuickAdd(false);
    setShowWizard(true);
    // Merge the new data with the existing wizard data
    const mergedData = { ...wizardInitialData, ...data };
    setWizardInitialData(mergedData);
    setWizardInitialStep(data && data.title ? 2 : 1);
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
    <>
      {/* Quick Add Modal with prefilled data */}
      <QuickAddModal
        visible={showQuickAdd}
        onClose={handleClose}
        onSave={handleQuickAddSave}
        onAdvanced={handleAdvanced}
        prefillData={wizardInitialData}
      />

      {/* Reminder Wizard with prefilled data */}
      <ReminderWizard
        visible={showWizard}
        onClose={handleWizardClose}
        onSave={handleWizardSave}
        initialData={wizardInitialData}
        initialStep={wizardInitialStep}
      />
    </>
  );
}

// No styles needed since we're not rendering any visible container 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import QuickAddModal from './QuickAddModal';
import ReminderWizard from './ReminderWizard';
import { useReminders } from '../../hooks/useReminders';
import { useAuth } from '../../contexts/AuthContext';

type TabParamList = {
  Home: undefined;
  Add: undefined;
  Lists: undefined;
  Settings: undefined;
};

type AddTabNavigationProp = BottomTabNavigationProp<TabParamList, 'Add'>;

export default function AddReminderTab() {
  const navigation = useNavigation<AddTabNavigationProp>();
  const { createReminder } = useReminders();
  const { user } = useAuth();
  
  // Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState<any>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState(1);

  // Show modal when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 AddReminderTab: Tab focused, showing modal...');
      setShowQuickAdd(true);
      setShowWizard(false);
    }, [])
  );

  // Hide modals when tab loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log('🔄 AddReminderTab: Tab lost focus, hiding modals...');
        setShowQuickAdd(false);
        setShowWizard(false);
      };
    }, [])
  );

  const handleQuickAddSave = async (reminderData: any) => {
    try {
      console.log('🔄 AddReminderTab: Starting reminder creation...', { title: reminderData.title });
      
      await createReminder({
        ...reminderData,
        userId: user?.uid,
        status: 'pending',
        completed: false,
      });
      
      console.log('✅ AddReminderTab: Reminder created successfully, closing modal...');
      handleClose();
    } catch (error) {
      console.error('❌ AddReminderTab: Error adding reminder:', error);
      throw error; // Re-throw to let QuickAddModal handle it
    }
  };

  const handleWizardSave = async (reminderData: any) => {
    try {
      console.log('🔄 AddReminderTab: Starting wizard reminder creation...', { title: reminderData.title });
      
      await createReminder({
        ...reminderData,
        userId: user?.uid,
        status: 'pending',
        completed: false,
      });
      
      console.log('✅ AddReminderTab: Wizard reminder created successfully, closing modal...');
      handleClose();
    } catch (error) {
      console.error('❌ AddReminderTab: Error adding wizard reminder:', error);
      throw error;
    }
  };

  const handleClose = () => {
    console.log('🔄 AddReminderTab: handleClose called...');
    setShowQuickAdd(true);
    setShowWizard(false);
    setWizardInitialData(null);
    setWizardInitialStep(1);
    // Navigate back to Home tab
    navigation.navigate('Home');
    console.log('✅ AddReminderTab: handleClose completed');
  };

  const handleWizardClose = () => {
    console.log('🔄 AddReminderTab: Wizard close called...');
    setShowWizard(false);
    setShowQuickAdd(true);
    setWizardInitialData(null);
    setWizardInitialStep(1);
  };

  const handleAdvanced = (data: any) => {
    console.log('🔄 AddReminderTab: Advanced options requested...', data);
    setShowQuickAdd(false);
    setShowWizard(true);
    setWizardInitialData(data || null);
    setWizardInitialStep(data && data.title ? 2 : 1);
  };

  // If no modal is visible, render nothing
  if (!showQuickAdd && !showWizard) {
    return null;
  }

  return (
    <>
      {/* Quick Add Modal */}
      <QuickAddModal
        visible={showQuickAdd}
        onClose={handleClose}
        onSave={handleQuickAddSave}
        onAdvanced={handleAdvanced}
      />

      {/* Reminder Wizard */}
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
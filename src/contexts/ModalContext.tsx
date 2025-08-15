import React, { createContext, useContext, useState, ReactNode } from 'react';
import QuickAddModal from '../components/reminders/QuickAddModal';
import EditReminderModal from '../components/reminders/EditReminderModal';
import { DatePickerModal } from '../components/common/DatePickerModal';
import { useReminders } from '../hooks/useReminders';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

interface ModalContextType {
  showQuickAddModal: () => void;
  hideQuickAddModal: () => void;
  showEditReminderModal: (reminderId: string) => void;
  hideEditReminderModal: () => void;
  showDatePicker: (type: 'main' | 'end', currentDate: Date, callback: (date: Date) => void) => void;
  hideDatePicker: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const { createReminder } = useReminders();
  const { user } = useAuth();
  const { theme } = useTheme();

  // QuickAddModal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // EditReminderModal state
  const [showEditReminder, setShowEditReminder] = useState(false);
  const [editReminderId, setEditReminderId] = useState<string>('');

  // Date picker state
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'main' | 'end'>('main');
  const [datePickerCurrentDate, setDatePickerCurrentDate] = useState<Date>(new Date());
  const [datePickerCallback, setDatePickerCallback] = useState<((date: Date) => void) | null>(null);

  const handleQuickAddSave = async (reminderData: any) => {
    try {

      await createReminder({
        ...reminderData,
        userId: user?.uid,
        status: 'pending',
        completed: false,
      });

      hideQuickAddModal();
    } catch (error) {
      throw error;
    }
  };

  const handleQuickAddClose = () => {
    hideQuickAddModal();
  };

  const handleAdvanced = (data: any) => {
    // For now, just log the advanced data
  };

  const handleDatePickerClose = () => {
    setShowDatePickerModal(false);
    setDatePickerCallback(null);
  };

  const handleDatePickerSelect = (date: Date) => {
    if (datePickerCallback) {
      datePickerCallback(date);
    }
    setShowDatePickerModal(false);
    setDatePickerCallback(null);
  };

  const showQuickAddModal = () => {
    setShowQuickAdd(true);
  };

  const hideQuickAddModal = () => {
    setShowQuickAdd(false);
  };

  const showEditReminderModal = (reminderId: string) => {
    setEditReminderId(reminderId);
    setShowEditReminder(true);
  };

  const hideEditReminderModal = () => {
    setShowEditReminder(false);
    setEditReminderId('');
  };

  const showDatePicker = (type: 'main' | 'end', currentDate: Date, callback: (date: Date) => void) => {
    setDatePickerType(type);
    setDatePickerCurrentDate(currentDate);
    setDatePickerCallback(() => callback);
    setShowDatePickerModal(true);
  };

  const hideDatePicker = () => {
    setShowDatePickerModal(false);
    setDatePickerCallback(null);
  };

  const value: ModalContextType = {
    showQuickAddModal,
    hideQuickAddModal,
    showEditReminderModal,
    hideEditReminderModal,
    showDatePicker,
    hideDatePicker,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Global Modals */}
      <QuickAddModal
        visible={showQuickAdd}
        onClose={handleQuickAddClose}
        onSave={handleQuickAddSave}
        onAdvanced={handleAdvanced}
      />

      {/* Edit Reminder Modal */}
      <EditReminderModal
        visible={showEditReminder}
        onClose={hideEditReminderModal}
        reminderId={editReminderId}
      />

      {/* Date Picker Modal - Rendered last to ensure it's on top */}
      <DatePickerModal
        visible={showDatePickerModal}
        onClose={handleDatePickerClose}
        onDateSelect={handleDatePickerSelect}
        title={datePickerType === 'main' ? 'Select Date & Time' : 'Select End Date'}
        currentDate={datePickerCurrentDate}
        minimumDate={new Date()}
        theme={theme}
      />
    </ModalContext.Provider>
  );
};

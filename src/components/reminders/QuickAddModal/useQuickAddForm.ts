import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { formatDate } from '../../../utils/dateUtils';
import { generateOccurrences, getRecurringDescription } from '../../../design-system/reminders/utils/recurring-utils';
import { NotificationType, ReminderType, ReminderPriority, ReminderStatus, RepeatPattern } from '../../../design-system/reminders/types';
import { cleanReminderForFirestore } from '../../../utils/reminderUtils';
import { usePremium } from '../../../hooks/usePremium';
import monetizationService from '../../../services/monetizationService';
import { format } from 'date-fns';

export interface ReminderData {
  id?: string;
  title: string;
  location?: string;
  dueDate?: string;
  dueTime?: string;
  recurringPattern?: {
    type: string;
    interval: number;
    days: number[];
    endCondition: string;
    endDate: Date | null;
    endOccurrences?: number;
  };
  timezone?: string;
  assignedTo?: string[];
  type?: string;
  priority?: string;
  status?: string;
  completed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
  isRecurring?: boolean;
  repeatPattern?: string;
  recurringEndDate?: Date;
  recurringEndAfter?: number;
  customInterval?: number;
  repeatDays?: number[];
  occurrences?: Array<{ date: Date; description: string }>;
  hasNotification?: boolean;
  notificationTimings?: any[];
  isPremiumFeature?: boolean;
  [key: string]: any;
}

export const useQuickAddForm = (prefillData?: ReminderData, prefillDate?: string, prefillTime?: string) => {
  const { t } = useTranslation();
  const { isPremium } = usePremium();

  // Form state
  const [title, setTitle] = useState(prefillData?.title || '');
  const [location, setLocation] = useState(prefillData?.location || '');
  const [selectedDate, setSelectedDate] = useState<string>(prefillDate || 'today');
  const [selectedTime, setSelectedTime] = useState<string>(prefillTime || 'in1hour');
  const [customTimeValue, setCustomTimeValue] = useState<string>('');
  const [customDateValue, setCustomDateValue] = useState<Date | null>(null);

  // Enhanced recurring and timezone state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState({
    type: 'none' as string,
    interval: 1,
    days: [] as number[],
    endCondition: 'never' as string,
    endDate: null as Date | null,
    endOccurrences: undefined as number | undefined,
  });
  const [timezone, setTimezone] = useState('Europe/London');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  // Initialize notification timings based on user's premium status
  const getDefaultNotificationTimings = () => {
    if (isPremium) {
      // Premium users get 15 minutes before by default
      return [{ type: NotificationType.BEFORE, value: 15, label: '15 minutes before', description: '15 minutes before' }];
    } else {
      // Free users get "just in time" (exact timing)
      return [{ type: NotificationType.EXACT, value: 0, label: 'Just in time', description: 'Right when the reminder is due' }];
    }
  };

  const [notificationTimings, setNotificationTimings] = useState(getDefaultNotificationTimings());

  // Update notification timings when premium status changes
  useEffect(() => {
    setNotificationTimings(getDefaultNotificationTimings());
  }, [isPremium]);

  // Sheet visibility state
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showLocalDatePicker, setShowLocalDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // New full-page modal state
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setTitle(prefillData.title || '');
      setLocation(prefillData.location || '');

      if (prefillData.dueDate) {
        const dueDate = new Date(prefillData.dueDate);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (dueDate.toDateString() === now.toDateString()) {
          setSelectedDate('today');
        } else if (dueDate.toDateString() === tomorrow.toDateString()) {
          setSelectedDate('tomorrow');
        } else {
          setSelectedDate('custom');
        }
      }

      if (prefillData.dueTime) {
        setSelectedTime('custom');
        const [hours, minutes] = prefillData.dueTime.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        setCustomTimeValue(`${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
      }

      if (prefillData.recurringPattern) {
        setIsRecurring(true);
        setRecurringPattern({
          ...prefillData.recurringPattern,
          endOccurrences: prefillData.recurringPattern.endOccurrences || undefined,
        });
      }

      if (prefillData.timezone) {
        setTimezone(prefillData.timezone);
      }

      if (prefillData.assignedTo) {
        setAssignedTo(prefillData.assignedTo);
      }
    }
  }, [prefillData]);

  // Date options
  const dateOptions = [
    { value: 'today', label: t('quickAdd.today'), description: formatDate(new Date()) },
    { value: 'tomorrow', label: t('quickAdd.tomorrow'), description: formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) },
    { value: 'nextweek', label: t('quickAdd.nextWeek'), description: t('quickAdd.nextWeekDesc') },
    { value: 'custom', label: t('quickAdd.custom'), description: t('quickAdd.customDesc') },
  ];

  // Time options
  const getTimeOptions = () => {
    const now = new Date();
    const options = [
      { value: 'in1hour', label: t('quickAdd.in1Hour'), description: t('quickAdd.in1HourDesc'), time: '1 hour' },
      { value: 'in2hours', label: t('quickAdd.in2Hours'), description: t('quickAdd.in2HoursDesc'), time: '2 hours' },
      { value: 'in4hours', label: t('quickAdd.in4Hours'), description: t('quickAdd.in4HoursDesc'), time: '4 hours' },
      { value: 'tomorrow', label: t('quickAdd.tomorrow'), description: t('quickAdd.tomorrowDesc'), time: 'Tomorrow' },
      { value: 'custom', label: t('quickAdd.custom'), description: t('quickAdd.customDesc'), time: 'Custom' },
    ];
    return options;
  };

  // Utility functions
  const getDateFromSelection = (selection: string): Date => {
    const now = new Date();
    switch (selection) {
      case 'today':
        return now;
      case 'tomorrow':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'nextweek':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'custom':
        return customDateValue || now;
      default:
        return now;
    }
  };

  const getAdjustedDateForTime = (baseDate: Date, timeString: string): Date => {
    if (timeString === 'custom' && customTimeValue) {
      const adjustedDate = new Date(baseDate);
      const [time, period] = customTimeValue.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let adjustedHours = hours;

      if (period === 'PM' && hours !== 12) {
        adjustedHours += 12;
      } else if (period === 'AM' && hours === 12) {
        adjustedHours = 0;
      }

      adjustedDate.setHours(adjustedHours, minutes, 0, 0);
      return adjustedDate;
    } else {
      const now = new Date();
      switch (timeString) {
        case 'in1hour': {
          return new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour in milliseconds
        }
        case 'in2hours': {
          return new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours in milliseconds
        }
        case 'in4hours': {
          return new Date(now.getTime() + 4 * 60 * 60 * 1000); // Add 4 hours in milliseconds
        }
        case 'tomorrow': {
          const tomorrowDate = new Date(baseDate);
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          tomorrowDate.setHours(9, 0, 0, 0);
          return tomorrowDate;
        }
        default: {
          return new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour in milliseconds
        }
      }
    }
  };

  const getTimeFromSelection = (selection: string, selectedDate?: string): string => {
    if (selection === 'custom' && customTimeValue) {
      const [time, period] = customTimeValue.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let adjustedHours = hours;

      if (period === 'PM' && hours !== 12) {
        adjustedHours += 12;
      } else if (period === 'AM' && hours === 12) {
        adjustedHours = 0;
      }

      return `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const now = new Date();
    switch (selection) {
      case 'in1hour': {
        const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour in milliseconds
        return `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
      }
      case 'in2hours': {
        const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours in milliseconds
        return `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
      }
      case 'in4hours': {
        const futureTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // Add 4 hours in milliseconds
        return `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
      }
      case 'tomorrow':
        return '09:00';
      default: {
        const futureTime = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour in milliseconds
        return `${futureTime.getHours().toString().padStart(2, '0')}:${futureTime.getMinutes().toString().padStart(2, '0')}`;
      }
    }
  };

  const getRecurringDescriptionText = () => {
    if (!isRecurring) {
      return t('quickAdd.noRepeat');
    }
    // Create a mock reminder object for the description function
    const baseDate = getDateFromSelection(selectedDate);
    const finalDate = getAdjustedDateForTime(baseDate, selectedTime);
    const mockReminder = {
      id: 'mock',
      userId: 'mock',
      title: 'mock',
      type: 'reminder' as ReminderType,
      priority: ReminderPriority.MEDIUM,
      status: ReminderStatus.PENDING,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      recurringPattern: recurringPattern,
      dueDate: finalDate,
      repeatPattern: (recurringPattern as any).repeatPattern as RepeatPattern,
    };
    return getRecurringDescription(mockReminder as any);
  };

  const getAssignedMembersText = () => {
    if (assignedTo.length === 0) {
      return t('quickAdd.noAssignment');
    }
    if (assignedTo.length === 1) {
      return t('quickAdd.assignedTo1');
    }
    return t('quickAdd.assignedToMultiple', { count: assignedTo.length });
  };

  const handleDateSelect = (value: string) => {
    setSelectedDate(value);
    setShowDateSheet(false);

    if (value === 'custom') {
      setShowLocalDatePicker(true);
    }
  };

  const handleTimeSelect = (value: string) => {
    setSelectedTime(value);
    setShowTimeSheet(false);

    if (value === 'custom') {
      setShowTimePicker(true);
    }
  };

  const handleFamilyMemberToggle = (memberId: string) => {
    setAssignedTo(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const createReminderData = (): ReminderData => {
    const baseDate = getDateFromSelection(selectedDate);
    const finalDate = getAdjustedDateForTime(baseDate, selectedTime);
    const timeString = getTimeFromSelection(selectedTime, selectedDate);
    
    // Store the date in a way that preserves the intended local time
    // Create a date string that represents the local time without timezone conversion
    const year = finalDate.getFullYear();
    const month = String(finalDate.getMonth() + 1).padStart(2, '0');
    const day = String(finalDate.getDate()).padStart(2, '0');
    const localDueDate = `${year}-${month}-${day}T${timeString}:00`;
    
    // Debug logging for date creation
    console.log('[QuickAddForm] Date creation debug:', {
      selectedDate,
      selectedTime,
      baseDate: baseDate.toISOString(),
      finalDate: finalDate.toISOString(),
      timeString,
      localDueDate,
      currentTime: new Date().toISOString(),
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      finalDateLocal: finalDate.toString(),
      finalDateUTC: finalDate.toISOString()
    });
    
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const reminderData: ReminderData = {
      title: title.trim(),
      location: location.trim() || undefined,
      dueTime: timeString,
      timezone: userTimezone,
      assignedTo: assignedTo.length > 0 ? assignedTo : undefined,
      hasNotification: notificationTimings.length > 0,
      notificationTimings: notificationTimings,
      type: 'reminder',
      priority: 'medium',
      status: 'pending',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Validate the date
    if (!isNaN(finalDate.getTime())) {
      reminderData.dueDate = localDueDate;
    } else {
      console.warn('[QuickAddForm] Invalid dueDate generated:', localDueDate, 'from', finalDate, 'selectedDate:', selectedDate, 'selectedTime:', selectedTime);
    }
    console.log('[QuickAddForm] Checking recurring condition:', {
      isRecurring,
      recurringPatternType: recurringPattern.type,
      condition: isRecurring && recurringPattern.type !== 'none'
    });
    
    if (isRecurring && recurringPattern.type !== 'none') {
      console.log('[QuickAddForm] Setting up recurring reminder:', {
        recurringPattern,
        type: recurringPattern.type,
        repeatPattern: (recurringPattern as any).repeatPattern
      });

      reminderData.isRecurring = true;
      reminderData.recurringPattern = recurringPattern;
      
      // Convert to the expected format for the calendar
      reminderData.repeatPattern = recurringPattern.type; // Use the type directly
      reminderData.customInterval = recurringPattern.interval || 1;
      reminderData.recurringEndDate = recurringPattern.endDate || undefined;
      reminderData.recurringEndAfter = recurringPattern.endOccurrences;
      reminderData.repeatDays = recurringPattern.days;

      // Pass a valid Reminder object to generateOccurrences
      const reminderForOccurrences = {
        ...reminderData,
        id: 'mock',
        userId: 'mock',
        title: 'mock',
        type: 'reminder' as ReminderType,
        priority: ReminderPriority.MEDIUM,
        status: ReminderStatus.PENDING,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: finalDate,
        repeatPattern: recurringPattern.type as RepeatPattern, // Use the type directly
      };
      
      console.log('[QuickAddForm] Reminder for occurrences:', {
        isRecurring: reminderForOccurrences.isRecurring,
        repeatPattern: reminderForOccurrences.repeatPattern,
        dueDate: reminderForOccurrences.dueDate
      });

      const occurrences = generateOccurrences(reminderForOccurrences, 50);
      console.log('[QuickAddForm] Generated occurrences:', occurrences.length);
      
      // Map to { date, description } using reminder.title
      reminderData.occurrences = occurrences.map(occ => ({
        date: occ.date,
        description: occ.reminder?.title || '',
      }));
    }
    // Ensure all required fields are present
    const cleaned = cleanReminderForFirestore(reminderData as any) as ReminderData;
    cleaned.title = title.trim();
    
    console.log('[QuickAddForm] Final reminder data being returned:', {
      title: cleaned.title,
      isRecurring: cleaned.isRecurring,
      repeatPattern: cleaned.repeatPattern,
      recurringEndDate: cleaned.recurringEndDate,
      customInterval: cleaned.customInterval,
      recurringPattern: cleaned.recurringPattern
    });
    
    return cleaned;
  };

  return {
    // Form state
    title,
    setTitle,
    location,
    setLocation,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    customTimeValue,
    setCustomTimeValue,
    customDateValue,
    setCustomDateValue,
    isRecurring,
    setIsRecurring,
    recurringPattern,
    setRecurringPattern,
    timezone,
    setTimezone,
    assignedTo,
    setAssignedTo,
    notificationTimings,
    setNotificationTimings,

    // Sheet visibility
    showDateSheet,
    setShowDateSheet,
    showTimeSheet,
    setShowTimeSheet,
    showRepeatOptions,
    setShowRepeatOptions,
    showFamilyPicker,
    setShowFamilyPicker,
    showNotificationModal,
    setShowNotificationModal,
    showLocalDatePicker,
    setShowLocalDatePicker,
    showTimePicker,
    setShowTimePicker,

    // New full-page modal
    showDateTimeModal,
    setShowDateTimeModal,

    // Options
    dateOptions,
    getTimeOptions,

    // Utility functions
    getDateFromSelection,
    getAdjustedDateForTime,
    getTimeFromSelection,
    getRecurringDescriptionText,
    getAssignedMembersText,
    handleDateSelect,
    handleTimeSelect,
    handleFamilyMemberToggle,
    createReminderData,
  };
};

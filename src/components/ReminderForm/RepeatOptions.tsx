import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  Modal,
  Dimensions 
} from 'react-native';
import { CustomDateTimePickerModal } from './CustomDateTimePicker';
import { 
  Calendar, 
  Clock, 
  Repeat, 
  X, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Settings,
  Sparkles,
  Crown,
  Lock
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Fonts } from '../../constants/Fonts';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { DisabledFeature } from '../premium/DisabledFeature';
import { isProUser } from '../../services/featureFlags';
import { getRecurringDescription } from '../../design-system/reminders/utils/recurring-utils';


interface RepeatOptionsProps {
  isRecurring: boolean;
  onRecurringChange: (recurring: boolean) => void;
  repeatPattern: string;
  onRepeatPatternChange: (pattern: string) => void;
  customInterval: number;
  onCustomIntervalChange: (interval: number) => void;
  colors: any;
  repeatDays: number[];
  onRepeatDaysChange: (days: number[]) => void;
  customFrequencyType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  onCustomFrequencyTypeChange?: (frequency: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  recurringStartDate?: Date;
  onRecurringStartDateChange: (date: Date | undefined) => void;
  recurringEndDate?: Date;
  onRecurringEndDateChange: (date: Date | undefined) => void;
  recurringEndAfter?: number;
  onRecurringEndAfterChange?: (count: number | undefined) => void;
  onDatePickerOpen: (mode: 'start' | 'end') => void;
  showCustomInterval?: boolean;
  onShowCustomIntervalChange?: (show: boolean) => void;
  userTier?: 'free' | 'ascend' | 'apex' | 'immortal';
  onClose: () => void;
  visible: boolean;
}

// Premium feature limits
const PREMIUM_LIMITS = {
  free: {
    maxInterval: 365, // Temporarily increased for testing
    maxOccurrences: 999, // Temporarily increased for testing
    maxRepeatDays: 7, // Temporarily increased for testing
    customIntervals: true, // Temporarily enabled for testing
    advancedEndConditions: true // Temporarily enabled for testing
  },
  ascend: {
    maxInterval: 30,
    maxOccurrences: 50,
    maxRepeatDays: 3,
    customIntervals: true,
    advancedEndConditions: true
  },
  apex: {
    maxInterval: 365,
    maxOccurrences: 999,
    maxRepeatDays: 7,
    customIntervals: true,
    advancedEndConditions: true
  },
  immortal: {
    maxInterval: 365,
    maxOccurrences: 999,
    maxRepeatDays: 7,
    customIntervals: true,
    advancedEndConditions: true
  }
};

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', icon: CalendarDays, description: 'Every day', premium: false },
  { id: 'weekly', label: 'Weekly', icon: CalendarRange, description: 'Every week', premium: false },
  { id: 'monthly', label: 'Monthly', icon: CalendarIcon, description: 'Every month', premium: false },
  { id: 'yearly', label: 'Yearly', icon: CalendarCheck, description: 'Every year', premium: false },
  { id: 'weekdays', label: 'Weekdays', icon: Calendar, description: 'Mon-Fri only', premium: false },
  { id: 'custom', label: 'Custom', icon: Settings, description: 'Advanced patterns', premium: true }
];

const END_CONDITIONS = [
  { id: 'never', label: 'No end date', description: 'Repeat indefinitely', premium: false },
  { id: 'on_date', label: 'On date', description: 'End on specific date', premium: true },
  { id: 'after_occurrences', label: 'After occurrences', description: 'End after X times', premium: true }
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', fullLabel: 'Monday' },
  { id: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { id: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { id: 4, label: 'Thu', fullLabel: 'Thursday' },
  { id: 5, label: 'Fri', fullLabel: 'Friday' },
  { id: 6, label: 'Sat', fullLabel: 'Saturday' },
  { id: 0, label: 'Sun', fullLabel: 'Sunday' }
];

const MONTHLY_REPEAT_OPTIONS = [
  { id: 'day_of_month', label: 'Day of month', description: 'e.g., 15th of each month' },
  { id: 'day_of_week_in_month', label: 'Day of week', description: 'e.g., first Monday' }
];

export const RepeatOptions: React.FC<RepeatOptionsProps> = ({
  isRecurring,
  onRecurringChange,
  repeatPattern,
  onRepeatPatternChange,
  customInterval,
  onCustomIntervalChange,
  colors,
  repeatDays,
  onRepeatDaysChange,
  customFrequencyType,
  onCustomFrequencyTypeChange,
  recurringStartDate,
  onRecurringStartDateChange,
  recurringEndDate,
  onRecurringEndDateChange,
  recurringEndAfter,
  onRecurringEndAfterChange,
  onDatePickerOpen,
  showCustomInterval = false,
  onShowCustomIntervalChange,
  userTier = 'free',
  onClose,
  visible
}) => {
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const tierLimits = PREMIUM_LIMITS[userTier];
  const isPremiumUser = isProUser();

  // State management
  const [selectedFrequency, setSelectedFrequency] = useState(repeatPattern || 'daily');
  const [interval, setInterval] = useState(customInterval || 1);
  const [endCondition, setEndCondition] = useState<'never' | 'on_date' | 'after_occurrences'>(
    recurringEndAfter ? 'after_occurrences' : recurringEndDate ? 'on_date' : 'never'
  );
  const [endDate, setEndDate] = useState<Date | undefined>(recurringEndDate);
  const [occurrences, setOccurrences] = useState(recurringEndAfter || 5);
  const [selectedDays, setSelectedDays] = useState<number[]>(repeatDays);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showLocalDatePicker, setShowLocalDatePicker] = useState(false);

  const handleFrequencySelect = useCallback((frequency: string) => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.id === frequency);
    
    // Temporarily disable premium checks for testing
    // if (option?.premium && !isPremiumUser) {
    //   // Show premium upgrade prompt
    //   return;
    // }
    
    setSelectedFrequency(frequency);
    onRepeatPatternChange(frequency);
    
    // Reset custom settings when switching to non-custom patterns
    if (frequency !== 'custom') {
      setSelectedDays([]);
      onRepeatDaysChange([]);
      if (onCustomFrequencyTypeChange && ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
        onCustomFrequencyTypeChange(frequency as 'daily' | 'weekly' | 'monthly' | 'yearly');
      }
    }
  }, [onRepeatPatternChange, onCustomFrequencyTypeChange, onRepeatDaysChange]);

  const handleIntervalChange = useCallback((value: string) => {
    const newInterval = parseInt(value);
    if (!isNaN(newInterval) && newInterval > 0 && newInterval <= tierLimits.maxInterval) {
      setInterval(newInterval);
      onCustomIntervalChange(newInterval);
    }
  }, [tierLimits.maxInterval, onCustomIntervalChange]);

  const handleEndConditionSelect = useCallback((condition: typeof endCondition) => {
    const option = END_CONDITIONS.find(opt => opt.id === condition);
    
    // Temporarily disable premium checks for testing
    // if (option?.premium && !isPremiumUser) {
    //   // Show premium upgrade prompt
    //   return;
    // }
    
    setEndCondition(condition);
    if (condition === 'never') {
      onRecurringEndDateChange(undefined);
      if (onRecurringEndAfterChange) {
        onRecurringEndAfterChange(undefined);
      }
    } else if (condition === 'after_occurrences') {
      onRecurringEndDateChange(undefined);
      if (onRecurringEndAfterChange) {
        onRecurringEndAfterChange(occurrences);
      }
    } else if (condition === 'on_date') {
      if (onRecurringEndAfterChange) {
        onRecurringEndAfterChange(undefined);
      }
    }
  }, [onRecurringEndDateChange, onRecurringEndAfterChange, occurrences]);

  const handleDayToggle = useCallback((day: number) => {
    // Temporarily disable premium checks for testing
    // if (!tierLimits.customIntervals && selectedDays.length >= tierLimits.maxRepeatDays && !selectedDays.includes(day)) {
    //   Alert.alert(
    //     'Upgrade Required',
    //     `Free users can select up to ${tierLimits.maxRepeatDays} days. Upgrade to select more days.`
    //   );
    //   return;
    // }
    
    if (selectedDays.includes(day)) {
      const newDays = selectedDays.filter(d => d !== day);
      setSelectedDays(newDays);
      onRepeatDaysChange(newDays);
    } else {
      const newDays = [...selectedDays, day].sort();
      setSelectedDays(newDays);
      onRepeatDaysChange(newDays);
    }
  }, [selectedDays, onRepeatDaysChange]);

  const handleOccurrencesChange = useCallback((value: string) => {
    const newOccurrences = parseInt(value);
    if (!isNaN(newOccurrences) && newOccurrences > 0 && newOccurrences <= tierLimits.maxOccurrences) {
      setOccurrences(newOccurrences);
      if (onRecurringEndAfterChange) {
        onRecurringEndAfterChange(newOccurrences);
      }
    }
  }, [tierLimits.maxOccurrences, onRecurringEndAfterChange]);

  const handleDatePickerOpen = useCallback(() => {
    setShowLocalDatePicker(true);
  }, []);

  const handleDatePickerClose = useCallback(() => {
    setShowLocalDatePicker(false);
  }, []);

  const handleDatePickerSelect = useCallback((date: Date) => {
    setEndDate(date);
    onRecurringEndDateChange(date);
    setShowLocalDatePicker(false);
  }, [onRecurringEndDateChange]);

  const handleUpgradePress = useCallback(() => {
    Alert.alert(
      '🎉 Unlock Pro Features',
      'Upgrade to ClearCue Pro to access advanced recurring patterns, custom intervals, and more powerful scheduling options.',
      [
        { 
          text: 'Upgrade to Pro', 
          onPress: () => {
            // For testing, upgrade the user
            // In production, this would navigate to the upgrade flow
          },
          style: 'default'
        },
        { text: 'Maybe Later', style: 'cancel' }
      ]
    );
  }, []);



  const getSummaryText = useCallback(() => {
    const frequencyText = FREQUENCY_OPTIONS.find(f => f.id === selectedFrequency)?.label || 'Daily';
    const intervalText = interval === 1 ? '' : ` every ${interval} ${selectedFrequency.slice(0, -2)}s`;
    
    let summary = `Every ${frequencyText.toLowerCase()}${intervalText}`;
    
    if (selectedFrequency === 'weekly' && selectedDays.length > 0) {
      const dayLabels = selectedDays.map(day => 
        DAYS_OF_WEEK.find(d => d.id === day)?.label
      ).join(', ');
      summary += ` on ${dayLabels}`;
    }
    
    if (endCondition === 'on_date' && endDate) {
      summary += ` until ${formatDateForDisplay(endDate)}`;
    } else if (endCondition === 'after_occurrences') {
      summary += ` for ${occurrences} times`;
    }
    
    return summary;
  }, [selectedFrequency, interval, selectedDays, endCondition, endDate, occurrences]);

  const renderFrequencySelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Repeat Pattern</Text>
      <View style={styles.optionsGrid}>
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = selectedFrequency === option.id;
          // Temporarily disable premium restrictions for testing
          const isDisabled = false; // option.premium && !isPremiumUser;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.selectedOption,
                isDisabled && styles.disabledOption
              ]}
              onPress={() => handleFrequencySelect(option.id)}
              disabled={isDisabled}
            >
              <View style={styles.optionContent}>
                <option.icon 
                  size={20} 
                  color={isSelected ? colors.primary : isDisabled ? colors.textSecondary : colors.text} 
                />
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.selectedOptionText,
                  isDisabled && styles.disabledText
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  isDisabled && styles.disabledText
                ]}>
                  {option.description}
                </Text>
                {option.premium && !isPremiumUser && (
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color="#8B4513" fill="#8B4513" />
                    <Text style={styles.premiumText}>Pro</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderIntervalControl = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interval</Text>
      <View style={styles.intervalContainer}>
        <Text style={styles.intervalLabel}>Every</Text>
        <TextInput
          style={styles.intervalInput}
          value={interval.toString()}
          onChangeText={handleIntervalChange}
          keyboardType="numeric"
          maxLength={3}
          editable={tierLimits.customIntervals}
        />
        <Text style={styles.intervalLabel}>
          {selectedFrequency === 'daily' ? 'day(s)' :
           selectedFrequency === 'weekly' ? 'week(s)' :
           selectedFrequency === 'monthly' ? 'month(s)' :
           selectedFrequency === 'yearly' ? 'year(s)' : 'time(s)'}
        </Text>
        {/* Temporarily disabled premium upgrade prompt for testing */}
        {/* {!tierLimits.customIntervals && (
          <TouchableOpacity onPress={handleUpgradePress}>
            <View style={styles.premiumBadge}>
              <Crown size={12} color="#8B4513" fill="#8B4513" />
              <Text style={styles.premiumText}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );

  const renderCustomDaysSelection = () => {
    if (selectedFrequency !== 'custom') return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repeat on Days</Text>
        <View style={styles.daysGrid}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day.id);
            // Temporarily disable premium restrictions for testing
            const isDisabled = false; // !tierLimits.customIntervals && 
                              // selectedDays.length >= tierLimits.maxRepeatDays && 
                              // !isSelected;
            
            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  isSelected && styles.selectedDay,
                  isDisabled && styles.disabledDay
                ]}
                onPress={() => handleDayToggle(day.id)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.dayButtonText,
                  isSelected && styles.selectedDayText,
                  isDisabled && styles.disabledText
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedDays.length > 0 && (
          <Text style={styles.selectedDaysText}>
            Selected: {selectedDays.map(day => 
              DAYS_OF_WEEK.find(d => d.id === day)?.fullLabel
            ).join(', ')}
          </Text>
        )}
      </View>
    );
  };

  const renderEndCondition = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>End Condition</Text>
      <View style={styles.optionsGrid}>
        {END_CONDITIONS.map((option) => {
          const isSelected = endCondition === option.id;
          // Temporarily disable premium restrictions for testing
          const isDisabled = false; // option.premium && !isPremiumUser;
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.selectedOption,
                isDisabled && styles.disabledOption
              ]}
              onPress={() => handleEndConditionSelect(option.id as typeof endCondition)}
              disabled={isDisabled}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.selectedOptionText,
                  isDisabled && styles.disabledText
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionDescription,
                  isDisabled && styles.disabledText
                ]}>
                  {option.description}
                </Text>
                {/* Temporarily hide premium badges for testing */}
                {/* {option.premium && !isPremiumUser && (
                  <View style={styles.premiumBadge}>
                    <Crown size={12} color={colors.warning} />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                )} */}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {endCondition === 'on_date' && (
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            handleDatePickerOpen();
          }}
        >
          <Calendar size={16} color={colors.primary} />
          <Text style={styles.dateButtonText}>
            {endDate ? formatDateForDisplay(endDate) : 'Select end date'}
          </Text>
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      
      {endCondition === 'after_occurrences' && (
        <View style={styles.occurrencesContainer}>
          <Text style={styles.occurrencesLabel}>End after</Text>
          <TextInput
            style={styles.occurrencesInput}
            value={occurrences.toString()}
            onChangeText={handleOccurrencesChange}
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.occurrencesLabel}>occurrences</Text>
        </View>
      )}
    </View>
  );

  const renderPatternPreview = () => {
    const mockReminder = {
      id: 'preview',
      userId: 'preview',
      title: 'Preview',
      type: 'task' as const,
      priority: 'medium' as const,
      status: 'pending' as const,
      isRecurring: true,
      repeatPattern: selectedFrequency,
      customInterval: interval,
      repeatDays: selectedDays,
      recurringEndDate: endCondition === 'on_date' ? endDate : undefined,
      recurringEndAfter: endCondition === 'after_occurrences' ? occurrences : undefined,
      timezone: 'America/New_York', // Default for preview
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const description = getRecurringDescription(mockReminder as any);
    
    return (
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Pattern Preview</Text>
        <View style={styles.previewCard}>
          <Repeat size={16} color={colors.primary} />
          <Text style={styles.previewText}>{description}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Repeat Schedule</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Repeat size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.summaryText}>{getSummaryText()}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderFrequencySelection()}
          {renderIntervalControl()}
          {renderCustomDaysSelection()}
          {renderEndCondition()}
          {renderPatternPreview()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => {
              onRecurringChange(true);
              onClose();
            }}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Local Date Picker */}
      <CustomDateTimePickerModal
        visible={showLocalDatePicker}
        onClose={handleDatePickerClose}
        onConfirm={handleDatePickerSelect}
        initialDate={endDate || new Date()}
        mode="date"
        colors={colors}
      />
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  summaryText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 8,
  },
  optionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  disabledOption: {
    borderColor: colors.textSecondary,
    backgroundColor: colors.surface,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  optionDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 12,
    marginTop: 2,
  },
  selectedOptionText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  intervalInput: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    minWidth: 40,
    textAlign: 'center',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 11,
    color: '#8B4513',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedDayText: {
    color: colors.surface,
  },
  disabledDay: {
    backgroundColor: colors.surface,
    borderColor: colors.textSecondary,
  },
  selectedDaysText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  dateButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  occurrencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  occurrencesLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginRight: 12,
  },
  occurrencesInput: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  previewSection: {
    marginTop: 24,
  },
  previewTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
  },
  doneButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.surface,
  },
});

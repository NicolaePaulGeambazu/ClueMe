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
  onDatePickerOpen: (mode: 'start' | 'end') => void;
  showCustomInterval?: boolean;
  onShowCustomIntervalChange?: (show: boolean) => void;
  userTier?: 'free' | 'ascend' | 'apex' | 'immortal';
  onClose: () => void;
  visible: boolean;
}

// Tier-based feature flags - temporarily allowing all features for testing
const TIER_FEATURES = {
  free: {
    maxInterval: 365,
    maxOccurrences: 999,
    advancedOptions: true,
    aiOptimization: true,
    biomarkerIntegration: true
  },
  ascend: {
    maxInterval: 365,
    maxOccurrences: 999,
    advancedOptions: true,
    aiOptimization: true,
    biomarkerIntegration: true
  },
  apex: {
    maxInterval: 365,
    maxOccurrences: 999,
    advancedOptions: true,
    aiOptimization: true,
    biomarkerIntegration: true
  },
  immortal: {
    maxInterval: 365,
    maxOccurrences: 999,
    advancedOptions: true,
    aiOptimization: true,
    biomarkerIntegration: true
  }
};

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', icon: CalendarDays, description: 'Every day' },
  { id: 'weekly', label: 'Weekly', icon: CalendarRange, description: 'Every week' },
  { id: 'monthly', label: 'Monthly', icon: CalendarIcon, description: 'Every month' },
  { id: 'yearly', label: 'Yearly', icon: CalendarCheck, description: 'Every year' }
];

const END_CONDITIONS = [
  { id: 'never', label: 'No end date', description: 'Repeat indefinitely' },
  { id: 'on_date', label: 'On date', description: 'End on specific date' },
  { id: 'after_occurrences', label: 'After occurrences', description: 'End after X times' }
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
  onDatePickerOpen,
  showCustomInterval = false,
  onShowCustomIntervalChange,
  userTier = 'free',
  onClose,
  visible
}) => {
  const { t } = useTranslation();
  const styles = createStyles(colors);
  const tierFeatures = TIER_FEATURES[userTier];

  // State management
  const [selectedFrequency, setSelectedFrequency] = useState(repeatPattern || 'daily');
  const [interval, setInterval] = useState(customInterval || 1);
  const [endCondition, setEndCondition] = useState<'never' | 'on_date' | 'after_occurrences'>('never');
  const [endDate, setEndDate] = useState<Date | undefined>(recurringEndDate);
  const [occurrences, setOccurrences] = useState(5);
  const [selectedDays, setSelectedDays] = useState<number[]>(repeatDays);
  const [monthlyRepeatBy, setMonthlyRepeatBy] = useState<'day_of_month' | 'day_of_week_in_month'>('day_of_month');
  const [aiOptimization, setAiOptimization] = useState(userTier === 'immortal');
  const [biomarkerIntegration, setBiomarkerIntegration] = useState(userTier === 'immortal');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('end');

  const handleFrequencySelect = useCallback((frequency: string) => {
    setSelectedFrequency(frequency);
    onRepeatPatternChange(frequency);
    // Also save the custom frequency type for custom patterns
    if (onCustomFrequencyTypeChange && ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      onCustomFrequencyTypeChange(frequency as 'daily' | 'weekly' | 'monthly' | 'yearly');
    }
  }, [onRepeatPatternChange, onCustomFrequencyTypeChange]);

  const handleIntervalChange = useCallback((value: string) => {
    const newInterval = parseInt(value);
    if (!isNaN(newInterval) && newInterval > 0 && newInterval <= tierFeatures.maxInterval) {
      setInterval(newInterval);
      onCustomIntervalChange(newInterval);
    }
  }, [tierFeatures.maxInterval, onCustomIntervalChange]);

  const handleEndConditionSelect = useCallback((condition: typeof endCondition) => {
    setEndCondition(condition);
    if (condition === 'never') {
      onRecurringEndDateChange(undefined);
    }
  }, [onRecurringEndDateChange]);

  const handleDayToggle = useCallback((day: number) => {
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

  const handleUpgradePress = useCallback(() => {
    Alert.alert(
      'Upgrade to Unlock',
      'This feature is available in higher tiers. Upgrade to access advanced repeat scheduling options.',
      [
        { text: 'Learn More', onPress: () => console.log('Navigate to upgrade') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, []);

  const handleDatePickerOpen = useCallback((mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  }, []);

  const handleDatePickerConfirm = useCallback((date: Date) => {
    if (datePickerMode === 'end') {
      setEndDate(date);
      onRecurringEndDateChange(date);
    } else {
      onRecurringStartDateChange(date);
    }
    setShowDatePicker(false);
  }, [datePickerMode, onRecurringEndDateChange, onRecurringStartDateChange]);

  const handleDatePickerCancel = useCallback(() => {
    setShowDatePicker(false);
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
      <Text style={styles.sectionTitle}>Frequency</Text>
      <View style={styles.frequencyList}>
        {FREQUENCY_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedFrequency === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.frequencyOption, isSelected && styles.frequencyOptionSelected]}
              onPress={() => handleFrequencySelect(option.id)}
            >
              <View style={styles.frequencyOptionContent}>
                <IconComponent 
                  size={24} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                  strokeWidth={2} 
                />
                <View style={styles.frequencyTextContainer}>
                  <Text style={[styles.frequencyLabel, isSelected && styles.frequencyLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.frequencyDescription, isSelected && styles.frequencyDescriptionSelected]}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderIntervalControl = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Repeat Every</Text>
      <View style={styles.intervalContainer}>
        <View style={styles.intervalInputContainer}>
          <TextInput
            style={[styles.intervalInput, { color: colors.text }]}
            value={interval.toString()}
            onChangeText={handleIntervalChange}
            keyboardType="numeric"
            editable={true}
          />
          <Text style={styles.intervalUnit}>
            {selectedFrequency === 'daily' ? 'day(s)' :
             selectedFrequency === 'weekly' ? 'week(s)' :
             selectedFrequency === 'monthly' ? 'month(s)' : 'year(s)'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEndCondition = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>End Condition</Text>
      <View style={styles.endConditionContainer}>
        {END_CONDITIONS.map((condition) => {
          const isSelected = endCondition === condition.id;
          
          return (
            <TouchableOpacity
              key={condition.id}
              style={[styles.endConditionOption, isSelected && styles.endConditionOptionSelected]}
              onPress={() => handleEndConditionSelect(condition.id as typeof endCondition)}
            >
              <View style={styles.endConditionContent}>
                <Text style={[styles.endConditionLabel, isSelected && styles.endConditionLabelSelected]}>
                  {condition.label}
                </Text>
                <Text style={[styles.endConditionDescription, isSelected && styles.endConditionDescriptionSelected]}>
                  {condition.description}
                </Text>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {endCondition === 'on_date' && (
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => handleDatePickerOpen('end')}
        >
          <Calendar size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.datePickerText}>
            {endDate ? formatDateForDisplay(endDate) : 'Select end date'}
          </Text>
          <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      )}
      
      {endCondition === 'after_occurrences' && (
        <View style={styles.occurrencesContainer}>
          <Text style={styles.occurrencesLabel}>Number of occurrences:</Text>
          <TextInput
            style={[styles.occurrencesInput, { color: colors.text }]}
            value={occurrences.toString()}
            onChangeText={(value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num > 0 && num <= tierFeatures.maxOccurrences) {
                setOccurrences(num);
              }
            }}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
      )}
    </View>
  );

  const renderAdvancedOptions = () => {
    if (!tierFeatures.advancedOptions) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.advancedHeader}
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <Settings size={20} color={colors.textSecondary} strokeWidth={2} />
          <Text style={styles.advancedTitle}>Advanced Options</Text>
          <ChevronRight 
            size={20} 
            color={colors.textSecondary} 
            strokeWidth={2}
            style={[styles.chevron, showAdvancedOptions && styles.chevronRotated]}
          />
        </TouchableOpacity>
        
        {showAdvancedOptions && (
          <View style={styles.advancedContent}>
                                      {selectedFrequency === 'weekly' && (
               <View>
                 <Text style={styles.advancedSectionTitle}>Days of Week</Text>
                 <View style={styles.daysGrid}>
                   {DAYS_OF_WEEK.map((day) => (
                     <TouchableOpacity
                       key={day.id}
                       style={[
                         styles.dayOption,
                         selectedDays.includes(day.id) && styles.dayOptionSelected
                       ]}
                       onPress={() => handleDayToggle(day.id)}
                     >
                       <Text style={[
                         styles.dayLabel,
                         selectedDays.includes(day.id) && styles.dayLabelSelected
                       ]}>
                         {day.label}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             )}
             
             {selectedFrequency === 'monthly' && (
               <View>
                 <Text style={styles.advancedSectionTitle}>Monthly Repeat By</Text>
                 {MONTHLY_REPEAT_OPTIONS.map((option) => (
                   <TouchableOpacity
                     key={option.id}
                     style={[
                       styles.monthlyOption,
                       monthlyRepeatBy === option.id && styles.monthlyOptionSelected
                     ]}
                     onPress={() => setMonthlyRepeatBy(option.id as 'day_of_month' | 'day_of_week_in_month')}
                   >
                     <Text style={[
                       styles.monthlyOptionLabel,
                       monthlyRepeatBy === option.id && styles.monthlyOptionLabelSelected
                     ]}>
                       {option.label}
                     </Text>
                     <Text style={[
                       styles.monthlyOptionDescription,
                       monthlyRepeatBy === option.id && styles.monthlyOptionDescriptionSelected
                     ]}>
                       {option.description}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
             )}
          </View>
        )}
      </View>
    );
  };

  const renderAIOptions = () => {
    if (!tierFeatures.aiOptimization) return null;

    return (
      <View style={styles.section}>
        <View style={styles.aiHeader}>
          <Sparkles size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.aiTitle}>AI Optimization</Text>
          {userTier === 'immortal' && (
            <Crown size={16} color={colors.primary} strokeWidth={2} />
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.aiToggle, aiOptimization && styles.aiToggleActive]}
          onPress={() => setAiOptimization(!aiOptimization)}
        >
          <View style={[styles.aiToggleDot, aiOptimization && styles.aiToggleDotActive]} />
        </TouchableOpacity>
        
        <Text style={styles.aiDescription}>
          {userTier === 'apex' 
            ? 'AI will suggest optimal repeat patterns based on your progress and readiness.'
            : 'AI will automatically adjust repeat frequency based on your biometrics and goals.'}
        </Text>
        
        {userTier === 'immortal' && (
          <TouchableOpacity
            style={[styles.biomarkerToggle, biomarkerIntegration && styles.biomarkerToggleActive]}
            onPress={() => setBiomarkerIntegration(!biomarkerIntegration)}
          >
            <View style={styles.biomarkerContent}>
              <Text style={styles.biomarkerLabel}>Biomarker Integration</Text>
              <Text style={styles.biomarkerDescription}>
                Include blood panel and genomic data for ultra-precise scheduling
              </Text>
            </View>
            <View style={[styles.biomarkerToggleDot, biomarkerIntegration && styles.biomarkerToggleDotActive]} />
          </TouchableOpacity>
        )}
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
          {renderEndCondition()}
          {renderAdvancedOptions()}
          {renderAIOptions()}
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

      {/* Custom Date Picker Modal */}
      <CustomDateTimePickerModal
        visible={showDatePicker}
        onClose={handleDatePickerCancel}
        onConfirm={handleDatePickerConfirm}
        initialDate={datePickerMode === 'end' ? (endDate || new Date()) : (recurringStartDate || new Date())}
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
  frequencyList: {
    gap: 8,
  },
  frequencyOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frequencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  frequencyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  frequencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  frequencyLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  frequencyLabelSelected: {
    color: colors.primary,
  },
  frequencyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  frequencyDescriptionSelected: {
    color: colors.primary + '80',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
  },
  intervalInput: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    minWidth: 40,
    textAlign: 'center',
  },
  intervalUnit: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  endConditionContainer: {
    gap: 8,
  },
  endConditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  endConditionOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  endConditionContent: {
    flex: 1,
  },
  endConditionLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
  },
  endConditionLabelSelected: {
    color: colors.primary,
  },
  endConditionDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  endConditionDescriptionSelected: {
    color: colors.primary + '80',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  datePickerText: {
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
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  advancedTitle: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
  advancedContent: {
    marginTop: 12,
    gap: 16,
  },
  advancedSectionTitle: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  dayLabelSelected: {
    color: colors.surface,
  },
  monthlyOptions: {
    gap: 8,
  },
  monthlyOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  monthlyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  monthlyOptionLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
  },
  monthlyOptionLabelSelected: {
    color: colors.primary,
  },
  monthlyOptionDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  monthlyOptionDescriptionSelected: {
    color: colors.primary + '80',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  aiToggle: {
    width: 50,
    height: 28,
    backgroundColor: colors.textTertiary,
    borderRadius: 14,
    padding: 2,
    marginBottom: 8,
  },
  aiToggleActive: {
    backgroundColor: colors.primary,
  },
  aiToggleDot: {
    width: 24,
    height: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  aiToggleDotActive: {
    transform: [{ translateX: 22 }],
  },
  aiDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  biomarkerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  biomarkerToggleActive: {
    backgroundColor: colors.primary + '10',
  },
  biomarkerContent: {
    flex: 1,
  },
  biomarkerLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.text,
  },
  biomarkerDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  biomarkerToggleDot: {
    width: 20,
    height: 20,
    backgroundColor: colors.textTertiary,
    borderRadius: 10,
  },
  biomarkerToggleDotActive: {
    backgroundColor: colors.primary,
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

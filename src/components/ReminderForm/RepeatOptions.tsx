import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Calendar, Clock, Repeat, X, ChevronRight } from 'lucide-react-native';
import { Fonts } from '../../constants/Fonts';

interface RepeatOptionsProps {
  isRecurring: boolean;
  onRecurringChange: (recurring: boolean) => void;
  repeatPattern: string;
  onRepeatPatternChange: (pattern: string) => void;
  customInterval: number;
  onCustomIntervalChange: (interval: number) => void;
  colors: any;
}

const REPEAT_PRESETS = [
  {
    id: 'daily',
    label: 'Daily',
    description: 'Every day',
    icon: '📅',
  },
  {
    id: 'weekdays',
    label: 'Weekdays',
    description: 'Monday to Friday',
    icon: '💼',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Every week',
    icon: '📆',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Every month',
    icon: '🗓️',
  },
  {
    id: 'yearly',
    label: 'Yearly',
    description: 'Every year',
    icon: '🎉',
  },
  {
    id: 'first_monday',
    label: 'First Monday',
    description: 'First Monday of each month',
    icon: '📋',
  },
  {
    id: 'last_friday',
    label: 'Last Friday',
    description: 'Last Friday of each month',
    icon: '📋',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set custom interval',
    icon: '⚙️',
  },
];

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 2, label: '2 days' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 90, label: '3 months' },
  { value: 365, label: '1 year' },
];

export const RepeatOptions: React.FC<RepeatOptionsProps> = ({
  isRecurring,
  onRecurringChange,
  repeatPattern,
  onRepeatPatternChange,
  customInterval,
  onCustomIntervalChange,
  colors
}) => {
  const [showCustomInterval, setShowCustomInterval] = useState(false);
  const styles = createStyles(colors);

  const handlePatternSelect = (pattern: string) => {
    if (pattern === 'custom') {
      setShowCustomInterval(true);
    } else {
      setShowCustomInterval(false);
      onRepeatPatternChange(pattern);
    }
  };

  const handleCustomIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval > 0) {
      onCustomIntervalChange(interval);
    }
  };

  const getPatternDescription = (pattern: string) => {
    const preset = REPEAT_PRESETS.find(p => p.id === pattern);
    return preset ? preset.description : 'Custom interval';
  };

  const getSmartNudgeText = () => {
    if (!isRecurring) return null;
    
    switch (repeatPattern) {
      case 'daily':
        return "If missed today, suggest tomorrow";
      case 'weekdays':
        return "If missed on Friday, suggest next Monday";
      case 'weekly':
        return "If missed this week, suggest next week";
      case 'monthly':
        return "If missed this month, suggest next month";
      default:
        return "Smart nudges enabled for custom patterns";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Repeat size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.headerTitle}>Repeat Options</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, isRecurring && styles.toggleButtonActive]}
          onPress={() => onRecurringChange(!isRecurring)}
        >
          <View style={[styles.toggleDot, isRecurring && styles.toggleDotActive]} />
        </TouchableOpacity>
      </View>

      {isRecurring && (
        <View style={styles.content}>
          <Text style={styles.sectionLabel}>Repeat Pattern</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {REPEAT_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetOption,
                  repeatPattern === preset.id && styles.presetOptionSelected
                ]}
                onPress={() => handlePatternSelect(preset.id)}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={[
                  styles.presetLabel,
                  repeatPattern === preset.id && styles.presetLabelSelected
                ]}>
                  {preset.label}
                </Text>
                <Text style={[
                  styles.presetDescription,
                  repeatPattern === preset.id && styles.presetDescriptionSelected
                ]}>
                  {preset.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {showCustomInterval && (
            <View style={styles.customIntervalContainer}>
              <Text style={styles.sectionLabel}>Custom Interval</Text>
              <View style={styles.intervalInputContainer}>
                <TextInput
                  style={styles.intervalInput}
                  placeholder="Enter number of days"
                  value={customInterval.toString()}
                  onChangeText={handleCustomIntervalChange}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.intervalUnit}>days</Text>
              </View>
              
              <Text style={styles.quickOptionsLabel}>Quick options:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickOptionsContainer}
              >
                {INTERVAL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.quickOption,
                      customInterval === option.value && styles.quickOptionSelected
                    ]}
                    onPress={() => onCustomIntervalChange(option.value)}
                  >
                    <Text style={[
                      styles.quickOptionText,
                      customInterval === option.value && styles.quickOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {repeatPattern && !showCustomInterval && (
            <View style={styles.selectedPattern}>
              <Text style={styles.selectedPatternText}>
                {getPatternDescription(repeatPattern)}
              </Text>
            </View>
          )}

          {getSmartNudgeText() && (
            <View style={styles.smartNudgeContainer}>
              <Clock size={16} color={colors.success} strokeWidth={2} />
              <Text style={styles.smartNudgeText}>{getSmartNudgeText()}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  toggleDotActive: {
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 20 }],
  },
  content: {
    gap: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  presetsContainer: {
    gap: 12,
    paddingRight: 16,
  },
  presetOption: {
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  presetIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  presetLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  presetLabelSelected: {
    color: colors.primary,
    fontFamily: Fonts.text.semibold,
  },
  presetDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  presetDescriptionSelected: {
    color: colors.primary,
  },
  customIntervalContainer: {
    gap: 12,
  },
  intervalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  intervalInput: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  intervalUnit: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  quickOptionsLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickOptionsContainer: {
    gap: 8,
  },
  quickOption: {
    backgroundColor: colors.borderLight,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  quickOptionText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.text,
  },
  quickOptionTextSelected: {
    color: colors.primary,
  },
  selectedPattern: {
    backgroundColor: colors.success + '15',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  selectedPatternText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
  },
  smartNudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success + '20',
  },
  smartNudgeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.success,
    marginLeft: 8,
    flex: 1,
  },
}); 
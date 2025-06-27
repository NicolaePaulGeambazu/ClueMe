import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Calendar, Clock, Repeat, X, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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
    icon: '📅',
  },
  {
    id: 'weekdays',
    icon: '💼',
  },
  {
    id: 'weekly',
    icon: '📆',
  },
  {
    id: 'monthly',
    icon: '🗓️',
  },
  {
    id: 'yearly',
    icon: '🎉',
  },
  {
    id: 'first_monday',
    icon: '📋',
  },
  {
    id: 'last_friday',
    icon: '📋',
  },
  {
    id: 'custom',
    icon: '⚙️',
  },
];

const INTERVAL_OPTIONS = [
  { value: 1, key: '1day' },
  { value: 2, key: '2days' },
  { value: 3, key: '3days' },
  { value: 7, key: '1week' },
  { value: 14, key: '2weeks' },
  { value: 30, key: '1month' },
  { value: 90, key: '3months' },
  { value: 365, key: '1year' },
];

export const RepeatOptions: React.FC<RepeatOptionsProps> = ({
  isRecurring,
  onRecurringChange,
  repeatPattern,
  onRepeatPatternChange,
  customInterval,
  onCustomIntervalChange,
  colors,
}) => {
  const { t } = useTranslation();
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
    const patternKey = pattern === 'first_monday' ? 'firstMonday' :
                      pattern === 'last_friday' ? 'lastFriday' : pattern;
    return t(`add.recurringOptions.patterns.${patternKey}Description`);
  };

  const getSmartNudgeText = () => {
    if (!isRecurring) {return null;}

    const patternKey = repeatPattern === 'first_monday' ? 'firstMonday' :
                      repeatPattern === 'last_friday' ? 'lastFriday' : repeatPattern;
    return t(`add.recurringOptions.smartNudges.${patternKey}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Repeat size={20} color={colors.primary} strokeWidth={2} />
          <Text style={styles.headerTitle}>{t('add.recurringOptions.title')}</Text>
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
          <Text style={styles.sectionLabel}>{t('add.recurringOptions.pattern')}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            {REPEAT_PRESETS.map((preset) => {
              const patternKey = preset.id === 'first_monday' ? 'firstMonday' :
                                preset.id === 'last_friday' ? 'lastFriday' : preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetOption,
                    repeatPattern === preset.id && styles.presetOptionSelected,
                  ]}
                  onPress={() => handlePatternSelect(preset.id)}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <Text style={[
                    styles.presetLabel,
                    repeatPattern === preset.id && styles.presetLabelSelected,
                  ]}>
                    {t(`add.recurringOptions.patterns.${patternKey}`)}
                  </Text>
                  <Text style={[
                    styles.presetDescription,
                    repeatPattern === preset.id && styles.presetDescriptionSelected,
                  ]}>
                    {getPatternDescription(preset.id)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {showCustomInterval && (
            <View style={styles.customIntervalContainer}>
              <Text style={styles.sectionLabel}>{t('add.recurringOptions.customInterval')}</Text>
              <View style={styles.intervalInputContainer}>
                <TextInput
                  style={styles.intervalInput}
                  placeholder={t('add.recurringOptions.intervalPlaceholder')}
                  value={customInterval.toString()}
                  onChangeText={handleCustomIntervalChange}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.intervalUnit}>{t('add.recurringOptions.days')}</Text>
              </View>

              <Text style={styles.quickOptionsLabel}>{t('add.recurringOptions.quickOptions')}</Text>
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
                      customInterval === option.value && styles.quickOptionSelected,
                    ]}
                    onPress={() => onCustomIntervalChange(option.value)}
                  >
                    <Text style={[
                      styles.quickOptionText,
                      customInterval === option.value && styles.quickOptionTextSelected,
                    ]}>
                      {t(`add.recurringOptions.intervals.${option.key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {getSmartNudgeText() && (
            <View style={styles.smartNudgeContainer}>
              <Text style={styles.smartNudgeIcon}>💡</Text>
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
  smartNudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.success + '20',
  },
  smartNudgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  smartNudgeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.success,
    flex: 1,
  },
});

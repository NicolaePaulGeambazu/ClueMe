import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Bell, Plus, X, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { NotificationTiming, DEFAULT_NOTIFICATION_TIMINGS } from '../../services/notificationService';
import { DisabledFeature } from '../premium/DisabledFeature';
import { canUseMultipleNotifications, getMaxNotificationTimes } from '../../services/featureFlags';

interface NotificationTimingSelectorProps {
  hasNotification: boolean;
  onNotificationChange: (enabled: boolean) => void;
  notificationTimings: NotificationTiming[];
  onNotificationTimingsChange: (timings: NotificationTiming[]) => void;
  colors: typeof Colors.light;
  showTimingSelector?: boolean;
  onShowTimingSelectorChange?: (show: boolean) => void;
  onUpgradePress?: () => void;
}

export const NotificationTimingSelector: React.FC<NotificationTimingSelectorProps> = ({
  hasNotification,
  onNotificationChange,
  notificationTimings,
  onNotificationTimingsChange,
  colors,
  showTimingSelector = false,
  onShowTimingSelectorChange,
  onUpgradePress,
}) => {
  const { t } = useTranslation();

  const addTiming = (timing: NotificationTiming) => {
    const exists = notificationTimings.some(
      t => t.type === timing.type && t.value === timing.value
    );
    if (!exists) {
      // Check if user can add more notifications
      const maxNotifications = getMaxNotificationTimes();
      if (notificationTimings.length >= maxNotifications) {
        onUpgradePress?.();
        return;
      }
      onNotificationTimingsChange([...notificationTimings, timing]);
    }
  };

  const removeTiming = (index: number) => {
    const newTimings = notificationTimings.filter((_, i) => i !== index);
    onNotificationTimingsChange(newTimings);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Main notification toggle */}
      <View style={styles.switchRow}>
        <View style={styles.switchLabelContainer}>
          <Bell size={20} color={colors.primary} />
          <Text style={styles.switchLabel}>{t('add.notifications')}</Text>
        </View>
        <Switch
          value={hasNotification}
          onValueChange={onNotificationChange}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={hasNotification ? colors.primary : colors.textSecondary}
        />
      </View>

      {/* Notification timing options */}
      {hasNotification && (
        <View style={styles.timingContainer}>
          <View style={styles.timingHeader}>
            <Text style={styles.timingLabel}>{t('add.notificationTiming')}</Text>
            <TouchableOpacity
              style={styles.addTimingButton}
              onPress={() => onShowTimingSelectorChange?.(!showTimingSelector)}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Selected timings */}
          {notificationTimings.length > 0 && (
            <View style={styles.selectedTimings}>
              {notificationTimings.map((timing, index) => (
                <View key={`${timing.type}-${timing.value}`} style={styles.timingChip}>
                  <Text style={styles.timingChipText}>{timing.label}</Text>
                  <TouchableOpacity
                    onPress={() => removeTiming(index)}
                    style={styles.removeTimingButton}
                  >
                    <X size={12} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Default timing options */}
          {showTimingSelector && (
            <View style={styles.timingOptions}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {DEFAULT_NOTIFICATION_TIMINGS.map((timing) => {
                  const isSelected = notificationTimings.some(
                    t => t.type === timing.type && t.value === timing.value
                  );

                  return (
                    <TouchableOpacity
                      key={`${timing.type}-${timing.value}`}
                      style={[
                        styles.timingOption,
                        isSelected && styles.timingOptionSelected,
                      ]}
                      onPress={() => addTiming(timing)}
                      disabled={isSelected}
                    >
                      <Text style={[
                        styles.timingOptionText,
                        isSelected && styles.timingOptionTextSelected,
                      ]}>
                        {timing.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {/* Premium features */}
              {!canUseMultipleNotifications() && (
                <View style={styles.premiumSection}>
                  <DisabledFeature
                    featureName={t('premium.features.multipleNotifications.title')}
                    onUpgradePress={onUpgradePress || (() => {})}
                    colors={colors}
                    size="small"
                    variant="subtle"
                  />
                </View>
              )}
            </View>
          )}

          {/* Help text */}
          {notificationTimings.length === 0 && hasNotification && (
            <Text style={styles.helpText}>
              {t('add.notificationTimingHelp')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.text,
  },
  timingContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timingLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.textSecondary,
  },
  addTimingButton: {
    padding: 4,
  },
  selectedTimings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  timingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  timingChipText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.primary,
  },
  removeTimingButton: {
    padding: 2,
  },
  timingOptions: {
    maxHeight: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timingOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  timingOptionText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.text,
  },
  timingOptionTextSelected: {
    color: colors.primary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.background,
  },
  helpText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  premiumSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

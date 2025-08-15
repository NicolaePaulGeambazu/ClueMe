import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Plus, AlertTriangle } from 'lucide-react-native';
import { NotificationTiming, NotificationType } from '../../design-system/reminders/types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

interface NotificationTimingSelectorProps {
  value: NotificationTiming[];
  onChange: (timings: NotificationTiming[]) => void;
  disabled?: boolean;
}

export default function NotificationTimingSelector({
  value,
  onChange,
  disabled = false,
}: NotificationTimingSelectorProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];

  const addDefaultTiming = () => {
    const newTiming: NotificationTiming = {
      type: NotificationType.BEFORE,
      value: 15,
      label: '15 minutes before',
      labelKey: 'notifications.15minBefore',
    };
    onChange([...value, newTiming]);
  };

  const addEscalatingNotifications = () => {
    const escalatingTimings: NotificationTiming[] = [
      {
        type: NotificationType.BEFORE,
        value: 30,
        label: '30 minutes before (Gentle)',
        labelKey: 'notifications.escalating.gentle',
      },
      {
        type: NotificationType.BEFORE,
        value: 15,
        label: '15 minutes before (Medium)',
        labelKey: 'notifications.escalating.medium',
      },
      {
        type: NotificationType.BEFORE,
        value: 5,
        label: '5 minutes before (Urgent)',
        labelKey: 'notifications.escalating.urgent',
      },
    ];
    onChange([...value, ...escalatingTimings]);
  };

  const removeTiming = (index: number) => {
    const updatedTimings = value.filter((_, i) => i !== index);
    onChange(updatedTimings);
  };

  const getTimingLabel = (timing: NotificationTiming) => {
    if (timing.labelKey) {
      return t(timing.labelKey);
    }
    return timing.label || `${timing.value} minutes ${timing.type === 'before' ? 'before' : timing.type === 'after' ? 'after' : 'at'}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Bell size={16} color={colors.primary} />
        <Text style={[styles.label, { color: colors.text }]}>{t('notifications.schedule')}</Text>
      </View>

      {value.length > 0 ? (
        <View style={styles.timingsList}>
          {value.map((timing, index) => (
            <View key={index} style={[styles.timingItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.timingLabel, { color: colors.text }]}>{getTimingLabel(timing)}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeTiming(index)}
                disabled={disabled}
              >
                <Text style={[styles.removeText, { color: colors.error }]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.noTimingsText, { color: colors.textSecondary }]}>{t('notifications.noTimings')}</Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }, disabled && styles.disabled]}
          onPress={addDefaultTiming}
          disabled={disabled}
        >
          <Plus size={16} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>{t('notifications.add15min')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.escalatingButton, { backgroundColor: colors.warning, borderColor: colors.warning }, disabled && styles.disabled]}
          onPress={addEscalatingNotifications}
          disabled={disabled}
        >
          <AlertTriangle size={16} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>{t('notifications.addEscalating')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  timingsList: {
    marginTop: 8,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  timingLabel: {
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noTimingsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  escalatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

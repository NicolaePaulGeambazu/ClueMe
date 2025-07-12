import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { NotificationType } from '../../design-system/reminders/types';

interface NotificationTimingOption {
  type: NotificationType;
  value: number;
  label: string;
  description: string;
}

interface NotificationTimingModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (timings: NotificationTimingOption[]) => void;
  currentTimings: NotificationTimingOption[];
}

const notificationOptions: NotificationTimingOption[] = [
  {
    type: NotificationType.BEFORE,
    value: 0,
    label: 'Just in time',
    description: 'Right when the reminder is due'
  },
  {
    type: NotificationType.BEFORE,
    value: 5,
    label: '5 minutes before',
    description: 'Quick heads up'
  },
  {
    type: NotificationType.BEFORE,
    value: 15,
    label: '15 minutes before',
    description: 'Standard reminder'
  },
  {
    type: NotificationType.BEFORE,
    value: 30,
    label: '30 minutes before',
    description: 'Early warning'
  },
  {
    type: NotificationType.BEFORE,
    value: 60,
    label: '1 hour before',
    description: 'Well prepared'
  },
  {
    type: NotificationType.BEFORE,
    value: 120,
    label: '2 hours before',
    description: 'Plenty of time'
  },
  {
    type: NotificationType.BEFORE,
    value: 1440,
    label: '1 day before',
    description: 'Day ahead'
  },
  {
    type: NotificationType.BEFORE,
    value: 2880,
    label: '2 days before',
    description: 'Weekend planning'
  }
];

export default function NotificationTimingModal({
  visible,
  onClose,
  onSelect,
  currentTimings,
}: NotificationTimingModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Local state for multi-selection
  const [selectedTimings, setSelectedTimings] = useState<NotificationTimingOption[]>([]);

  useEffect(() => {
    setSelectedTimings(currentTimings);
  }, [currentTimings, visible]);

  const toggleSelect = (option: NotificationTimingOption) => {
    setSelectedTimings((prev) => {
      const exists = prev.some(t => t.value === option.value);
      if (exists) {
        return prev.filter(t => t.value !== option.value);
      } else {
        return [...prev, option];
      }
    });
  };

  const isSelected = (option: NotificationTimingOption) => {
    return selectedTimings.some(timing => timing.value === option.value);
  };

  const handleDone = () => {
    onSelect(selectedTimings);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Notification Timing</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose when you'd like to be notified</Text>
            {notificationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  { 
                    borderColor: colors.borderLight,
                    backgroundColor: isSelected(option) ? colors.primary + '10' : colors.surface
                  }
                ]}
                onPress={() => toggleSelect(option)}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{option.description}</Text>
                </View>
                {isSelected(option) && (
                  <Check size={20} color={colors.primary} strokeWidth={2} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.borderLight }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={handleDone}
              disabled={selectedTimings.length === 0}
            >
              <Text style={[styles.doneButtonText, { color: colors.text }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.display?.semibold,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.text?.regular,
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.text?.medium,
    fontSize: 16,
  },
  doneButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontFamily: Fonts.text?.bold,
    fontSize: 16,
  },
}); 

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { getDefaultNotificationTimings, getTimingDescription, isNotificationPlatformSupported } from '../../utils/notificationUtils';

interface NotificationTiming {
  type: 'before' | 'exact' | 'after';
  value: number;
  label: string;
}

interface NotificationTimingSelectorProps {
  selectedTimings: NotificationTiming[];
  onTimingsChange: (timings: NotificationTiming[]) => void;
  disabled?: boolean;
}

const NotificationTimingSelector: React.FC<NotificationTimingSelectorProps> = ({
  selectedTimings,
  onTimingsChange,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const availableTimings = getDefaultNotificationTimings();

  if (!isNotificationPlatformSupported()) {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedText}>
          Notifications are only supported on iOS
        </Text>
      </View>
    );
  }

  const toggleTiming = (timing: NotificationTiming) => {
    const isSelected = selectedTimings.some(
      (selected) => selected.type === timing.type && selected.value === timing.value
    );

    if (isSelected) {
      const newTimings = selectedTimings.filter(
        (selected) => !(selected.type === timing.type && selected.value === timing.value)
      );
      onTimingsChange(newTimings);
    } else {
      onTimingsChange([...selectedTimings, timing]);
    }
  };

  const getSelectedTimingsText = () => {
    if (selectedTimings.length === 0) {
      return 'No notifications';
    }
    
    if (selectedTimings.length === 1) {
      return selectedTimings[0].label;
    }
    
    return `${selectedTimings.length} notifications selected`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notification Timing</Text>
      
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectorText, disabled && styles.selectorTextDisabled]}>
          {getSelectedTimingsText()}
        </Text>
        <Text style={[styles.arrow, disabled && styles.arrowDisabled]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Notification Timing</Text>
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Choose when you'd like to be notified about this reminder. 
              All times are in UK timezone.
            </Text>

            {availableTimings.map((timing, index) => {
              const isSelected = selectedTimings.some(
                (selected) => selected.type === timing.type && selected.value === timing.value
              );

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.timingOption, isSelected && styles.timingOptionSelected]}
                  onPress={() => toggleTiming(timing)}
                >
                  <View style={styles.timingOptionContent}>
                    <Text style={[styles.timingOptionText, isSelected && styles.timingOptionTextSelected]}>
                      {timing.label}
                    </Text>
                    <Text style={[styles.timingOptionDescription, isSelected && styles.timingOptionDescriptionSelected]}>
                      {getTimingDescription(timing.type, timing.value)}
                    </Text>
                  </View>
                  
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryTitle}>
                Selected: {selectedTimings.length} notification{selectedTimings.length !== 1 ? 's' : ''}
              </Text>
              {selectedTimings.map((timing, index) => (
                <Text key={index} style={styles.selectedSummaryItem}>
                  • {timing.label}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    minHeight: 50,
  },
  selectorDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorTextDisabled: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  arrowDisabled: {
    color: '#CCC',
  },
  unsupportedContainer: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  unsupportedText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timingOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  timingOptionContent: {
    flex: 1,
  },
  timingOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  timingOptionTextSelected: {
    color: '#007AFF',
  },
  timingOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  timingOptionDescriptionSelected: {
    color: '#007AFF',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedSummaryItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default NotificationTimingSelector;

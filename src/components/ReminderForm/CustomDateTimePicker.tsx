import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Dimensions } from 'react-native';
import { X, Check, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '../../utils/dateUtils';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  mode: 'date' | 'time' | 'datetime';
  colors: typeof Colors.light;
}

const { width: screenWidth } = Dimensions.get('window');

export const CustomDateTimePickerModal: React.FC<DateTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  mode,
  colors,
}) => {
  const { t } = useTranslation();
  const [tempDate, setTempDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<'date' | 'time'>(mode === 'time' ? 'time' : 'date');

  // Reset temp date when modal opens
  useEffect(() => {
    if (visible) {
      setTempDate(initialDate);
      setCurrentView(mode === 'time' ? 'time' : 'date');
    }
  }, [visible, initialDate, mode]);

  const handleConfirm = () => {
    onConfirm(tempDate);
    onClose();
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDateForDisplay = (date: Date) => {
    return formatDate(date);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {mode === 'date' ? t('add.selectDate') : mode === 'time' ? t('add.selectTime') : (currentView === 'date' ? t('add.selectDate') : t('add.selectTime'))}
            </Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Check size={24} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Preview Section */}
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <View style={styles.previewContent}>
              {mode === 'date' || currentView === 'date' ? (
                <>
                  <Calendar size={24} color={colors.primary} />
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {formatDateForDisplay(tempDate)}
                  </Text>
                </>
              ) : (
                <>
                  <Clock size={24} color={colors.primary} />
                  <Text style={[styles.previewText, { color: colors.text }]}>
                    {formatTime(tempDate)}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Tabs for datetime mode */}
          {mode === 'datetime' && (
            <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[styles.tab, currentView === 'date' && { backgroundColor: colors.primary + '20' }]}
                onPress={() => setCurrentView('date')}
              >
                <Calendar size={20} color={currentView === 'date' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.tabText, { color: currentView === 'date' ? colors.primary : colors.textSecondary }]}>
                  {t('add.selectDate')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, currentView === 'time' && { backgroundColor: colors.primary + '20' }]}
                onPress={() => setCurrentView('time')}
              >
                <Clock size={20} color={currentView === 'time' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.tabText, { color: currentView === 'time' ? colors.primary : colors.textSecondary }]}>
                  {t('add.selectTime')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Picker Container */}
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate instanceof Date && !isNaN(tempDate.getTime()) ? tempDate : new Date()}
              mode={mode === 'datetime' ? (currentView === 'date' ? 'date' : 'time') : mode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (date) {setTempDate(date);}
              }}
              textColor={colors.text}
              accentColor={colors.primary}
              style={styles.picker}
              minimumDate={mode === 'date' ? new Date() : undefined}
            />
          </View>

          {/* Quick Actions */}
          {mode === 'time' && (
            <View style={[styles.quickActions, { backgroundColor: colors.surface }]}>
              <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>
                Quick Times
              </Text>
              <View style={styles.quickActionsGrid}>
                {[
                  { label: '9:00 AM', hours: 9, minutes: 0 },
                  { label: '12:00 PM', hours: 12, minutes: 0 },
                  { label: '3:00 PM', hours: 15, minutes: 0 },
                  { label: '6:00 PM', hours: 18, minutes: 0 },
                  { label: '9:00 PM', hours: 21, minutes: 0 },
                ].map((quickTime, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickActionButton, { borderColor: colors.borderLight }]}
                    onPress={() => {
                      const newDate = new Date(tempDate);
                      newDate.setHours(quickTime.hours, quickTime.minutes, 0, 0);
                      setTempDate(newDate);
                    }}
                  >
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                      {quickTime.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.bodySemibold,
    flex: 1,
    textAlign: 'center',
  },
  confirmButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  previewSection: {
    padding: 20,
    alignItems: 'center',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.bodySemibold,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
  },
  pickerContainer: {
    padding: 20,
    alignItems: 'center',
    minHeight: 220,
  },
  picker: {
    minHeight: 180,
    width: screenWidth - 80,
  },
  quickActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  quickActionsTitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: FontSizes.footnote,
    fontFamily: Fonts.bodyMedium,
  },
});

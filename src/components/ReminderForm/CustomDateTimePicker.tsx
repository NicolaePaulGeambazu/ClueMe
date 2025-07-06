import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { X, Check, Calendar, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
  mode: 'date' | 'time' | 'datetime';
  colors: typeof Colors.light;
}

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

  // Always use the native picker
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'date' ? t('add.selectDate') : mode === 'time' ? t('add.selectTime') : (currentView === 'date' ? t('add.selectDate') : t('add.selectTime'))}
            </Text>
            <TouchableOpacity onPress={() => { onConfirm(tempDate); onClose(); }} style={styles.confirmButton}>
              <Check size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {/* Tabs for datetime mode */}
          {mode === 'datetime' && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, currentView === 'date' && styles.tabActive]}
                onPress={() => setCurrentView('date')}
              >
                <Calendar size={20} color={currentView === 'date' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.tabText, currentView === 'date' && styles.tabTextActive]}>
                  {t('add.selectDate')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, currentView === 'time' && styles.tabActive]}
                onPress={() => setCurrentView('time')}
              >
                <Clock size={20} color={currentView === 'time' ? '#FFFFFF' : colors.textSecondary} />
                <Text style={[styles.tabText, currentView === 'time' && styles.tabTextActive]}>
                  {t('add.selectTime')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ padding: 16, minHeight: 220 }}>
            <DateTimePicker
              value={tempDate instanceof Date && !isNaN(tempDate.getTime()) ? tempDate : new Date()}
              mode={mode === 'datetime' ? (currentView === 'date' ? 'date' : 'time') : mode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (date) setTempDate(date);
              }}
              textColor={colors.text}
              accentColor={colors.primary}
              style={{ minHeight: 180 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '95%',
    minHeight: 320,
    maxHeight: '95%',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display?.semibold || 'System',
    fontSize: 18,
    color: '#222',
  },
  confirmButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontFamily: Fonts.text?.medium || 'System',
    fontSize: 16,
    color: '#888',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.text?.semibold || 'System',
  },
});

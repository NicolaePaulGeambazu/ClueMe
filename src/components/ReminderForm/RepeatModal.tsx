import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, TextInput, ScrollView, StyleSheet } from 'react-native';
import { X, Check, Lock, Calendar as CalendarIcon, Clock, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { CustomDateTimePickerModal } from './CustomDateTimePicker';
import { Colors } from '../../constants/Colors';

const TABS = ['Hour', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'];

const getTabKey = (tab: string) => tab.toLowerCase();

const defaultRepeat = {
  enabled: true,
  pattern: 'daily',
  interval: 1,
  daysOfWeek: [],
  startDate: new Date(),
  endType: 'never', // 'never' | 'onDate' | 'after'
  endDate: null,
  endAfter: 10,
};

export interface RepeatModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (repeat: any) => void;
  initialValue?: any;
  isPremium?: boolean;
}

export const RepeatModal: React.FC<RepeatModalProps> = ({ visible, onClose, onConfirm, initialValue }) => {
  const { t } = useTranslation();
  const [repeat, setRepeat] = useState(initialValue || defaultRepeat);
  const [activeTab, setActiveTab] = useState<string>(repeat.pattern || 'daily');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');

  // Helper for premium lock (all unlocked for now)
  const isLocked = false; // For future use when premium features are implemented

  // Live preview string
  const getPreview = () => {
    if (!repeat.enabled) {
      return t('add.recurringOptions.patterns.dailyDescription');
    }

    let basePreview = '';
    switch (activeTab) {
      case 'hour':
        basePreview = t('repeat.preview.hourly', { interval: repeat.interval, time: formatTime(repeat.startDate) });
        break;
      case 'daily':
        basePreview = t('repeat.preview.daily', { interval: repeat.interval, date: formatDate(repeat.startDate) });
        break;
      case 'weekly':
        basePreview = t('repeat.preview.weekly', {
          interval: repeat.interval,
          days: repeat.daysOfWeek.length > 0
            ? repeat.daysOfWeek.map((d: string) => t(`common.days.${d}`)).join(', ')
            : t('common.days.mon'), // default to Monday if no days selected
          date: formatDate(repeat.startDate),
        });
        break;
      case 'monthly':
        basePreview = t('repeat.preview.monthly', { interval: repeat.interval, date: formatDate(repeat.startDate) });
        break;
      case 'yearly':
        basePreview = t('repeat.preview.yearly', { interval: repeat.interval, date: formatDate(repeat.startDate) });
        break;
      case 'custom':
        basePreview = t('repeat.preview.custom');
        break;
      default:
        return '';
    }

    // Add end condition to preview
    if (repeat.endType === 'onDate' && repeat.endDate) {
      basePreview += ` ${t('repeat.until')} ${formatDate(repeat.endDate)}`;
    } else if (repeat.endType === 'after') {
      basePreview += ` ${t('repeat.for')} ${repeat.endAfter} ${repeat.endAfter === 1 ? t('repeat.time') : t('repeat.times')}`;
    } else if (repeat.endType === 'never') {
      basePreview += ` ${t('repeat.forever')}`;
    }

    return basePreview;
  };

  // Format helpers (replace with your utils)
  function formatDate(date: Date) {
    return date.toLocaleDateString();
  }
  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Tab content renderers
  const renderTabContent = () => {
    if (isLocked) {
      return (
        <View style={[styles.centered, styles.lockedContent]}>
          <Lock size={40} />
          <Text style={[styles.mt4, styles.textBase, styles.fontMedium]}>{t('repeat.locked')}</Text>
          <TouchableOpacity style={[styles.mt4, styles.px6, styles.py2, styles.bgGray200, styles.roundedFull]}>
            <Text style={[styles.textGray600, styles.fontSemibold]}>{t('repeat.unlockAll')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    switch (activeTab) {
      case 'hour':
        return (
          <View style={styles.tabContent}>
            <View style={styles.rowBetween}>
              <Text>{t('repeat.every')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.interval)}
                onChangeText={v => setRepeat({ ...repeat, interval: Number(v) })}
                style={styles.inputNumber}
              />
              <Text>{t('repeat.hour')}</Text>
            </View>
            <TouchableOpacity style={[styles.row, styles.mt2]} onPress={() => {
              setDatePickerMode('time');
              setShowStartDatePicker(true);
            }}>
              <Clock size={18} />
              <Text style={styles.ml2}>{t('repeat.startTime')}: {formatTime(repeat.startDate)}</Text>
            </TouchableOpacity>
            {renderEndOptions()}
          </View>
        );
      case 'daily':
        return (
          <View style={styles.tabContent}>
            <View style={styles.rowBetween}>
              <Text>{t('repeat.every')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.interval)}
                onChangeText={v => setRepeat({ ...repeat, interval: Number(v) })}
                style={styles.inputNumber}
              />
              <Text>{t('repeat.day')}</Text>
            </View>
            <TouchableOpacity style={[styles.row, styles.mt2]} onPress={() => {
              setDatePickerMode('date');
              setShowStartDatePicker(true);
            }}>
              <CalendarIcon size={18} />
              <Text style={styles.ml2}>{t('repeat.startDate')}: {formatDate(repeat.startDate)}</Text>
            </TouchableOpacity>
            {renderEndOptions()}
          </View>
        );
      case 'weekly':
        return (
          <View style={styles.tabContent}>
            <View style={styles.rowBetween}>
              <Text>{t('repeat.every')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.interval)}
                onChangeText={v => setRepeat({ ...repeat, interval: Number(v) })}
                style={styles.inputNumber}
              />
              <Text>{t('repeat.week')}</Text>
            </View>
            <View style={[styles.row, styles.mt2, styles.flexWrap]}>
              <Text>{t('repeat.repeatOn')}:</Text>
              {/* Days of week selector */}
              {['sun','mon','tue','wed','thu','fri','sat'].map((d: string) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayButton, repeat.daysOfWeek.includes(d) ? styles.dayButtonActive : styles.dayButtonInactive]}
                  onPress={() => {
                    setRepeat({
                      ...repeat,
                      daysOfWeek: repeat.daysOfWeek.includes(d)
                        ? repeat.daysOfWeek.filter((x: string) => x !== d)
                        : [...repeat.daysOfWeek, d],
                    });
                  }}
                >
                  <Text style={repeat.daysOfWeek.includes(d) ? styles.dayButtonTextActive : styles.dayButtonTextInactive}>{t(`common.days.${d}`)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.row, styles.mt2]} onPress={() => {
              setDatePickerMode('date');
              setShowStartDatePicker(true);
            }}>
              <CalendarIcon size={18} />
              <Text style={styles.ml2}>{t('repeat.startDate')}: {formatDate(repeat.startDate)}</Text>
            </TouchableOpacity>
            {renderEndOptions()}
          </View>
        );
      case 'monthly':
        return (
          <View style={styles.tabContent}>
            <View style={styles.rowBetween}>
              <Text>{t('repeat.every')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.interval)}
                onChangeText={v => setRepeat({ ...repeat, interval: Number(v) })}
                style={styles.inputNumber}
              />
              <Text>{t('repeat.month')}</Text>
            </View>
            <TouchableOpacity style={[styles.row, styles.mt2]} onPress={() => {
              setDatePickerMode('date');
              setShowStartDatePicker(true);
            }}>
              <CalendarIcon size={18} />
              <Text style={styles.ml2}>{t('repeat.startDate')}: {formatDate(repeat.startDate)}</Text>
            </TouchableOpacity>
            {renderEndOptions()}
          </View>
        );
      case 'yearly':
        return (
          <View style={styles.tabContent}>
            <View style={styles.rowBetween}>
              <Text>{t('repeat.every')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.interval)}
                onChangeText={v => setRepeat({ ...repeat, interval: Number(v) })}
                style={styles.inputNumber}
              />
              <Text>{t('repeat.year')}</Text>
            </View>
            <TouchableOpacity style={[styles.row, styles.mt2]} onPress={() => {
              setDatePickerMode('date');
              setShowStartDatePicker(true);
            }}>
              <CalendarIcon size={18} />
              <Text style={styles.ml2}>{t('repeat.startDate')}: {formatDate(repeat.startDate)}</Text>
            </TouchableOpacity>
            {renderEndOptions()}
          </View>
        );
      case 'custom':
        return (
          <View style={styles.tabContent}>
            <Text>{t('repeat.customDescription')}</Text>
            {/* Add custom pattern UI here */}
          </View>
        );
      default:
        return null;
    }
  };

  // End options (Never, On date, After N times)
  const renderEndOptions = () => {
    const getSmartEndDate = (type: 'tomorrow' | 'nextWeek' | 'nextMonth' | 'nextYear') => {
      const now = new Date();
      switch (type) {
        case 'tomorrow':
          return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        case 'nextWeek':
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'nextMonth':
          return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        case 'nextYear':
          return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        default:
          return now;
      }
    };

    const isEndDateValid = repeat.endDate && repeat.endDate > repeat.startDate;

    return (
      <View style={styles.endOptionsContainer}>
        <Text style={[styles.mb2, styles.fontMedium]}>{t('repeat.ends')}</Text>

        {/* End Type Buttons */}
        <View style={[styles.row, styles.mb2]}>
          <TouchableOpacity
            onPress={() => setRepeat({ ...repeat, endType: 'never' })}
            style={[styles.endButton, repeat.endType === 'never' ? styles.endButtonActive : styles.endButtonInactive]}
          >
            <Text style={repeat.endType === 'never' ? styles.endButtonTextActive : styles.endButtonTextInactive}>{t('repeat.never')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRepeat({ ...repeat, endType: 'onDate' })}
            style={[styles.endButton, repeat.endType === 'onDate' ? styles.endButtonActive : styles.endButtonInactive]}
          >
            <Text style={repeat.endType === 'onDate' ? styles.endButtonTextActive : styles.endButtonTextInactive}>{t('repeat.onDate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRepeat({ ...repeat, endType: 'after' })}
            style={[styles.endButton, repeat.endType === 'after' ? styles.endButtonActive : styles.endButtonInactive]}
          >
            <Text style={repeat.endType === 'after' ? styles.endButtonTextActive : styles.endButtonTextInactive}>{t('repeat.after')}</Text>
          </TouchableOpacity>
        </View>

        {/* End Date Options */}
        {repeat.endType === 'onDate' && (
          <View>
            {/* Smart Date Suggestions */}
            <View style={styles.smartDateContainer}>
              <Text style={styles.smartDateLabel}>{t('repeat.quickOptions')}:</Text>
              <View style={styles.smartDateButtons}>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endDate: getSmartEndDate('tomorrow') })}
                >
                  <Text style={styles.smartDateButtonText}>{t('repeat.tomorrow')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endDate: getSmartEndDate('nextWeek') })}
                >
                  <Text style={styles.smartDateButtonText}>{t('repeat.nextWeek')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endDate: getSmartEndDate('nextMonth') })}
                >
                  <Text style={styles.smartDateButtonText}>{t('repeat.nextMonth')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Date Picker */}
            <TouchableOpacity
              style={[styles.row, styles.customDateButton, !isEndDateValid && repeat.endDate && styles.invalidDateButton]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <CalendarIcon size={18} color={!isEndDateValid && repeat.endDate ? '#ef4444' : '#374151'} />
              <Text style={[styles.ml2, !isEndDateValid && repeat.endDate && styles.invalidDateText]}>
                {t('repeat.endDate')}: {repeat.endDate ? formatDate(repeat.endDate) : t('repeat.selectDate')}
              </Text>
            </TouchableOpacity>

            {/* Validation Warning */}
            {!isEndDateValid && repeat.endDate && (
              <Text style={styles.validationError}>{t('repeat.endDateAfterStart')}</Text>
            )}
          </View>
        )}

        {/* End After Options */}
        {repeat.endType === 'after' && (
          <View>
            {/* Quick Count Suggestions */}
            <View style={styles.smartDateContainer}>
              <Text style={styles.smartDateLabel}>{t('repeat.quickOptions')}:</Text>
              <View style={styles.smartDateButtons}>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endAfter: 1 })}
                >
                  <Text style={styles.smartDateButtonText}>1 {t('repeat.time')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endAfter: 5 })}
                >
                  <Text style={styles.smartDateButtonText}>5 {t('repeat.times')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smartDateButton}
                  onPress={() => setRepeat({ ...repeat, endAfter: 10 })}
                >
                  <Text style={styles.smartDateButtonText}>10 {t('repeat.times')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Count Input */}
            <View style={[styles.row, styles.mt2]}>
              <Text>{t('repeat.after')}</Text>
              <TextInput
                keyboardType="numeric"
                value={String(repeat.endAfter)}
                onChangeText={v => {
                  const num = Math.max(1, Math.min(999, Number(v) || 1));
                  setRepeat({ ...repeat, endAfter: num });
                }}
                style={[styles.inputNumber, styles.ml2]}
                maxLength={3}
              />
              <Text style={styles.ml2}>{repeat.endAfter === 1 ? t('repeat.time') : t('repeat.times')}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <X size={28} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('repeat.title')}</Text>
            <TouchableOpacity onPress={() => onConfirm(repeat)}>
              <Check size={28} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {/* Toggle */}
          <View style={styles.rowBetween}>
            <Text style={styles.textBase}>{t('repeat.setAsRepeat')}</Text>
            <Switch
              value={repeat.enabled}
              onValueChange={(v: boolean) => setRepeat({ ...repeat, enabled: v })}
            />
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === getTabKey(tab) ? styles.tabButtonActive : styles.tabButtonInactive]}
                onPress={() => {
                  setActiveTab(getTabKey(tab));
                  setRepeat({ ...repeat, pattern: getTabKey(tab) });
                }}
              >
                <Text style={activeTab === getTabKey(tab) ? styles.tabButtonTextActive : styles.tabButtonTextInactive}>{t(`repeat.tabs.${getTabKey(tab)}`)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Live Preview */}
          <View style={styles.previewContainer}>
            <ChevronRight size={18} color="#2563eb" />
            <Text style={styles.previewText}>{getPreview()}</Text>
          </View>
        </View>
      </View>

      {/* Custom Date/Time Picker Modal */}
      <CustomDateTimePickerModal
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onConfirm={(date) => {
          setRepeat({ ...repeat, startDate: date });
          setShowStartDatePicker(false);
        }}
        initialDate={repeat.startDate}
        mode={datePickerMode}
        colors={Colors.light}
      />

      {/* End Date Picker Modal */}
      <CustomDateTimePickerModal
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onConfirm={(date) => {
          setRepeat({ ...repeat, endDate: date });
          setShowEndDatePicker(false);
        }}
        initialDate={repeat.endDate || new Date()}
        mode="date"
        colors={Colors.light}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tabContent: {
    marginTop: 8,
    marginBottom: 8,
  },
  inputNumber: {
    width: 60,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    paddingVertical: 2,
    marginHorizontal: 8,
  },
  mt2: { marginTop: 8 },
  mt4: { marginTop: 16 },
  mb2: { marginBottom: 8 },
  ml2: { marginLeft: 8 },
  px6: { paddingHorizontal: 24 },
  py2: { paddingVertical: 8 },
  bgGray200: { backgroundColor: '#e5e7eb' },
  roundedFull: { borderRadius: 999 },
  textGray600: { color: '#4b5563' },
  fontSemibold: { fontWeight: '600' },
  fontMedium: { fontWeight: '500' },
  textBase: { fontSize: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabsScroll: { marginBottom: 16 },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
  },
  tabButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  tabButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  tabButtonTextInactive: {
    color: '#374151',
    fontWeight: '500',
  },
  dayButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginHorizontal: 2,
    marginLeft: 4,
  },
  dayButtonActive: {
    backgroundColor: '#2563eb',
  },
  dayButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  dayButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  dayButtonTextInactive: {
    color: '#374151',
    fontWeight: '500',
  },
  endOptionsContainer: {
    marginTop: 16,
  },
  endButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  endButtonActive: {
    backgroundColor: '#2563eb',
  },
  endButtonInactive: {
    backgroundColor: '#e5e7eb',
  },
  endButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  endButtonTextInactive: {
    color: '#374151',
    fontWeight: '500',
  },
  previewContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    marginLeft: 8,
    color: '#374151',
    fontSize: 15,
  },
  smartDateContainer: {
    marginBottom: 12,
  },
  smartDateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  smartDateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smartDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  smartDateButtonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  customDateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  invalidDateButton: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  invalidDateText: {
    color: '#ef4444',
  },
  validationError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 26,
  },
  lockedContent: {
    opacity: 0.6,
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
});

export default RepeatModal;

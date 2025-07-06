import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Bell,
  Plus,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomDateTimePickerModal } from '../ReminderForm/CustomDateTimePicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminder: any) => Promise<void>;
  onAdvanced: (data: any) => void;
  prefillDate?: string;
  prefillTime?: string;
  prefillData?: any; // For editing existing reminders
}

export default function QuickAddModal({
  visible,
  onClose,
  onSave,
  onAdvanced,
  prefillDate,
  prefillTime,
  prefillData,
}: QuickAddModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [title, setTitle] = useState(prefillData?.title || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    prefillDate || 'today'
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    prefillTime || 'in1hour'
  );
  const [customTimeValue, setCustomTimeValue] = useState<string>('');

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setTitle(prefillData.title || '');
      // You could also set date and time based on prefillData.dueDate and prefillData.dueTime
      if (prefillData.dueDate) {
        const dueDate = new Date(prefillData.dueDate);
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (dueDate.toDateString() === now.toDateString()) {
          setSelectedDate('today');
        } else if (dueDate.toDateString() === tomorrow.toDateString()) {
          setSelectedDate('tomorrow');
        } else {
          setSelectedDate('custom');
        }
      }
      
      if (prefillData.dueTime) {
        setSelectedTime('custom');
        // Convert 24-hour format to 12-hour format for display
        const [hours, minutes] = prefillData.dueTime.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        setCustomTimeValue(`${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
      }
    }
  }, [prefillData]);

  // UI state
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim()) return;

    const baseDate = getDateFromSelection(selectedDate);
    const timeString = getTimeFromSelection(selectedTime);
    const adjustedDate = getAdjustedDateForTime(baseDate, timeString);

    const reminder = {
      title: title.trim(),
      dueDate: adjustedDate,
      dueTime: timeString,
      userId: user?.uid,
      status: 'pending',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('📝 Creating reminder with adjusted date/time:', {
      title: reminder.title,
      baseDate: baseDate.toISOString(),
      timeString,
      adjustedDate: adjustedDate.toISOString(),
      currentTime: new Date().toISOString()
    });

    try {
      setIsSaving(true);
      console.log('🔄 Starting reminder save...', { title: reminder.title });
      
      await onSave(reminder);
      
      console.log('✅ Reminder saved successfully, closing modal...');
      // Only close the modal after successful save
      handleClose();
    } catch (error) {
      console.error('❌ Error saving reminder:', error);
      // Don't close the modal if there's an error
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    console.log('🔄 QuickAddModal: handleClose called...');
    
    // Reset all internal state first
    setTitle('');
    setSelectedDate('today');
    setSelectedTime('in1hour');
    setCustomTimeValue('');
    setShowDateSheet(false);
    setShowTimeSheet(false);
    setShowTimePicker(false);
    setShowDatePicker(false);
    setIsSaving(false);
    
    // Then call the parent's onClose
    console.log('🔄 QuickAddModal: Calling onClose...');
    onClose();
    console.log('✅ QuickAddModal: handleClose completed');
  };

  const getDateFromSelection = (selection: string): Date => {
    const now = new Date();
    switch (selection) {
      case 'today':
        return now;
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      case 'thisWeekend':
        // Find the next Saturday
        const saturday = new Date(now);
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
        saturday.setDate(now.getDate() + daysUntilSaturday);
        return saturday;
      case 'nextWeek':
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return nextWeek;
      default:
        return now;
    }
  };

  const getAdjustedDateForTime = (baseDate: Date, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const targetTime = new Date(baseDate);
    targetTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    // If the target time has already passed today, move to tomorrow
    if (targetTime <= now) {
      console.log(`⏰ Target time ${timeString} has passed today, adjusting to tomorrow`);
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    console.log(`📅 Adjusted date for time ${timeString}: ${targetTime.toISOString()}`);
    return targetTime;
  };

  const getTimeFromSelection = (selection: string): string => {
    const now = new Date();
    
    switch (selection) {
      case 'now':
        // 5 minutes from now
        const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);
        return `${in5Minutes.getHours().toString().padStart(2, '0')}:${in5Minutes.getMinutes().toString().padStart(2, '0')}`;
      
      case 'in1hour':
        // 1 hour from now
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        return `${in1Hour.getHours().toString().padStart(2, '0')}:${in1Hour.getMinutes().toString().padStart(2, '0')}`;
      
      case 'lunch':
        return '12:00';
      
      case 'afternoon':
        return '14:00';
      
      case 'dinner':
        return '18:00';
      
      case 'bedtime':
        return '21:00';
      
      case 'tomorrow':
        return '09:00';
      
      case 'custom':
        // Convert custom time format (e.g., "9:30 AM") to 24-hour format
        if (customTimeValue) {
          const [time, period] = customTimeValue.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let hour24 = hours;
          
          if (period === 'PM' && hours !== 12) {
            hour24 = hours + 12;
          } else if (period === 'AM' && hours === 12) {
            hour24 = 0;
          }
          
          return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return '14:00';
      
      default:
        return '14:00';
    }
  };

  const dateOptions = [
    { value: 'today', label: 'Today', description: 'This afternoon/evening' },
    { value: 'tomorrow', label: 'Tomorrow', description: 'Next day' },
    { value: 'thisWeekend', label: 'This weekend', description: 'Saturday or Sunday' },
    { value: 'nextWeek', label: 'Next week', description: 'In 7 days' },
    { value: 'custom', label: 'Pick specific date', description: 'Choose any date' },
  ];

  const timeOptions = [
    { value: 'now', label: 'Right now', time: 'Now', description: 'In 5 minutes' },
    { value: 'in1hour', label: 'In 1 hour', time: '1 hour from now', description: 'Perfect for quick tasks' },
    { value: 'lunch', label: 'Lunch time', time: '12:00 PM', description: 'Around noon' },
    { value: 'afternoon', label: 'Afternoon', time: '2:00 PM', description: 'Early afternoon' },
    { value: 'dinner', label: 'Dinner time', time: '6:00 PM', description: 'Evening meal' },
    { value: 'bedtime', label: 'Before bed', time: '9:00 PM', description: 'Evening routine' },
    { value: 'tomorrow', label: 'Tomorrow morning', time: '9:00 AM', description: 'Start of day' },
    { value: 'custom', label: 'Pick specific time', time: 'Custom', description: 'Choose exact time' },
  ];

  const handleDateSelect = (value: string) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setSelectedDate(value);
    }
    setShowDateSheet(false);
  };
  const handleTimeSelect = (value: string) => {
    if (value === 'custom') {
      setShowTimePicker(true);
    } else {
      setSelectedTime(value);
    }
    setShowTimeSheet(false);
  };

  // Handler for date picker confirmation
  const handleDatePickerConfirm = (date: Date) => {
    setSelectedDate('custom');
    // You could store the custom date value here if needed
    setShowDatePicker(false);
  };

  // Handler for time picker confirmation
  const handleTimePickerConfirm = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Store the custom time value
    setCustomTimeValue(timeString);
    setSelectedTime('custom');
    setShowTimePicker(false);
  };

  // Handler for advanced
  const handleAdvanced = () => {
    if (onAdvanced) onAdvanced({
      title,
      selectedDate,
      selectedTime,
    });
  };

  const renderDateSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('quickAdd.when')}
      </Text>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.borderLight }]}
          onPress={() => setShowDateSheet(true)}
        >
          <Calendar size={20} color={colors.textSecondary} />
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {dateOptions.find(opt => opt.value === selectedDate)?.label}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.section}>
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.borderLight }]}
          onPress={() => setShowTimeSheet(true)}
        >
          <Clock size={20} color={colors.textSecondary} />
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {selectedTime === 'custom' 
              ? customTimeValue || 'Pick Time'
              : timeOptions.find(opt => opt.value === selectedTime)?.time || 
                timeOptions.find(opt => opt.value === selectedTime)?.label}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity 
        style={styles.overlay}
        onPress={handleClose}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.modal,
            { 
              backgroundColor: colors.background,
              opacity: opacityAnim 
            }
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
          onResponderGrant={(e) => e.stopPropagation()}
          onResponderMove={(e) => e.stopPropagation()}
          onResponderRelease={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {prefillData ? t('quickAdd.editReminder') : t('quickAdd.newReminder')}
              </Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Main Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('quickAdd.whatToRemember')}
                </Text>
                <TextInput
                  style={[styles.titleInput, { 
                    borderColor: colors.borderLight,
                    color: colors.text,
                    backgroundColor: colors.surface
                  }]}
                  placeholder={t('quickAdd.placeholder')}
                  placeholderTextColor={colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  multiline
                  maxLength={100}
                />
              </View>

              {/* Date and Time Selectors */}
              <View style={styles.dateTimeContainer}>
                {renderDateSelector()}
                {renderTimeSelector()}
              </View>

              {/* Advanced Options Link */}
              <TouchableOpacity style={styles.advancedLink} onPress={handleAdvanced}>
                <Text style={[styles.advancedLinkText, { color: colors.primary }]}>
                  {t('quickAdd.needMoreOptions')}
                </Text>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { 
                    backgroundColor: title.trim() && !isSaving ? colors.primary : colors.borderLight,
                    opacity: title.trim() && !isSaving ? 1 : 0.6
                  }
                ]}
                onPress={handleSave}
                disabled={!title.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color={colors.background} />
                    <Text style={[
                      styles.createButtonText,
                      { color: colors.background }
                    ]}>
                      {t('common.saving')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Check size={20} color={title.trim() ? colors.background : colors.textTertiary} />
                    <Text style={[
                      styles.createButtonText,
                      { color: title.trim() ? colors.background : colors.textTertiary }
                    ]}>
                      {prefillData ? t('quickAdd.updateReminder') : t('quickAdd.createReminder')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Date Sheet */}
        {showDateSheet && (
          <View style={[styles.sheet, { 
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16 
          }]}> 
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>When should this happen?</Text>
            </View>
            {dateOptions.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={styles.sheetOption} 
                onPress={() => handleDateSelect(opt.value)}
              >
                <View style={styles.sheetOptionContent}>
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                    {opt.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowDateSheet(false)}>
              <Text style={[styles.sheetCancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Time Sheet */}
        {showTimeSheet && (
          <View style={[styles.sheet, { 
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16 
          }]}> 
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>When should this happen?</Text>
            </View>
            {timeOptions.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={styles.sheetOption} 
                onPress={() => handleTimeSelect(opt.value)}
              >
                <View style={styles.sheetOptionContent}>
                  <Text style={[styles.sheetOptionText, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.sheetOptionDescription, { color: colors.textSecondary }]}>
                    {opt.description}
                  </Text>
                </View>
                <Text style={[styles.sheetOptionTime, { color: colors.primary }]}>{opt.time}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowTimeSheet(false)}>
              <Text style={[styles.sheetCancelText, { color: colors.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker Modal */}
        <CustomDateTimePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onConfirm={handleDatePickerConfirm}
          initialDate={new Date()}
          mode="date"
          colors={colors}
        />

        {/* Time Picker Modal */}
        <CustomDateTimePickerModal
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onConfirm={handleTimePickerConfirm}
          initialDate={new Date()}
          mode="time"
          colors={colors}
        />
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '70%',
    maxHeight: '92%',
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
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
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    fontFamily: Fonts.text?.regular,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    gap: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
  },
  advancedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  advancedLinkText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetOptionContent: {
    flex: 1,
  },
  sheetOptionText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    marginBottom: 2,
  },
  sheetOptionDescription: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
  },
  sheetOptionTime: {
    fontSize: 16,
    fontFamily: Fonts.text?.semibold,
  },
  sheetCancel: {
    marginTop: 12,
    paddingVertical: 16,
  },
  sheetCancelText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
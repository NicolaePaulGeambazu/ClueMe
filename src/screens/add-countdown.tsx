import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, ChevronRight, Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import firebaseService from '../services/firebaseService';
import { formatDate, formatTime } from '../utils/dateUtils';
import { CustomDateTimePickerModal } from '../components/ReminderForm/CustomDateTimePicker';

interface Countdown {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  targetTime?: string;
  createdAt: Date; // Keep as Date for Firebase service compatibility
  updatedAt: Date; // Keep as Date for Firebase service compatibility
  userId: string;
  color?: string;
}

export default function AddCountdownScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();

  const editingCountdown = route.params?.countdown as Countdown | null;
  const isEditing = !!editingCountdown;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    targetTime: '',
  });

  // Remove showDatePicker, showTimePicker, pickerMode, pickerValue, tempPickerValue, and related modal logic
  // Use a single picker modal state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'date' | 'time'>('date');
  const [pickerInitialValue, setPickerInitialValue] = useState<Date>(new Date());

  const styles = createStyles(colors);

  // Initialize form data when editing
  useEffect(() => {
    if (editingCountdown) {
      setFormData({
        title: editingCountdown.title,
        description: editingCountdown.description || '',
        targetDate: editingCountdown.targetDate,
        targetTime: editingCountdown.targetTime || '',
      });
    }
  }, [editingCountdown]);

  const handleBack = () => {
    navigation.goBack();
  };

  // Replace openPicker
  const openPicker = (mode: 'date' | 'time') => {
    setPickerType(mode);
    let initialValue = new Date();
    if (mode === 'date' && formData.targetDate) {
      initialValue = new Date(formData.targetDate);
    } else if (mode === 'time' && formData.targetTime) {
      const [hours, minutes] = formData.targetTime.split(':');
      initialValue = new Date();
      initialValue.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    setPickerInitialValue(initialValue);
    setShowPicker(true);
  };

  // Replace confirmPickerSelection
  const handlePickerConfirm = (date: Date) => {
    if (pickerType === 'date') {
      setFormData(prev => ({ ...prev, targetDate: date.toISOString().split('T')[0] }));
    } else {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, targetTime: `${hours}:${minutes}` }));
    }
    setShowPicker(false);
  };

  // Replace cancelPickerSelection
  const handlePickerCancel = () => {
    setShowPicker(false);
  };

  const handleSaveCountdown = async () => {
    if (!formData.title.trim() || !formData.targetDate) {
      Alert.alert(t('common.error'), t('countdown.validation.titleRequired'));
      return;
    }

    try {
      if (editingCountdown) {
        // Update existing countdown - convert string dates back to Date objects
        const updatedCountdown = {
          ...editingCountdown,
          ...formData,
          createdAt: editingCountdown.createdAt instanceof Date ? editingCountdown.createdAt : new Date(editingCountdown.createdAt),
          updatedAt: new Date(),
        };
        await firebaseService.updateCountdown(updatedCountdown);
      } else {
        // Add new countdown
        const newCountdown = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user?.uid || '',
          color: colors.primary,
        };
        await firebaseService.createCountdown(newCountdown);
      }

      navigation.goBack();
    } catch (error: any) {
      let errorMessage = 'Failed to save countdown';
      let errorTitle = 'Save Error';

      if (error.code === 'permission-denied') {
        errorMessage = 'You don\'t have permission to save countdowns. Please try signing out and back in.';
        errorTitle = 'Permission Denied';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'You need to be signed in to save countdowns. Please sign in again.';
        errorTitle = 'Authentication Required';
      } else if (error.message && error.message.includes('Firebase permission denied')) {
        errorMessage = 'Unable to save countdown due to permission issues. Please try refreshing or signing out and back in.';
        errorTitle = 'Access Denied';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error while saving countdown. Please check your connection and try again.';
        errorTitle = 'Network Error';
      } else {
        errorMessage = `Failed to save countdown: ${error.message || 'Unknown error'}. Please try again.`;
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            setTimeout(() => handleSaveCountdown(), 1000);
          },
        },
      ]);
    }
  };

  // Helper functions for formatting display values
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDate(date);
    } catch {
      return dateString;
    }
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return formatTime(date);
    } catch {
      return timeString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t('countdown.editCountdown') : t('countdown.newCountdown')}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveCountdown}
          disabled={!formData.title.trim() || !formData.targetDate}
        >
          <Check size={20} color={formData.title.trim() && formData.targetDate ? '#FFFFFF' : colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>{t('countdown.titleLabel')}</Text>
          <TextInput
            style={styles.textInput}
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            placeholder={t('countdown.titlePlaceholder')}
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>{t('countdown.descriptionLabel')}</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder={t('countdown.descriptionPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>{t('countdown.targetDateLabel')}</Text>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => openPicker('date')}
          >
            <Calendar size={20} color={colors.textSecondary} />
            <Text style={[
              styles.dateTimeInputText,
              !formData.targetDate && styles.placeholderText
            ]}>
              {formData.targetDate ? formatDisplayDate(formData.targetDate) : t('countdown.targetDatePlaceholder')}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>{t('countdown.targetTimeLabel')}</Text>
          <TouchableOpacity
            style={styles.dateTimeInput}
            onPress={() => openPicker('time')}
          >
            <Clock size={20} color={colors.textSecondary} />
            <Text style={[
              styles.dateTimeInputText,
              !formData.targetTime && styles.placeholderText
            ]}>
              {formData.targetTime ? formatDisplayTime(formData.targetTime) : t('countdown.targetTimePlaceholder')}
            </Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal - unified */}
      <CustomDateTimePickerModal
        visible={showPicker}
        onClose={handlePickerCancel}
        onConfirm={handlePickerConfirm}
        initialDate={pickerInitialValue}
        mode={pickerType}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeInputText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
}); 
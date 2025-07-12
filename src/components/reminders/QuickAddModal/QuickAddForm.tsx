import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Repeat, Globe, Users, ChevronRight, Scissors, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { QuickAddSelector } from './QuickAddSelector';
import { getTimezoneDisplayName } from '../../../utils/timezoneUtils';
import { formatDate } from '../../../utils/dateUtils';
import BannerAdComponent from '../../ads/BannerAdComponent';

interface QuickAddFormProps {
  title: string;
  setTitle: (title: string) => void;
  location: string;
  setLocation: (location: string) => void;
  selectedDate: string;
  selectedTime: string;
  customTimeValue: string;
  customDateValue: Date | null;
  isRecurring: boolean;
  timezone: string;
  assignedTo: string[];
  notificationTimings: any[];
  isPremium: boolean;
  dateOptions: any[];
  getTimeOptions: () => any[];
  getRecurringDescriptionText: () => string;
  getAssignedMembersText: () => string;
  onDatePress: () => void;
  onTimePress: () => void;
  onRecurringPress: () => void;
  onNotificationPress: () => void;
  onFamilyPress: () => void;
  onBreakDownTask?: () => void;
  isChunked?: boolean;
  subTasksCount?: number;
  colors: any;
  styles: any;
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({
  title,
  setTitle,
  location,
  setLocation,
  selectedDate,
  selectedTime,
  customTimeValue,
  customDateValue,
  isRecurring,
  timezone,
  assignedTo,
  notificationTimings,
  isPremium,
  dateOptions,
  getTimeOptions,
  getRecurringDescriptionText,
  getAssignedMembersText,
  onDatePress,
  onTimePress,
  onRecurringPress,
  onNotificationPress,
  onFamilyPress,
  onBreakDownTask,
  isChunked = false,
  subTasksCount = 0,
  colors,
  styles,
}) => {
  const { t } = useTranslation();

  const getDateLabel = () => {
    if (selectedDate === 'custom' && customDateValue) {
      return formatDate(customDateValue);
    }
    return dateOptions.find(opt => opt.value === selectedDate)?.label;
  };

  const getTimeLabel = () => {
    if (selectedTime === 'custom') {
      return customTimeValue || t('quickAdd.pickTime');
    }
    const timeOption = getTimeOptions().find(opt => opt.value === selectedTime);
    return timeOption?.time || timeOption?.label;
  };

  const getNotificationDisplayText = () => {
    if (notificationTimings.length === 0) {
      return t('quickAdd.noNotifications');
    }
    if (notificationTimings.length === 1) {
      return t('quickAdd.singleNotification', { label: notificationTimings[0].label });
    }
    return t('quickAdd.notifications', { count: notificationTimings.length });
  };

  return (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Main Input */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('quickAdd.whatToRemember')}
        </Text>
        <TextInput
          testID="title-input"
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
        <QuickAddSelector
          testID="date-selector"
          icon={<Calendar size={20} color={colors.textSecondary} />}
          label={getDateLabel()}
          onPress={onDatePress}
          colors={colors}
          styles={styles}
        />
        <QuickAddSelector
          testID="time-selector"
          icon={<Clock size={20} color={colors.textSecondary} />}
          label={getTimeLabel()}
          onPress={onTimePress}
          colors={colors}
          styles={styles}
        />
      </View>

      {/* Location Input - moved here for visibility */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}> 
            {t('quickAdd.location')}
          </Text>
        </View>
        <TextInput
          testID="location-input"
          style={[styles.titleInput, { 
            borderColor: colors.borderLight,
            color: colors.text,
            backgroundColor: colors.surface,
            marginTop: 4
          }]}
          placeholder={t('quickAdd.locationPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          value={location}
          onChangeText={setLocation}
          multiline
          maxLength={100}
        />
      </View>

      {/* Enhanced Recurring and Timezone Selectors */}
      <View style={styles.dateTimeContainer}>
        <QuickAddSelector
          testID="recurring-selector"
          icon={<Repeat size={20} color={colors.textSecondary} />}
          label={getRecurringDescriptionText()}
          onPress={onRecurringPress}
          colors={colors}
          styles={styles}
        />
        {/* Removed timezone selector */}
      </View>

      {/* Notification Timing */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('quickAdd.notificationTiming')}
        </Text>
        <TouchableOpacity
          testID="notification-timing-selector"
          style={[styles.selector, { borderColor: colors.borderLight }]}
          onPress={onNotificationPress}
        >
          <Text style={[styles.selectorText, { color: colors.text }]}>
            🔔 {getNotificationDisplayText()}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Family Assignment */}
      <View style={styles.dateTimeContainer}>
        <QuickAddSelector
          testID="family-selector"
          icon={<Users size={20} color={colors.textSecondary} />}
          label={getAssignedMembersText()}
          onPress={onFamilyPress}
          colors={colors}
          styles={styles}
        />
      </View>
      {/* Banner Ad - Bottom of Quick Add Modal (only for free users) */}
      {!isPremium && (
        <BannerAdComponent style={{ marginTop: 16, marginBottom: 16 }} />
      )}
    </ScrollView>
  );
}; 
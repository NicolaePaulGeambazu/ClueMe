import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Repeat, Globe, Users, ChevronRight, Scissors, MapPin, Bell, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { QuickAddSelector } from './QuickAddSelector';

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

  assignedTo: string[];
  notificationTimings: any[];
  isPremium: boolean;
  dateOptions: any[];
  getTimeOptions: () => any[];
  getRecurringDescriptionText: () => string;
  getAssignedMembersText: () => string;
  getAssignedMembersDetails: (members: any[]) => string;
  members: any[];
  onDatePress: () => void;
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

  assignedTo,
  notificationTimings,
  isPremium,
  dateOptions,
  getTimeOptions,
  getRecurringDescriptionText,
  getAssignedMembersText,
  getAssignedMembersDetails,
  members,
  onDatePress,
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

  // New compact visual design
  return (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      bounces={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Main Input - Compact */}
      <View style={[styles.section, { marginTop: 16 }]}>
        <TextInput
          testID="title-input"
          style={[styles.titleInput, {
            borderColor: colors.borderLight,
            color: colors.text,
            backgroundColor: colors.surface,
            fontSize: 18,
            paddingVertical: 16,
            minHeight: 56,
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

      {/* Visual Date/Time Selector - Compact Cards */}
      <View style={styles.visualDateTimeContainer}>
        <TouchableOpacity
          testID="datetime-selector"
          style={[styles.visualDateTimeCard, {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          }]}
          onPress={onDatePress}
        >
          <View style={styles.visualDateTimeHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={[styles.visualDateTimeTitle, { color: colors.text }]}>
              {getDateLabel()}
            </Text>
          </View>
          <View style={styles.visualDateTimeTime}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.visualDateTimeTimeText, { color: colors.textSecondary }]}>
              {getTimeLabel()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Action Bar - Visual Icons */}
      <View style={styles.quickActionBar}>
        <TouchableOpacity
          style={[styles.quickActionButton, {
            backgroundColor: isRecurring ? colors.primary + '20' : colors.surface,
            borderColor: isRecurring ? colors.primary : colors.borderLight,
          }]}
          onPress={onRecurringPress}
        >
          <Repeat size={20} color={isRecurring ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, {
            backgroundColor: notificationTimings.length > 0 ? colors.primary + '20' : colors.surface,
            borderColor: notificationTimings.length > 0 ? colors.primary : colors.borderLight,
          }]}
          onPress={onNotificationPress}
        >
          <Bell size={20} color={notificationTimings.length > 0 ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, {
            backgroundColor: assignedTo.length > 0 ? colors.primary + '20' : colors.surface,
            borderColor: assignedTo.length > 0 ? colors.primary : colors.borderLight,
          }]}
          onPress={onFamilyPress}
        >
          <Users size={20} color={assignedTo.length > 0 ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

        {onBreakDownTask && (
          <TouchableOpacity
            style={[styles.quickActionButton, {
              backgroundColor: isChunked ? colors.primary + '20' : colors.surface,
              borderColor: isChunked ? colors.primary : colors.borderLight,
            }]}
            onPress={onBreakDownTask}
          >
            <Scissors size={20} color={isChunked ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Location Input - Compact */}
      {location.trim() && (
        <View style={styles.section}>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={colors.textSecondary} />
            <TextInput
              testID="location-input"
              style={[styles.locationInput, {
                color: colors.text,
                backgroundColor: 'transparent',
              }]}
              placeholder={t('quickAdd.locationPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              multiline
              maxLength={100}
            />
          </View>
        </View>
      )}

      {/* Status Indicators - Visual */}
      <View style={styles.statusIndicators}>
        {isRecurring && (
          <View style={[styles.statusChip, { backgroundColor: colors.primary + '20' }]}>
            <Repeat size={12} color={colors.primary} />
            <Text style={[styles.statusChipText, { color: colors.primary }]}>
              {getRecurringDescriptionText()}
            </Text>
          </View>
        )}

        {notificationTimings.length > 0 && (
          <View style={[styles.statusChip, { backgroundColor: colors.primary + '20' }]}>
            <Bell size={12} color={colors.primary} />
            <Text style={[styles.statusChipText, { color: colors.primary }]}>
              {notificationTimings.length} notification{notificationTimings.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {assignedTo.length > 0 && (
          <View style={[styles.statusChip, { backgroundColor: colors.primary + '20' }]}>
            <Users size={12} color={colors.primary} />
            <Text style={[styles.statusChipText, { color: colors.primary }]}>
              {getAssignedMembersDetails(members)}
            </Text>
          </View>
        )}

        {isChunked && (
          <View style={[styles.statusChip, { backgroundColor: colors.primary + '20' }]}>
            <Scissors size={12} color={colors.primary} />
            <Text style={[styles.statusChipText, { color: colors.primary }]}>
              {subTasksCount} subtasks
            </Text>
          </View>
        )}
      </View>

      {/* Banner Ad - Bottom of Quick Add Modal (only for free users) */}
      {!isPremium && (
        <BannerAdComponent style={{ marginTop: 16, marginBottom: 16 }} />
      )}
    </ScrollView>
  );
};

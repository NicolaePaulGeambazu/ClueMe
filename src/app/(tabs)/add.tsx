import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Calendar, Clock, MapPin, Tag, Star, X, CheckSquare, CreditCard, Pill, FileText, User, Bell, Repeat, ChevronRight, Save } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useReminders } from '../../hooks/useReminders';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import { useFamily } from '../../contexts/FamilyContext';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { RepeatOptions } from '../../components/ReminderForm/RepeatOptions';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { Plus } from 'lucide-react-native';
import { FALLBACK_TASK_TYPES } from '../../constants/config';

export default function AddScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();
  const { createReminder, useFirebase } = useReminders();
  const { taskTypes, isLoading: taskTypesLoading, seedDefaultTaskTypes } = useTaskTypes();
  const { familyMembers } = useFamily();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as string,
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    dueTime: '',
    location: '',
    tags: [] as string[],
    isFavorite: false,
    hasNotification: true,
    isRecurring: false,
    assignedTo: '' as string,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [repeatPattern, setRepeatPattern] = useState('daily');
  const [customInterval, setCustomInterval] = useState(1);
  
  const styles = createStyles(colors);

  // Prefill form data if passed from navigation
  useEffect(() => {
    if (route.params?.prefillTime) {
      setFormData(prev => ({ ...prev, dueTime: route.params.prefillTime }));
    }
    if (route.params?.prefillDate) {
      setFormData(prev => ({ ...prev, dueDate: route.params.prefillDate }));
    }
  }, [route.params]);

  // Seed default task types if none exist
  useEffect(() => {
    if (taskTypes.length === 0 && !taskTypesLoading && user?.uid) {
      console.log('🌱 No task types found, seeding defaults...');
      seedDefaultTaskTypes().catch(console.error);
    }
  }, [taskTypes.length, taskTypesLoading, user?.uid, seedDefaultTaskTypes]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert(t('common.error'), t('add.error.titleRequired'));
      return;
    }

    // Check if user is authenticated
    if (!user?.uid) {
      Alert.alert(t('common.error'), t('add.error.authRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await createReminder({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type as any,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        dueTime: formData.dueTime || undefined,
        location: formData.location.trim() || undefined,
        tags: formData.tags,
        isFavorite: formData.isFavorite,
        hasNotification: formData.hasNotification,
        isRecurring: formData.isRecurring,
        assignedTo: formData.assignedTo || undefined,
        completed: false,
        userId: user.uid,
      });

      Alert.alert(t('common.success'), t('add.error.success'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('index') }
      ]);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert(t('common.error'), t('add.error.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWithAuth = () => {
    if (isAnonymous) {
      setShowLoginPrompt(true);
      return;
    }
    handleSave();
  };

  const handleLoginSuccess = () => {
    executeAfterAuth(handleSave);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Use Firebase task types if available, otherwise use fallback
  const availableTaskTypes = taskTypes.length > 0 ? taskTypes : FALLBACK_TASK_TYPES;
  
  const typeOptions = availableTaskTypes.map(taskType => ({
    id: 'name' in taskType ? taskType.name : taskType.id,
    label: taskType.label,
    icon: getIconComponent('icon' in taskType ? taskType.icon : 'CheckSquare'),
    color: taskType.color,
  }));

  const priorityOptions = [
    { id: 'low', label: t('priorities.low'), color: colors.success },
    { id: 'medium', label: t('priorities.medium'), color: colors.warning },
    { id: 'high', label: t('priorities.high'), color: colors.error },
  ];

  // Helper function to get icon component
  function getIconComponent(iconName: string) {
    switch (iconName) {
      case 'CheckSquare': return CheckSquare;
      case 'CreditCard': return CreditCard;
      case 'Pill': return Pill;
      case 'Calendar': return Calendar;
      case 'FileText': return FileText;
      default: return CheckSquare; // fallback
    }
  }

  if (showLoginPrompt) {
    return <LoginPrompt visible={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} onSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add.title')}</Text>
        <TouchableOpacity 
          onPress={handleSaveWithAuth} 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={[styles.saveButtonText, styles.saveButtonTextDisabled]}>
              {t('add.saving')}
            </Text>
          ) : (
            <Save size={20} color={colors.primary} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAnonymous && (
          <View style={styles.anonymousBanner}>
            <Text style={styles.anonymousText}>
              {t('add.anonymousBanner')}
            </Text>
            <TouchableOpacity onPress={() => setShowLoginPrompt(true)} style={styles.signInButton}>
              <Text style={styles.signInButtonText}>{t('add.signIn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder={t('add.titlePlaceholder')}
              value={formData.title}
              onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholderTextColor={colors.textTertiary}
              multiline
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.type')}</Text>
            <View style={styles.typeContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeScrollContainer}
                style={styles.typeScrollView}
              >
                {typeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.typeOption,
                        formData.type === option.id && { 
                          backgroundColor: option.color + '20', 
                          borderColor: option.color,
                          shadowOpacity: 0.15,
                          shadowColor: option.color,
                        }
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type: option.id }))}
                    >
                      <IconComponent size={20} color={option.color} strokeWidth={2} />
                      <Text style={[styles.typeLabel, formData.type === option.id && { color: option.color }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.priority')}</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.priorityOption,
                    formData.priority === option.id && { backgroundColor: option.color + '15', borderColor: option.color }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, priority: option.id as any }))}
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text style={[styles.priorityLabel, formData.priority === option.id && { color: option.color }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.dateTime')}</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.textSecondary} />
                <Text style={[styles.input, !formData.dueDate && { color: colors.textTertiary }]}>
                  {formData.dueDate || t('add.selectDate')}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={colors.textSecondary} />
                <Text style={[styles.input, !formData.dueTime && { color: colors.textTertiary }]}>
                  {formData.dueTime || t('add.selectTime')}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.location')}</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder={t('add.locationPlaceholder')}
                value={formData.location}
                onChangeText={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.tags')}</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tagInputRow}>
                <View style={styles.tagInputContainer}>
                  <Tag size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.tagInput}
                    placeholder={t('add.tagPlaceholder')}
                    value={newTag}
                    onChangeText={setNewTag}
                    onSubmitEditing={addTag}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {formData.tags.length > 0 && (
                <View style={styles.tagsList}>
                  {formData.tags.map((tag, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)} style={styles.removeTagButton}>
                        <X size={14} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('add.assignTo')}</Text>
            {familyMembers && familyMembers.length > 0 ? (
              <View style={styles.familyMembersContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.familyMembersScrollContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.familyMemberOption,
                      !formData.assignedTo && styles.familyMemberOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, assignedTo: '' }))}
                  >
                    <User size={16} color={!formData.assignedTo ? colors.primary : colors.textSecondary} />
                    <Text style={[
                      styles.familyMemberLabel,
                      !formData.assignedTo && styles.familyMemberLabelSelected
                    ]}>
                      {t('add.unassigned')}
                    </Text>
                  </TouchableOpacity>
                  
                  {familyMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.familyMemberOption,
                        formData.assignedTo === member.id && styles.familyMemberOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, assignedTo: member.id }))}
                    >
                      <User size={16} color={formData.assignedTo === member.id ? colors.primary : colors.textSecondary} />
                      <Text style={[
                        styles.familyMemberLabel,
                        formData.assignedTo === member.id && styles.familyMemberLabelSelected
                      ]}>
                        {member.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <User size={20} color={colors.textSecondary} />
                <Text style={[styles.input, !formData.assignedTo && { color: colors.textTertiary }]}>
                  {formData.assignedTo || t('add.assignToPlaceholder')}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Star size={20} color={colors.warning} />
                <Text style={styles.switchLabel}>{t('add.favorite')}</Text>
              </View>
              <Switch
                value={formData.isFavorite}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isFavorite: value }))}
                trackColor={{ false: colors.border, true: colors.warning + '40' }}
                thumbColor={formData.isFavorite ? colors.warning : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Bell size={20} color={colors.primary} />
                <Text style={styles.switchLabel}>{t('add.notifications')}</Text>
              </View>
              <Switch
                value={formData.hasNotification}
                onValueChange={(value) => setFormData(prev => ({ ...prev, hasNotification: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={formData.hasNotification ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Repeat size={20} color={colors.secondary} />
                <Text style={styles.switchLabel}>{t('add.recurring')}</Text>
              </View>
              <Switch
                value={formData.isRecurring}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isRecurring: value }))}
                trackColor={{ false: colors.border, true: colors.secondary + '40' }}
                thumbColor={formData.isRecurring ? colors.secondary : colors.textSecondary}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              setFormData(prev => ({ ...prev, dueDate: formatDate(date) }));
            }
          }}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowTimePicker(false);
            if (time) {
              setSelectedTime(time);
              setFormData(prev => ({ ...prev, dueTime: formatTime(time) }));
            }
          }}
        />
      )}
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
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 20,
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: colors.borderLight,
    borderColor: colors.border,
  },
  saveButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.primary,
  },
  saveButtonTextDisabled: {
    color: colors.textTertiary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  anonymousBanner: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  anonymousText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  signInButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  signInButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  form: {
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  titleInput: {
    fontFamily: Fonts.text.regular,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 60,
  },
  typeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  typeScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  typeScrollView: {
    marginHorizontal: -16,
  },
  typeOption: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 90,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  typeLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  priorityLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  descriptionInput: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  tagInput: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  addTagButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  tagText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.primary,
  },
  removeTagButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
  },
  familyMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  familyMembersScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  familyMemberOption: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  familyMemberOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  familyMemberLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  familyMemberLabelSelected: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});
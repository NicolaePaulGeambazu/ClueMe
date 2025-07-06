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
  ScrollView,
  Switch,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../hooks/useFamily';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ReminderWizardProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminder: any) => void;
  initialData?: any;
  initialStep?: number;
}

export default function ReminderWizard({
  visible,
  onClose,
  onSave,
  initialData,
  initialStep = 1,
}: ReminderWizardProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { members } = useFamily();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Simple state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    dueTime: '15:00',
    isAllDay: false,
    isRecurring: false,
    repeatPattern: 'none',
    assignedTo: [] as string[],
    category: 'task',
    priority: 'medium',
    hasNotification: true,
    notificationTimings: [{ type: 'before', value: 15, label: '15 minutes before' }],
  });

  // Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showFamilyPicker, setShowFamilyPicker] = useState(false);

  // Initialize when modal opens
  useEffect(() => {
    if (visible && initialData) {
      console.log('🔄 ReminderWizard: Setting up with data:', initialData);
      
      // Convert data
      const convertedData = {
        title: initialData.title || '',
        description: initialData.description || '',
        dueDate: initialData.dueDate || getDateFromSelection(initialData.selectedDate || 'today'),
        dueTime: initialData.dueTime || getTimeFromSelection(initialData.selectedTime || 'in1hour'),
        isAllDay: false,
        isRecurring: false,
        repeatPattern: 'none',
        assignedTo: [] as string[],
        category: 'task',
        priority: 'medium',
        hasNotification: true,
        notificationTimings: [{ type: 'before', value: 15, label: '15 minutes before' }],
      };

      setFormData(convertedData);
      
      // Set step based on title
      const step = (initialData.title && initialData.title.trim()) ? 2 : 1;
      setCurrentStep(step);
      console.log('🔄 ReminderWizard: Set to step', step);
    }
  }, [visible, initialData]);

  // Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentStep(1);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date(),
        dueTime: '15:00',
        isAllDay: false,
        isRecurring: false,
        repeatPattern: 'none',
        assignedTo: [] as string[],
        category: 'task',
        priority: 'medium',
        hasNotification: true,
        notificationTimings: [{ type: 'before', value: 15, label: '15 minutes before' }],
      });
    }
  }, [visible]);

  // Helper functions
  const getDateFromSelection = (selection: string): Date => {
    const now = new Date();
    switch (selection) {
      case 'today': return now;
      case 'tomorrow': 
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      case 'thisWeekend':
        const saturday = new Date(now);
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
        saturday.setDate(now.getDate() + daysUntilSaturday);
        return saturday;
      case 'nextWeek':
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        return nextWeek;
      default: return now;
    }
  };

  const getTimeFromSelection = (selection: string): string => {
    const now = new Date();
    switch (selection) {
      case 'now':
        const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);
        return `${in5Minutes.getHours().toString().padStart(2, '0')}:${in5Minutes.getMinutes().toString().padStart(2, '0')}`;
      case 'in1hour':
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        return `${in1Hour.getHours().toString().padStart(2, '0')}:${in1Hour.getMinutes().toString().padStart(2, '0')}`;
      case 'lunch': return '12:00';
      case 'afternoon': return '14:00';
      case 'dinner': return '18:00';
      case 'bedtime': return '21:00';
      case 'tomorrow': return '09:00';
      default: return '14:00';
    }
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    const reminder = {
      ...formData,
      title: formData.title.trim(),
      userId: user?.uid,
      status: 'pending',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    onSave(reminder);
    onClose();
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Family member assignment functions
  const handleFamilyMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter(id => id !== memberId)
        : [...prev.assignedTo, memberId]
    }));
  };

  const getRepeatPatternText = () => {
    if (!formData.isRecurring || formData.repeatPattern === 'none') {
      return t('wizard.doesNotRepeat');
    }
    
    const patternLabels: { [key: string]: string } = {
      'daily': 'Daily',
      'weekly': 'Weekly', 
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'none': t('wizard.doesNotRepeat')
    };
    
    return patternLabels[formData.repeatPattern] || t('wizard.doesNotRepeat');
  };

  const getAssignedMembersText = () => {
    if (formData.assignedTo.length === 0) {
      return t('wizard.assignToMe');
    }
    
    const assignedMembers = members.filter((member: any) => 
      formData.assignedTo.includes(member.id)
    );
    
    if (assignedMembers.length === 1) {
      return `👤 ${assignedMembers[0].name}`;
    } else if (assignedMembers.length > 1) {
      return `👥 ${assignedMembers.length} members`;
    }
    
    return t('wizard.assignToMe');
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 1, label: t('wizard.schedule') },
      { key: 2, label: t('wizard.repeatAssign') },
      { key: 3, label: t('wizard.organize') },
    ];

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              { backgroundColor: currentStep >= step.key ? colors.primary : colors.border }
            ]}>
              {currentStep > step.key ? (
                <Check size={16} color="white" strokeWidth={2} />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  { color: currentStep >= step.key ? 'white' : colors.textSecondary }
                ]}>
                  {step.key}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: currentStep > step.key ? colors.primary : colors.border }
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    console.log('🔄 ReminderWizard: Rendering step', currentStep);
    
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('wizard.schedule')}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.title')}
              </Text>
              <TextInput
                style={[styles.titleInput, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                }]}
                placeholder={t('wizard.titlePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                autoFocus
                multiline
                maxLength={100}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.date')}
              </Text>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formatDate(formData.dueDate)}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.time')}
              </Text>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formatTimeOnly(formData.dueTime)}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>
                {t('wizard.allDayEvent')}
              </Text>
              <Switch
                value={formData.isAllDay}
                onValueChange={(value) => updateFormData('isAllDay', value)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={formData.isAllDay ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('wizard.repeatAssign')}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.repeat')}
              </Text>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => setShowRepeatPicker(true)}
              >
                <Calendar size={20} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {getRepeatPatternText()}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.assignTo')}
              </Text>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => setShowFamilyPicker(true)}
              >
                <Users size={20} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {getAssignedMembersText()}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('wizard.organize')}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.category')}
              </Text>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Tag size={20} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('wizard.priority')}
              </Text>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: formData.priority === priority ? colors.primary : colors.surface,
                        borderColor: formData.priority === priority ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => updateFormData('priority', priority)}
                  >
                    <Text style={[
                      styles.priorityText,
                      { 
                        color: formData.priority === priority ? 'white' : colors.text,
                        fontFamily: formData.priority === priority ? Fonts.text.semibold : Fonts.text.regular,
                      }
                    ]}>
                      {t(`wizard.priority${priority.charAt(0).toUpperCase() + priority.slice(1)}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>
                {t('wizard.reminderAlert')}
              </Text>
              <Switch
                value={formData.hasNotification}
                onValueChange={(value) => updateFormData('hasNotification', value)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={formData.hasNotification ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Step {currentStep} - Unknown
            </Text>
          </View>
        );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[styles.overlay, { opacity: opacityAnim }]}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight, 0],
                }),
              }],
            },
          ]}
        >
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('wizard.createReminder')}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {renderStepIndicator()}

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[styles.footerButton, styles.secondaryButton]}
                onPress={prevStep}
              >
                <ChevronLeft size={20} color={colors.text} strokeWidth={2} />
                <Text style={[styles.footerButtonText, { color: colors.text }]}>
                  {t('wizard.back')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  marginLeft: currentStep > 1 ? 12 : 0,
                },
              ]}
              onPress={currentStep === 3 ? handleSave : nextStep}
            >
              <Text style={[styles.footerButtonText, { color: 'white' }]}>
                {currentStep === 3 ? t('wizard.create') : t('wizard.next')}
              </Text>
              {currentStep < 3 && (
                <ChevronRight size={20} color="white" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {t('wizard.selectDate')}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {[
                  { label: 'Today', value: new Date() },
                  { label: 'Tomorrow', value: new Date(Date.now() + 24 * 60 * 60 * 1000) },
                  { label: 'This weekend', value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                  { label: 'Next week', value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                ].map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateFormData('dueDate', option.value);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Time Picker Modal */}
        {showTimePicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {t('wizard.selectTime')}
                </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {[
                  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
                  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
                ].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateFormData('dueTime', time);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Repeat Picker Modal */}
        {showRepeatPicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {t('wizard.selectRepeat')}
                </Text>
                <TouchableOpacity onPress={() => setShowRepeatPicker(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {[
                  { label: 'Does not repeat', value: 'none' },
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateFormData('repeatPattern', option.value);
                      updateFormData('isRecurring', option.value !== 'none');
                      setShowRepeatPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {t('wizard.selectCategory')}
                </Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {[
                  'task', 'meeting', 'appointment', 'birthday', 'anniversary', 'other'
                ].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.pickerOption}
                    onPress={() => {
                      updateFormData('category', category);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Family Member Picker Modal */}
        {showFamilyPicker && (
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>
                  {t('wizard.assignTo')}
                </Text>
                <TouchableOpacity onPress={() => setShowFamilyPicker(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerContent}>
                {members.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.pickerOption,
                      formData.assignedTo.includes(member.id) && {
                        backgroundColor: colors.primary + '20',
                        borderLeftWidth: 3,
                        borderLeftColor: colors.primary,
                      }
                    ]}
                    onPress={() => handleFamilyMemberToggle(member.id)}
                  >
                    <View style={styles.familyMemberOption}>
                      <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                        {member.name}
                      </Text>
                      {formData.assignedTo.includes(member.id) && (
                        <Check size={16} color={colors.primary} strokeWidth={2} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.semibold,
  },
  placeholder: {
    width: 32,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.medium,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.medium,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    flex: 1,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.medium,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    // backgroundColor set inline
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerButtonText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.semibold,
  },
  // Picker styles
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.semibold,
    flex: 1,
  },
  pickerContent: {
    maxHeight: 300,
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
  },
  familyMemberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
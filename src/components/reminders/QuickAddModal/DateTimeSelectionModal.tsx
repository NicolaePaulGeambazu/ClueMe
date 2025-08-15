import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { X, Calendar, Clock, Check, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { Fonts, FontSizes } from '../../../constants/Fonts';
import { formatDate } from '../../../utils/dateUtils';
import { CustomDateTimePickerModal } from '../../ReminderForm/CustomDateTimePicker';

interface DateOption {
  value: string;
  label: string;
  description: string;
}

interface TimeOption {
  value: string;
  label: string;
  description: string;
  time: string;
}

interface DateTimeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateValue: string, timeValue: string, customDate: Date | null, customTime: string) => void;
  currentDate: string;
  currentTime: string;
  customDateValue: Date | null;
  customTimeValue: string;
  dateOptions: DateOption[];
  timeOptions: TimeOption[];
  colors: any;
  modalState: null | 'main' | 'customDate' | 'customTime';
  setModalState: (state: null | 'main' | 'customDate' | 'customTime') => void;
  setTempDate: (date: string) => void;
  setTempTime: (time: string) => void;
  setTempCustomDate: (date: Date | null) => void;
  setTempCustomTime: (time: string) => void;
  tempDate: string;
  tempTime: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const DateTimeSelectionModal: React.FC<DateTimeSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentDate,
  currentTime,
  dateOptions,
  timeOptions,
  colors,
  modalState,
  setModalState,
  setTempDate,
  setTempTime,
  setTempCustomDate,
  setTempCustomTime,
  customDateValue,
  customTimeValue,
  tempDate,
  tempTime,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const contentSlideAnim = useRef(new Animated.Value(50)).current;

  // Local state for selections
  const [activeSection, setActiveSection] = useState<'date' | 'time'>('date');

  // Reset selections when modal opens
  useEffect(() => {
    if (visible) {
      setTempDate(currentDate);
      setTempTime(currentTime);
      setActiveSection('date');
    }
  }, [visible, currentDate, currentTime]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0.9);
      contentSlideAnim.setValue(50);

      // Beautiful entrance animation with multiple phases
      Animated.sequence([
        // Phase 1: Fade in overlay
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Phase 2: Modal slides up with spring effect
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
        }),
        // Phase 3: Content slides in and scales up
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
          Animated.spring(contentSlideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 8,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
        ]),
      ]).start();
    } else {
      // Elegant exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, contentSlideAnim]);

  const handleConfirm = () => {
    onConfirm(
      tempDate,
      tempTime,
      tempDate === 'custom' ? customDateValue : null,
      tempTime === 'custom' ? customTimeValue : ''
    );
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleDateSelect = (value: string) => {
    setTempDate(value);
    if (value === 'custom') {
      setModalState('customDate');
    }
  };

  const handleTimeSelect = (value: string) => {
    setTempTime(value);
    if (value === 'custom') {
      setModalState('customTime');
    }
  };

  const handleCustomDateConfirm = (date: Date) => {
    setTempCustomDate(date);
    setModalState('main');
  };

  const handleCustomTimeConfirm = (date: Date) => {
    // Convert date to time string (e.g., '2:30 PM')
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    setTempCustomTime(timeString);
    setModalState('main');
  };

  const getDateLabel = () => {
    if (tempDate === 'custom') {
      return formatDate(customDateValue);
    }
    const option = dateOptions.find(opt => opt.value === tempDate);
    return option?.label || t('quickAdd.today');
  };

  const getTimeLabel = () => {
    if (tempTime === 'custom') {
      return customTimeValue || t('quickAdd.pickTime');
    }
    const option = timeOptions.find(opt => opt.value === tempTime);
    return option?.time || option?.label || t('quickAdd.in1Hour');
  };

  const styles = createStyles(colors, insets);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar
        barStyle={colors.background === '#000000' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            backgroundColor: `rgba(0, 0, 0, ${fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            })})`,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={[
              styles.safeArea,
              {
                transform: [{ translateY: contentSlideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel={t('quickAdd.cancel')}
                accessibilityRole="button"
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                {t('quickAdd.whenShouldThisHappen')}
              </Text>

              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleConfirm}
                accessibilityLabel={t('quickAdd.done')}
                accessibilityRole="button"
              >
                <Text style={styles.doneButtonText}>{t('quickAdd.done')}</Text>
              </TouchableOpacity>
            </View>

            {/* Visual Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryDate}>
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.summaryDateText}>{getDateLabel()}</Text>
              </View>
              <View style={styles.summaryTime}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.summaryTimeText}>{getTimeLabel()}</Text>
              </View>
              {/* Visual indicator */}
              <View style={[styles.summaryIndicator, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.summaryIndicatorText, { color: colors.primary }]}>
                  {activeSection === 'date' ? '📅' : '⏰'}
                </Text>
              </View>
            </View>

            {/* Section Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSection === 'date' && styles.activeTab,
                ]}
                onPress={() => setActiveSection('date')}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeSection === 'date' }}
              >
                <Calendar size={20} color={activeSection === 'date' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.tabText,
                  activeSection === 'date' && styles.activeTabText,
                ]}>
                  {t('quickAdd.date')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeSection === 'time' && styles.activeTab,
                ]}
                onPress={() => setActiveSection('time')}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeSection === 'time' }}
              >
                <Clock size={20} color={activeSection === 'time' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.tabText,
                  activeSection === 'time' && styles.activeTabText,
                ]}>
                  {t('quickAdd.time')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
            >
              {activeSection === 'date' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('quickAdd.selectDate')}</Text>

                  <View style={styles.optionsGrid}>
                    {dateOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionCard,
                          tempDate === option.value && styles.selectedOptionCard,
                        ]}
                        onPress={() => handleDateSelect(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: tempDate === option.value }}
                      >
                        <View style={styles.optionCardContent}>
                          <View style={styles.optionCardHeader}>
                            <Text style={[
                              styles.optionCardTitle,
                              tempDate === option.value && styles.selectedOptionCardTitle,
                            ]}>
                              {option.label}
                            </Text>
                            {option.value === 'custom' && (
                              <CalendarDays size={16} color={tempDate === option.value ? colors.primary : colors.textTertiary} />
                            )}
                          </View>
                          <Text style={[
                            styles.optionCardDescription,
                            tempDate === option.value && styles.selectedOptionCardDescription,
                          ]}>
                            {option.description}
                          </Text>
                        </View>

                        {tempDate === option.value && (
                          <View style={styles.selectedIndicator}>
                            <Check size={16} color={colors.primary} strokeWidth={2} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('quickAdd.selectTime')}</Text>

                  <View style={styles.optionsGrid}>
                    {timeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionCard,
                          tempTime === option.value && styles.selectedOptionCard,
                        ]}
                        onPress={() => handleTimeSelect(option.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: tempTime === option.value }}
                      >
                        <View style={styles.optionCardContent}>
                          <View style={styles.optionCardHeader}>
                            <Text style={[
                              styles.optionCardTitle,
                              tempTime === option.value && styles.selectedOptionCardTitle,
                            ]}>
                              {option.time || option.label}
                            </Text>
                            {option.value === 'custom' && (
                              <Clock size={16} color={tempTime === option.value ? colors.primary : colors.textTertiary} />
                            )}
                          </View>
                          <Text style={[
                            styles.optionCardDescription,
                            tempTime === option.value && styles.selectedOptionCardDescription,
                          ]}>
                            {option.description}
                          </Text>
                        </View>

                        {tempTime === option.value && (
                          <View style={styles.selectedIndicator}>
                            <Check size={16} color={colors.primary} strokeWidth={2} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Custom Date Picker Modal */}
      <CustomDateTimePickerModal
        visible={modalState === 'customDate'}
        onClose={() => setModalState('main')}
        onConfirm={handleCustomDateConfirm}
        initialDate={customDateValue || new Date()}
        mode="date"
        colors={colors}
      />

      {/* Custom Time Picker Modal */}
      <CustomDateTimePickerModal
        visible={modalState === 'customTime'}
        onClose={() => setModalState('main')}
        onConfirm={handleCustomTimeConfirm}
        initialDate={new Date()}
        mode="time"
        colors={colors}
      />
    </Modal>
  );
};

const createStyles = (colors: any, insets: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '60%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.bodySemibold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
    color: colors.primary,
  },
  summaryCard: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  summaryDateText: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.bodySemibold,
    color: colors.text,
  },
  summaryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 32,
  },
  summaryTimeText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
    color: colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.bodySemibold,
    color: colors.text,
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selectedOptionCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionCardContent: {
    flex: 1,
  },
  optionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionCardTitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
    color: colors.text,
  },
  selectedOptionCardTitle: {
    color: colors.primary,
  },
  optionCardDescription: {
    fontSize: FontSizes.footnote,
    fontFamily: Fonts.body,
    color: colors.textSecondary,
  },
  selectedOptionCardDescription: {
    color: colors.primary + 'CC',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIndicatorText: {
    fontSize: 20,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Trash2, AlertTriangle, X, CheckCircle, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { Reminder } from '../../services/firebaseService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmRecurring?: (deleteAll: boolean) => void;
  title: string;
  message: string;
  itemName?: string;
  isRecurring?: boolean;
  reminder?: Reminder;
  type?: 'reminder' | 'list' | 'item' | 'account';
  destructive?: boolean;
}

export default function DeleteConfirmationModal({
  visible,
  onClose,
  onConfirm,
  onConfirmRecurring,
  title,
  message,
  itemName,
  isRecurring = false,
  reminder,
  type = 'reminder',
  destructive = true,
}: DeleteConfirmationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.9)).current;

  const styles = createStyles(colors);

  useEffect(() => {
    if (visible) {
      // Simple entrance animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Simple exit animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleRecurringConfirm = (deleteAll: boolean) => {
    onConfirmRecurring?.(deleteAll);
  };

  const getIcon = () => {
    switch (type) {
      case 'account':
        return <AlertTriangle size={32} color={colors.error} strokeWidth={2} />;
      case 'list':
        return <Trash2 size={32} color={colors.error} strokeWidth={2} />;
      case 'item':
        return <Trash2 size={32} color={colors.error} strokeWidth={2} />;
      default:
        return <Trash2 size={32} color={colors.error} strokeWidth={2} />;
    }
  };

  const getRecurringDescription = () => {
    if (!reminder || !reminder.isRecurring) {return null;}

    const pattern = reminder.repeatPattern;
    const interval = reminder.customInterval || 1;

    let description = '';
    switch (pattern) {
      case 'daily':
        description = interval === 1 ? 'Daily' : `Every ${interval} days`;
        break;
      case 'weekly':
        description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
        break;
      case 'monthly':
        description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
        break;
      case 'yearly':
        description = interval === 1 ? 'Yearly' : `Every ${interval} years`;
        break;
      default:
        description = 'Recurring';
    }

    if (reminder.recurringEndDate) {
      const endDate = new Date(reminder.recurringEndDate);
      const endDateStr = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: endDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
      description += ` until ${endDateStr}`;
    }

    return description;
  };

  if (!visible) {return null;}

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              {/* Icon */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: iconScaleAnim }],
                  },
                ]}
              >
                {getIcon()}
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Item Name */}
              {itemName && (
                <View style={styles.itemNameContainer}>
                  <Text style={styles.itemName}>{itemName}</Text>
                </View>
              )}

              {/* Recurring Info */}
              {isRecurring && reminder && (
                <View style={styles.recurringInfo}>
                  <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.recurringText}>
                    {getRecurringDescription()}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {isRecurring ? (
                  // Recurring reminder options
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={onClose}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.confirmButton]}
                      onPress={() => handleRecurringConfirm(false)}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={16} color={colors.background} strokeWidth={2} />
                      <Text style={styles.confirmButtonText}>
                        {t('reminders.deleteThisOnly')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.destructiveButton]}
                      onPress={() => handleRecurringConfirm(true)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={16} color={colors.background} strokeWidth={2} />
                      <Text style={styles.destructiveButtonText}>
                        {t('reminders.deleteAllFuture')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Regular delete options
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={onClose}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        destructive ? styles.destructiveButton : styles.confirmButton,
                      ]}
                      onPress={handleConfirm}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={16} color={colors.background} strokeWidth={2} />
                      <Text
                        style={
                          destructive ? styles.destructiveButtonText : styles.confirmButtonText
                        }
                      >
                        {t('reminders.delete')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
                          </TouchableOpacity>
            </View>
          </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    overlayTouchable: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: Math.min(screenWidth - 40, 400),
      backgroundColor: colors.background,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
      overflow: 'hidden',
    },
    modalContent: {
      padding: 24,
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 1,
      padding: 4,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.error + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontFamily: Fonts.text.bold,
      fontSize: FontSizes.title2,
      lineHeight: LineHeights.title2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    message: {
      fontFamily: Fonts.text.regular,
      fontSize: FontSizes.body,
      lineHeight: LineHeights.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    itemNameContainer: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    itemName: {
      fontFamily: Fonts.text.medium,
      fontSize: FontSizes.body,
      lineHeight: LineHeights.body,
      color: colors.text,
      textAlign: 'center',
    },
    recurringInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 24,
      alignSelf: 'stretch',
    },
    recurringText: {
      fontFamily: Fonts.text.medium,
      fontSize: FontSizes.caption1,
      lineHeight: LineHeights.caption1,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
      alignSelf: 'stretch',
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.surface,
    },
    cancelButtonText: {
      fontFamily: Fonts.text.medium,
      fontSize: FontSizes.body,
      lineHeight: LineHeights.body,
      color: colors.textSecondary,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    confirmButtonText: {
      fontFamily: Fonts.text.medium,
      fontSize: FontSizes.body,
      lineHeight: LineHeights.body,
      color: colors.background,
    },
    destructiveButton: {
      backgroundColor: colors.error,
    },
    destructiveButtonText: {
      fontFamily: Fonts.text.medium,
      fontSize: FontSizes.body,
      lineHeight: LineHeights.body,
      color: colors.background,
    },
  });

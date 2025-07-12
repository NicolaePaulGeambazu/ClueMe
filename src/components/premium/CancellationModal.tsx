import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  AlertTriangle,
  Calendar,
  Shield,
  Heart,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { usePremium } from '../../hooks/usePremium';
import { revenueCatService } from '../../services/revenueCatService';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';

const { width } = Dimensions.get('window');

interface CancellationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmCancellation: () => void;
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 20,
    marginHorizontal: 24,
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title2,
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  warningIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  warningDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  consequencesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 12,
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consequenceIcon: {
    marginRight: 12,
  },
  consequenceText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
  alternativesSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  alternativesTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 12,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeIcon: {
    marginRight: 12,
  },
  alternativeText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
  },
  keepButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
  },
  infoText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default function CancellationModal({
  visible,
  onClose,
  onConfirmCancellation,
}: CancellationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancellation = async () => {
    Alert.alert(
      t('settings.finalCancellationConfirm'),
      t('settings.finalCancellationDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.cancelSubscription'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const result = await revenueCatService.cancelSubscription();
              
              if (result.success) {
                onConfirmCancellation();
                onClose();
              } else if (result.manualInstructions) {
                // Show manual instructions to the user
                Alert.alert(
                  t('settings.manualCancellationTitle'),
                  result.manualInstructions,
                  [
                    { text: t('common.ok'), onPress: onClose },
                    { text: t('settings.tryAgain'), onPress: () => setIsCancelling(false) }
                  ]
                );
              }
            } catch (error) {
              console.error('Failed to cancel subscription:', error);
              Alert.alert(
                t('settings.cancellationError'),
                t('settings.cancellationErrorDescription'),
                [{ text: t('common.ok') }]
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {t('settings.cancelSubscription')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Warning Icon */}
              <AlertTriangle 
                size={48} 
                color={colors.error} 
                strokeWidth={2} 
                style={styles.warningIcon}
              />

              {/* Warning Title */}
              <Text style={styles.warningTitle}>
                {t('settings.cancelSubscriptionTitle')}
              </Text>

              {/* Warning Description */}
              <Text style={styles.warningDescription}>
                {t('settings.cancelSubscriptionWarning')}
              </Text>

              {/* Consequences */}
              <View style={styles.consequencesSection}>
                <Text style={styles.sectionTitle}>
                  {t('settings.whatYouWillLose')}
                </Text>
                
                <View style={styles.consequenceItem}>
                  <Calendar size={16} color={colors.error} strokeWidth={2} style={styles.consequenceIcon} />
                  <Text style={styles.consequenceText}>
                    {t('settings.loseUnlimitedReminders')}
                  </Text>
                </View>
                
                <View style={styles.consequenceItem}>
                  <Shield size={16} color={colors.error} strokeWidth={2} style={styles.consequenceIcon} />
                  <Text style={styles.consequenceText}>
                    {t('settings.loseAdvancedFeatures')}
                  </Text>
                </View>
                
                <View style={styles.consequenceItem}>
                  <Heart size={16} color={colors.error} strokeWidth={2} style={styles.consequenceIcon} />
                  <Text style={styles.consequenceText}>
                    {t('settings.loseFamilySharing')}
                  </Text>
                </View>
              </View>

              {/* Alternatives */}
              <View style={styles.alternativesSection}>
                <Text style={styles.alternativesTitle}>
                  {t('settings.considerAlternatives')}
                </Text>
                
                <View style={styles.alternativeItem}>
                  <Shield size={16} color={colors.primary} strokeWidth={2} style={styles.alternativeIcon} />
                  <Text style={styles.alternativeText}>
                    {t('settings.changeToCheaperPlan')}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleConfirmCancellation}
                  disabled={isCancelling}
                >
                  <Text style={styles.cancelButtonText}>
                    {isCancelling ? t('settings.cancelling') : t('settings.cancelSubscription')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.keepButton}
                  onPress={onClose}
                  disabled={isCancelling}
                >
                  <Text style={styles.keepButtonText}>
                    {t('settings.keepSubscription')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.infoText}>
                {t('settings.cancellationInfo')}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
} 
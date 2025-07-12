import React, { useState, useEffect } from 'react';
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
  Crown,
  CheckCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { usePremium } from '../../hooks/usePremium';
import { revenueCatService } from '../../services/revenueCatService';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import PlanSelectionModal from './PlanSelectionModal';
import CancellationModal from './CancellationModal';

const { width } = Dimensions.get('window');

interface SubscriptionManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  currentPlanCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPlanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  currentPlanStatus: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.success,
  },
  planDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planDetailLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  planDetailValue: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.footnote,
    color: colors.text,
  },
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  actionButtonDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '20',
  },
  cancelButtonIcon: {
    backgroundColor: colors.error + '15',
  },
  cancelButtonText: {
    color: colors.error,
  },
  infoCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.warning + '20',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.warning,
  },
  infoText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default function SubscriptionManagementModal({
  visible,
  onClose,
}: SubscriptionManagementModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const premium = usePremium();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    isActive: boolean;
    planName: string;
    expirationDate: Date | null;
    isInTrial: boolean;
    willRenew: boolean;
    trialDaysLeft: number;
    nextBillingDate: Date | null;
  } | null>(null);

  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSubscriptionInfo();
    }
  }, [visible]);

  const loadSubscriptionInfo = async () => {
    try {
      const info = await premium.getDetailedSubscriptionInfo();
      setSubscriptionInfo(info);
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  const handleChangePlan = () => {
    setShowPlanSelection(true);
  };

  const handleCancelSubscription = () => {
    setShowCancellation(true);
  };

  const handleConfirmCancellation = async () => {
    try {
      // Use RevenueCat service for cancellation
      await revenueCatService.cancelSubscription();
      onClose();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      Alert.alert(
        t('settings.cancellationError'),
        t('settings.cancellationErrorDescription')
      );
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return t('common.unknown');
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <SafeAreaView>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {t('settings.subscriptionManagement')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Current Plan */}
              {subscriptionInfo && (
                <View style={styles.currentPlanCard}>
                  <View style={styles.currentPlanHeader}>
                    <View style={styles.currentPlanIcon}>
                      <Crown size={20} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.currentPlanInfo}>
                      <Text style={styles.currentPlanTitle}>
                        {subscriptionInfo.planName}
                      </Text>
                      <Text style={styles.currentPlanStatus}>
                        {subscriptionInfo.isActive
                          ? t('settings.activeSubscription')
                          : t('settings.inactiveSubscription')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planDetails}>
                    {subscriptionInfo.expirationDate && (
                      <View style={styles.planDetailRow}>
                        <Text style={styles.planDetailLabel}>
                          {t('settings.nextBilling')}
                        </Text>
                        <Text style={styles.planDetailValue}>
                          {formatDate(subscriptionInfo.expirationDate)}
                        </Text>
                      </View>
                    )}
                    
                    {subscriptionInfo.isInTrial && (
                      <View style={styles.planDetailRow}>
                        <Text style={styles.planDetailLabel}>
                          {t('settings.trialDaysLeft')}
                        </Text>
                        <Text style={styles.planDetailValue}>
                          {subscriptionInfo.trialDaysLeft} {t('settings.days')}
                        </Text>
                      </View>
                    )}

                    <View style={styles.planDetailRow}>
                      <Text style={styles.planDetailLabel}>
                        {t('settings.autoRenew')}
                      </Text>
                      <Text style={styles.planDetailValue}>
                        {subscriptionInfo.willRenew
                          ? t('settings.enabled')
                          : t('settings.disabled')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Actions */}
              <Text style={styles.sectionTitle}>{t('settings.manageSubscription')}</Text>

              {/* Change Plan */}
              <TouchableOpacity style={styles.actionButton} onPress={handleChangePlan}>
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionButtonIcon}>
                    <CreditCard size={16} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.actionButtonText}>
                      {t('settings.changePlan')}
                    </Text>
                    <Text style={styles.actionButtonDescription}>
                      {t('settings.changePlanDescription')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>

              {/* Cancel Subscription */}
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelSubscription}
              >
                <View style={styles.actionButtonContent}>
                  <View style={[styles.actionButtonIcon, styles.cancelButtonIcon]}>
                    <AlertCircle size={16} color={colors.error} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      {t('settings.cancelSubscription')}
                    </Text>
                    <Text style={styles.actionButtonDescription}>
                      {t('settings.cancelSubscriptionDescription')}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
              </TouchableOpacity>

              {/* Info Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Info size={16} color={colors.warning} strokeWidth={2} style={styles.infoIcon} />
                  <Text style={styles.infoTitle}>{t('settings.important')}</Text>
                </View>
                <Text style={styles.infoText}>
                  {t('settings.subscriptionManagementInfo')}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        visible={showPlanSelection}
        onClose={() => setShowPlanSelection(false)}
        onPlanSelected={(planId) => {
          setShowPlanSelection(false);
          // Refresh subscription info after plan change
          loadSubscriptionInfo();
        }}
      />

      {/* Cancellation Modal */}
      <CancellationModal
        visible={showCancellation}
        onClose={() => setShowCancellation(false)}
        onConfirmCancellation={handleConfirmCancellation}
      />
    </Modal>
  );
} 
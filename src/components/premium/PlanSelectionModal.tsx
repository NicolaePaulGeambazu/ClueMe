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
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { usePremium } from '../../hooks/usePremium';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';

const { width } = Dimensions.get('window');

interface PlanSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onPlanSelected?: (planId: string) => void;
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
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedPlanCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  planPrice: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title3,
    color: colors.primary,
  },
  planInterval: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption2,
    color: colors.primary,
    marginLeft: 4,
  },
  currentPlanBadge: {
    backgroundColor: colors.success + '15',
  },
  currentPlanBadgeText: {
    color: colors.success,
  },
  planFeatures: {
    marginTop: 12,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  planFeatureIcon: {
    marginRight: 8,
  },
  planFeatureText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.text,
  },
  savingsBadge: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  savingsText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption2,
    color: colors.success,
  },
  selectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  selectButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
  },
  currentPlanButton: {
    backgroundColor: colors.success,
  },
  infoText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

export default function PlanSelectionModal({
  visible,
  onClose,
  onPlanSelected,
}: PlanSelectionModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const premium = usePremium();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadAvailablePlans();
    }
  }, [visible]);

  const loadAvailablePlans = async () => {
    try {
      // Get current subscription info to identify current plan
      const subscriptionInfo = await premium.getDetailedSubscriptionInfo();
      const allPlans = premium.plans;
      
      // Filter out the current plan
      const filteredPlans = allPlans.filter(plan => {
        // If user has no active subscription, show all plans
        if (!subscriptionInfo.isActive) return true;
        
        // If user has active subscription, exclude current plan
        if (subscriptionInfo.planName) {
          const currentPlanName = subscriptionInfo.planName.toLowerCase();
          const planName = plan.name.toLowerCase();
          
          // Exclude if it's the same plan type (monthly/yearly/weekly)
          if (currentPlanName.includes('monthly') && planName.includes('monthly')) return false;
          if (currentPlanName.includes('yearly') && planName.includes('yearly')) return false;
          if (currentPlanName.includes('weekly') && planName.includes('weekly')) return false;
        }
        
        return true;
      });
      
      setAvailablePlans(filteredPlans);
    } catch (error) {
      console.error('Failed to load available plans:', error);
      setAvailablePlans(premium.plans);
    }
  };

  const currentTier = premium.currentTier;

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirmSelection = () => {
    if (!selectedPlan) return;

    Alert.alert(
      t('settings.confirmPlanChange'),
      t('settings.confirmPlanChangeDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.changePlan'),
          onPress: async () => {
            try {
              const success = await premium.purchasePlan(selectedPlan);
              if (success) {
                Alert.alert(
                  t('settings.planChanged'),
                  t('settings.planChangedDescription'),
                  [{ text: t('common.ok'), onPress: onClose }]
                );
                onPlanSelected?.(selectedPlan);
              } else {
                Alert.alert(
                  'Plan Change Failed',
                  'Unable to change your plan. This might be because:\n\n• The selected plan is not available in your region\n• There was an issue with the payment system\n• The plan is not configured in the app store\n\nPlease try again or contact support.',
                  [{ text: t('common.ok') }]
                );
              }
            } catch (error) {
              console.error('Plan change error:', error);
              Alert.alert(
                'Plan Change Error',
                'An unexpected error occurred while changing your plan. Please try again or contact support.',
                [{ text: t('common.ok') }]
              );
            }
          },
        },
      ]
    );
  };

  const isCurrentPlan = (planId: string) => {
    // Check if this plan matches the current subscription
    if (currentTier === 'premium' || currentTier === 'pro') {
      // For now, assume any premium plan is current if user is premium
      return true;
    }
    return false;
  };

  const getPlanIcon = (planId: string) => {
    if (planId.includes('yearly')) {
      return <Star size={16} color={colors.primary} strokeWidth={2} />;
    }
    return <Sparkles size={16} color={colors.primary} strokeWidth={2} />;
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
                {t('settings.selectPlan')}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>
                {t('settings.chooseYourPlan')}
              </Text>

              {availablePlans.map((plan: any) => {
                const isCurrent = isCurrentPlan(plan.id);
                const isSelected = selectedPlan === plan.id;
                const hasSavings = plan.savings;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.selectedPlanCard,
                    ]}
                    onPress={() => handlePlanSelect(plan.id)}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                          <Text style={styles.planPrice}>
                            {plan.priceString}
                          </Text>
                          <Text style={styles.planInterval}>
                            /{plan.interval === 'monthly' ? t('settings.month') : 
                              plan.interval === 'yearly' ? t('settings.year') : 
                              t('settings.week')}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={[
                        styles.planBadge,
                        isCurrent && styles.currentPlanBadge
                      ]}>
                        {getPlanIcon(plan.id)}
                        <Text style={[
                          styles.planBadgeText,
                          isCurrent && styles.currentPlanBadgeText
                        ]}>
                          {isCurrent ? t('settings.current') : t('settings.select')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.planFeatures}>
                      <View style={styles.planFeature}>
                        <CheckCircle size={14} color={colors.success} strokeWidth={2} style={styles.planFeatureIcon} />
                        <Text style={styles.planFeatureText}>{t('settings.unlimitedReminders')}</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <CheckCircle size={14} color={colors.success} strokeWidth={2} style={styles.planFeatureIcon} />
                        <Text style={styles.planFeatureText}>{t('settings.advancedRecurring')}</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <CheckCircle size={14} color={colors.success} strokeWidth={2} style={styles.planFeatureIcon} />
                        <Text style={styles.planFeatureText}>{t('settings.familySharing')}</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <CheckCircle size={14} color={colors.success} strokeWidth={2} style={styles.planFeatureIcon} />
                        <Text style={styles.planFeatureText}>{t('settings.noAds')}</Text>
                      </View>
                      <View style={styles.planFeature}>
                        <CheckCircle size={14} color={colors.success} strokeWidth={2} style={styles.planFeatureIcon} />
                        <Text style={styles.planFeatureText}>{t('settings.prioritySupport')}</Text>
                      </View>
                    </View>

                    {hasSavings && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{plan.savings}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {selectedPlan && (
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isCurrentPlan(selectedPlan) && styles.currentPlanButton
                  ]}
                  onPress={handleConfirmSelection}
                >
                  <Text style={styles.selectButtonText}>
                    {isCurrentPlan(selectedPlan) 
                      ? t('settings.currentPlanSelected')
                      : t('settings.selectThisPlan')
                    }
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.infoText}>
                {t('settings.planChangeInfo')}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
} 
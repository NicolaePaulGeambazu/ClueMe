import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  X,
  Crown,
  Star,
  Check,
  Zap,
  Users,
  Calendar,
  Bell,
  Lock,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { useTranslation } from 'react-i18next';
import { usePremium } from '../../hooks/usePremium';
import { SubscriptionPlan } from '../../services/premiumService';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  triggerFeature?: string;
}

export default function PremiumUpgradeModal({
  visible,
  onClose,
  triggerFeature,
}: PremiumUpgradeModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { plans, purchasePlan, isLoading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    setSelectedPlan(planId);

    try {
      const success = await purchasePlan(planId);
      if (success) {
        Alert.alert(
          '🎉 Purchase Successful!',
          'Thank you for upgrading! Your new features are now available.',
          [
            {
              text: 'Continue',
              onPress: onClose,
            },
          ]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          'There was an issue processing your purchase. Please try again.',
          [
            {
              text: 'OK',
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [
          {
            text: 'OK',
          },
        ]
      );
    } finally {
      setSelectedPlan(null);
    }
  };

  const renderFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'noAds':
        return <Zap size={16} color={colors.success} />;
      case 'unlimitedReminders':
        return <Calendar size={16} color={colors.primary} />;
      case 'advancedRecurring':
        return <Star size={16} color={colors.warning} />;
      case 'multipleNotifications':
        return <Bell size={16} color={colors.secondary} />;
      case 'familySharing':
        return <Users size={16} color={colors.tertiary} />;
      default:
        return <Check size={16} color={colors.success} />;
    }
  };

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.id === 'premium_yearly';

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
          isPopular && styles.popularCard,
        ]}
        onPress={() => handlePurchase(plan.id)}
        disabled={isLoading}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.warning }]}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: colors.primary + '15' }]}>
            <Crown size={24} color={colors.primary} />
          </View>
          <View style={styles.planInfo}>
            <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
            <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
              {plan.description}
            </Text>
          </View>
        </View>

        <View style={styles.planPrice}>
          <Text style={[styles.priceAmount, { color: colors.text }]}>
            {plan.priceString}
          </Text>
          <Text style={[styles.priceCurrency, { color: colors.textSecondary }]}>
            /{plan.interval}
          </Text>
          {plan.savings && (
            <View style={[styles.savingsBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.savingsText, { color: colors.success }]}>
                {plan.savings}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.planFeatures}>
          {Object.entries(plan.features).map(([feature, enabled]) => (
            enabled && (
              <View key={feature} style={styles.featureItem}>
                {renderFeatureIcon(feature)}
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature === 'noAds' && 'No ads'}
                  {feature === 'unlimitedReminders' && 'Unlimited reminders'}
                  {feature === 'advancedRecurring' && 'Advanced recurring patterns'}
                  {feature === 'multipleNotifications' && 'Multiple notifications'}
                  {feature === 'familySharing' && 'Family sharing'}
                  {feature === 'customThemes' && 'Custom themes'}
                  {feature === 'prioritySupport' && 'Priority support'}
                  {feature === 'customIntervals' && 'Custom intervals'}
                  {feature === 'multipleDays' && 'Multiple days selection'}
                  {feature === 'endConditions' && 'End conditions'}
                  {feature === 'timezoneSupport' && 'Timezone support'}
                  {feature === 'unlimitedLists' && 'Unlimited lists'}
                </Text>
              </View>
            )
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            {
              backgroundColor: isSelected ? colors.success : colors.primary,
            },
          ]}
          onPress={() => handlePurchase(plan.id)}
          disabled={isLoading}
        >
          <Text style={styles.purchaseButtonText}>
            {isLoading && selectedPlan === plan.id ? 'Processing...' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={[styles.crownContainer, { backgroundColor: colors.warning }]}>
              <Crown size={24} color={colors.background} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Upgrade to Premium</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {triggerFeature
                ? `Unlock "${triggerFeature}" and more`
                : 'Subscribe to unlock all premium features'
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Plans */}
          <View style={styles.plansContainer}>
            {plans.map(renderPlanCard)}
          </View>

          {/* Features comparison */}
          <View style={styles.comparisonContainer}>
            <Text style={[styles.comparisonTitle, { color: colors.text }]}>
              What's included?
            </Text>

            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                  Feature
                </Text>
                <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                  Free
                </Text>
                <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                  Premium
                </Text>
              </View>

              {[
                { feature: 'No Ads', key: 'noAds' },
                { feature: 'Unlimited Reminders', key: 'unlimitedReminders' },
                { feature: 'Advanced Recurring', key: 'advancedRecurring' },
                { feature: 'Multiple Notifications', key: 'multipleNotifications' },
                { feature: 'Family Sharing', key: 'familySharing' },
                { feature: 'Custom Themes', key: 'customThemes' },
                { feature: 'Priority Support', key: 'prioritySupport' },
                { feature: 'Custom Intervals', key: 'customIntervals' },
                { feature: 'Multiple Days', key: 'multipleDays' },
                { feature: 'End Conditions', key: 'endConditions' },
                { feature: 'Timezone Support', key: 'timezoneSupport' },
                { feature: 'Unlimited Lists', key: 'unlimitedLists' },
              ].map(({ feature, key }) => (
                <View key={key} style={styles.comparisonRow}>
                  <Text style={[styles.comparisonFeature, { color: colors.text }]}>
                    {feature}
                  </Text>
                  <Text style={[styles.comparisonValue, { color: colors.textSecondary }]}>
                    ✗
                  </Text>
                  <Text style={[styles.comparisonValue, { color: colors.success }]}>
                    ✓
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Cancel anytime. 30-day money-back guarantee
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  crownContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: FontSizes.title1,
    fontFamily: Fonts.text.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  plansContainer: {
    gap: 16,
    marginVertical: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  popularCard: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.bold,
    color: colors.background,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: FontSizes.largeTitle,
    fontFamily: Fonts.text.bold,
  },
  priceCurrency: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    marginLeft: 4,
  },
  savingsBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: FontSizes.caption2,
    fontFamily: Fonts.text.bold,
  },
  planFeatures: {
    gap: 8,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
  },
  purchaseButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.bold,
    color: colors.background,
  },
  comparisonContainer: {
    marginVertical: 20,
  },
  comparisonTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    marginBottom: 16,
  },
  comparisonTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.bold,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  comparisonFeature: {
    flex: 2,
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
  },
  comparisonValue: {
    flex: 1,
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.bold,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.regular,
    textAlign: 'center',
  },
});

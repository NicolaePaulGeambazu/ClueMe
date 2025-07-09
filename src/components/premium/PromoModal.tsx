import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Crown, Check, Star, Zap, Bell, Calendar, Repeat } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';

interface PromoModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
  colors: typeof Colors.light;
  triggerFeature?: string;
}

interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const PromoModal: React.FC<PromoModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  colors,
  triggerFeature,
}) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const premiumFeatures: PremiumFeature[] = [
    {
      id: 'multiple_notifications',
      title: t('premium.features.multipleNotifications.title'),
      description: t('premium.features.multipleNotifications.description'),
      icon: <Bell size={20} color={colors.primary} />,
    },
    {
      id: 'advanced_recurring',
      title: t('premium.features.advancedRecurring.title'),
      description: t('premium.features.advancedRecurring.description'),
      icon: <Repeat size={20} color={colors.primary} />,
    },
    {
      id: 'custom_timing',
      title: t('premium.features.customTiming.title'),
      description: t('premium.features.customTiming.description'),
      icon: <Zap size={20} color={colors.primary} />,
    },
    {
      id: 'calendar_sync',
      title: t('premium.features.calendarSync.title'),
      description: t('premium.features.calendarSync.description'),
      icon: <Calendar size={20} color={colors.primary} />,
    },
  ];

  const handleUpgrade = () => {
    onUpgrade(selectedPlan);
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
            <View style={styles.crownContainer}>
              <Crown size={24} color={colors.warning} />
            </View>
            <Text style={styles.title}>{t('premium.title')}</Text>
            <Text style={styles.subtitle}>{t('premium.subtitle')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Trigger feature highlight */}
          {triggerFeature && (
            <View style={styles.triggerFeature}>
              <Star size={16} color={colors.warning} />
              <Text style={styles.triggerText}>
                {t('premium.triggerFeature', { feature: triggerFeature })}
              </Text>
            </View>
          )}

          {/* Features list */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>{t('premium.features.title')}</Text>
            {premiumFeatures.map((feature) => (
              <View key={feature.id} style={styles.featureItem}>
                <View style={styles.featureIcon}>{feature.icon}</View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Check size={16} color={colors.success} />
              </View>
            ))}
          </View>

          {/* Pricing plans */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>{t('premium.pricing.title')}</Text>
            
            {/* Plan selection */}
            <View style={styles.planContainer}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' && styles.planOptionSelected,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[
                  styles.planTitle,
                  selectedPlan === 'monthly' && styles.planTitleSelected,
                ]}>
                  {t('premium.pricing.monthly.title')}
                </Text>
                <Text style={[
                  styles.planPrice,
                  selectedPlan === 'monthly' && styles.planPriceSelected,
                ]}>
                  {t('premium.pricing.monthly.price')}
                </Text>
                <Text style={styles.planPeriod}>{t('premium.pricing.monthly.period')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionSelected,
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>{t('premium.pricing.popular')}</Text>
                </View>
                <Text style={[
                  styles.planTitle,
                  selectedPlan === 'yearly' && styles.planTitleSelected,
                ]}>
                  {t('premium.pricing.yearly.title')}
                </Text>
                <Text style={[
                  styles.planPrice,
                  selectedPlan === 'yearly' && styles.planPriceSelected,
                ]}>
                  {t('premium.pricing.yearly.price')}
                </Text>
                <Text style={styles.planPeriod}>{t('premium.pricing.yearly.period')}</Text>
                <Text style={styles.savingsText}>{t('premium.pricing.yearly.savings')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trial info */}
          <View style={styles.trialSection}>
            <Text style={styles.trialTitle}>{t('premium.trial.title')}</Text>
            <Text style={styles.trialDescription}>{t('premium.trial.description')}</Text>
          </View>

          {/* Guarantee */}
          <View style={styles.guaranteeSection}>
            <Text style={styles.guaranteeText}>{t('premium.guarantee')}</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>
              {t('premium.upgradeButton', { plan: selectedPlan })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.maybeLaterButton} onPress={onClose}>
            <Text style={styles.maybeLaterText}>{t('premium.maybeLater')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

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
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  crownContainer: {
    marginBottom: 8,
  },
  title: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.title2,
    lineHeight: LineHeights.title2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  triggerFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 24,
    gap: 8,
  },
  triggerText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.warning,
    flex: 1,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.headline,
    lineHeight: LineHeights.headline,
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.textSecondary,
  },
  pricingSection: {
    marginBottom: 32,
  },
  planContainer: {
    gap: 12,
  },
  planOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  planOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.caption1,
    lineHeight: LineHeights.caption1,
    color: '#FFFFFF',
  },
  planTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.text,
    marginBottom: 4,
  },
  planTitleSelected: {
    color: colors.primary,
  },
  planPrice: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.title2,
    lineHeight: LineHeights.title2,
    color: colors.text,
    marginBottom: 2,
  },
  planPriceSelected: {
    color: colors.primary,
  },
  planPeriod: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.textSecondary,
  },
  savingsText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.caption1,
    lineHeight: LineHeights.caption1,
    color: colors.success,
    marginTop: 4,
  },
  trialSection: {
    backgroundColor: colors.success + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  trialTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.success,
    marginBottom: 4,
  },
  trialDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    lineHeight: LineHeights.footnote,
    color: colors.textSecondary,
  },
  guaranteeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  guaranteeText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    lineHeight: LineHeights.caption1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontFamily: Fonts.text.bold,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: '#FFFFFF',
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    lineHeight: LineHeights.body,
    color: colors.textSecondary,
  },
}); 
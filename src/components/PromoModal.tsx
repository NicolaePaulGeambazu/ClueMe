import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Star, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import { getFirestoreInstance } from '../services/firebaseService';

export interface PricingData {
  id: string;
  region: string;
  currency: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  promoTitle: string;
  promoDescription: string;
  ctaText: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  region?: string;
}

export function PromoModal({ visible, onClose, onUpgrade, region = 'US' }: PromoModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = Colors[theme];
  
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    if (visible) {
      fetchPricing();
    }
  }, [visible, region]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);

      const firestoreInstance = getFirestoreInstance();
      const snap = await firestoreInstance
        .collection('pricing')
        .where('region', '==', region)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snap.empty) {
        // Fallback to default pricing
        const defaultSnap = await firestoreInstance
          .collection('pricing')
          .where('region', '==', 'US')
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (defaultSnap.empty) {
          setError('No pricing information available');
          return;
        }

        const defaultDoc = defaultSnap.docs[0];
        setPricing({
          id: defaultDoc.id,
          ...defaultDoc.data(),
          createdAt: defaultDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: defaultDoc.data().updatedAt?.toDate() || new Date(),
        } as PricingData);
      } else {
        const doc = snap.docs[0];
        setPricing({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as PricingData);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
      setError('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default upgrade flow - you can integrate with your payment provider here
      Alert.alert(
        'Upgrade to Pro',
        'This will redirect you to complete your purchase. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // TODO: Integrate with payment provider (Stripe, RevenueCat, etc.)
              console.log('Redirecting to payment...');
              onClose();
            }
          }
        ]
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('upgrade.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchPricing} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : pricing ? (
          <View style={styles.content}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.badge}>
                <Star size={16} color={colors.primary} />
                <Text style={styles.badgeText}>{t('upgrade.pro')}</Text>
              </View>
              <Text style={styles.title}>{pricing.promoTitle}</Text>
              <Text style={styles.description}>{pricing.promoDescription}</Text>
            </View>

            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>{pricing.currency}</Text>
                <Text style={styles.price}>{pricing.monthlyPrice}</Text>
                <Text style={styles.period}>/{t('upgrade.month')}</Text>
              </View>
              {pricing.yearlyPrice && (
                <Text style={styles.yearlyPrice}>
                  {t('upgrade.or')} {pricing.currency}{pricing.yearlyPrice}/{t('upgrade.year')} 
                  <Text style={styles.savings}> ({t('upgrade.save')})</Text>
                </Text>
              )}
            </View>

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>{t('upgrade.features')}</Text>
              {pricing.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Check size={20} color={colors.success} style={styles.featureIcon} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA Section */}
            <View style={styles.ctaSection}>
              <TouchableOpacity 
                style={styles.upgradeButton} 
                onPress={handleUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeButtonText}>{pricing.ctaText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>{t('upgrade.maybeLater')}</Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              {t('upgrade.terms')}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
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
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.semibold,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: FontSizes.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.medium,
    color: colors.primary,
  },
  title: {
    fontSize: FontSizes.largeTitle,
    fontFamily: Fonts.text.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: FontSizes.largeTitle * 1.2,
  },
  description: {
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSizes.body * 1.4,
    paddingHorizontal: 20,
  },
  pricingSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginVertical: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.medium,
    color: colors.text,
  },
  price: {
    fontSize: FontSizes.largeTitle,
    fontFamily: Fonts.text.bold,
    color: colors.text,
  },
  period: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.medium,
    color: colors.textSecondary,
  },
  yearlyPrice: {
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  savings: {
    color: colors.success,
    fontFamily: Fonts.text.medium,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.semibold,
    color: colors.text,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: FontSizes.body,
    color: colors.text,
    flex: 1,
  },
  ctaSection: {
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: FontSizes.title3,
    fontFamily: Fonts.text.semibold,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: FontSizes.body,
  },
  terms: {
    fontSize: FontSizes.caption1,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: FontSizes.caption1 * 1.3,
  },
}); 
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  X,
  Crown,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePremium } from '../../hooks/usePremium';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SmallPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message: string;
  triggerFeature?: string;
}

export default function SmallPaywallModal({
  visible,
  onClose,
  onUpgrade,
  message,
  triggerFeature,
}: SmallPaywallModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const premium = usePremium();

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<'individual' | 'family'>('individual');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleUpgrade = () => {
    onUpgrade();
    onClose();
  };

  const handleMaybeLater = () => {
    onClose();
  };

  const premiumFeatures = [
    {
      icon: <Check size={16} color={colors.success} />,
      text: t('monetization.upgrade.features.unlimitedReminders'),
    },
    {
      icon: <Check size={16} color={colors.success} />,
      text: t('monetization.upgrade.features.advancedRecurring'),
    },
    {
      icon: <Check size={16} color={colors.success} />,
      text: t('monetization.upgrade.features.multipleNotifications'),
    },
    {
      icon: <Check size={16} color={colors.success} />,
      text: t('monetization.upgrade.features.familySharing'),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <Crown size={24} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('monetization.upgrade.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('monetization.upgrade.subtitle')}
            </Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          </View>

          {/* Plan Selection */}
          <View style={styles.planContainer}>
            <TouchableOpacity
              style={[
                styles.planOption,
                selectedPlan === 'individual' && styles.planOptionSelected,
                { borderColor: colors.borderLight }
              ]}
              onPress={() => setSelectedPlan('individual')}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, { color: colors.text }]}>
                  {t('monetization.upgrade.individual')}
                </Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>
                  {premium.plans.find((p: any) => !p.isFamilyShareable && p.interval === 'monthly')?.priceString || '$3.99/month'}
                </Text>
              </View>
              <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                Perfect for individual users
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planOption,
                selectedPlan === 'family' && styles.planOptionSelected,
                { borderColor: colors.borderLight }
              ]}
              onPress={() => setSelectedPlan('family')}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planTitle, { color: colors.text }]}>
                  {t('monetization.upgrade.family')}
                </Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>
                  {premium.plans.find((p: any) => p.isFamilyShareable && p.interval === 'monthly')?.priceString || '$7.99/month'}
                </Text>
              </View>
              <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                Share premium features with family
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                {feature.icon}
                <Text style={[styles.featureText, { color: colors.text }]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
            >
              <Text style={[styles.upgradeButtonText, { color: colors.background }]}>
                {t('monetization.upgrade.title')}
              </Text>
              <ArrowRight size={16} color={colors.background} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.maybeLaterButton}
              onPress={handleMaybeLater}
            >
              <Text style={[styles.maybeLaterText, { color: colors.textSecondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  crownContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.display?.semibold,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    textAlign: 'center',
    lineHeight: 22,
  },
  planContainer: {
    marginBottom: 20,
    gap: 12,
  },
  planOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
  },
  planOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: Fonts.text?.semibold,
  },
  planPrice: {
    fontSize: 16,
    fontFamily: Fonts.text?.semibold,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    flex: 1,
  },
  actionsContainer: {
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: Fonts.text?.semibold,
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 14,
    fontFamily: Fonts.text?.medium,
    textDecorationLine: 'underline',
  },
}); 
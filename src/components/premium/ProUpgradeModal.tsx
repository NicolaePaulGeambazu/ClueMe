import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  Crown,
  Star,
  Zap,
  Clock,
  Users,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { useTranslation } from 'react-i18next';
// Note: LinearGradient requires expo-linear-gradient package
// For now, we'll use a simple View with background color
// import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onMaybeLater: () => void;
  triggerFeature?: string;
}

export default function ProUpgradeModal({
  visible,
  onClose,
  onUpgrade,
  onMaybeLater,
  triggerFeature,
}: ProUpgradeModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleUpgrade = () => {
    // TEMPORARY: For testing, unlock all features without payment
    Alert.alert(
      '🎉 Pro Features Unlocked!',
      'For testing purposes, all Pro features are now unlocked. In production, this would trigger the payment flow.',
      [
        {
          text: 'Continue',
          onPress: () => {
            onUpgrade();
            onClose();
          },
        },
      ]
    );
  };

  const handleMaybeLater = () => {
    onMaybeLater();
    onClose();
  };

  const proFeatures = [
    {
      icon: <Clock size={24} color="#FFD700" />,
      title: t('pro.multipleNotifications'),
      description: t('pro.multipleNotificationsDesc'),
    },
    {
      icon: <Calendar size={24} color="#FFD700" />,
      title: t('pro.advancedRecurring'),
      description: t('pro.advancedRecurringDesc'),
    },
    {
      icon: <Users size={24} color="#FFD700" />,
      title: t('pro.familySharing'),
      description: t('pro.familySharingDesc'),
    },
    {
      icon: <Zap size={24} color="#FFD700" />,
      title: t('pro.prioritySupport'),
      description: t('pro.prioritySupportDesc'),
    },
    {
      icon: <Star size={24} color="#FFD700" />,
      title: t('pro.customThemes'),
      description: t('pro.customThemesDesc'),
    },
    {
      icon: <Sparkles size={24} color="#FFD700" />,
      title: t('pro.advancedAnalytics'),
      description: t('pro.advancedAnalyticsDesc'),
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Crown */}
            <View style={styles.header}>
              <View style={[styles.crownContainer, { backgroundColor: '#FFD700' }]}>
                <Crown size={32} color="white" fill="white" />
              </View>
              
              <Text style={styles.proTitle}>ClearCue Pro</Text>
              <Text style={styles.proSubtitle}>
                {triggerFeature 
                  ? t('pro.unlockFeature', { feature: triggerFeature })
                  : t('pro.unlockEverything')
                }
              </Text>
            </View>

            {/* Features Grid */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>{t('pro.whatYouGet')}</Text>
              
              <View style={styles.featuresGrid}>
                {proFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureCard}>
                    <View style={styles.featureIcon}>{feature.icon}</View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.pricingContainer}>
                             <View style={styles.priceCard}>
                 <View style={[styles.priceGradient, { backgroundColor: '#FFD700' }]}>
                   <Text style={styles.priceLabel}>{t('pro.monthly')}</Text>
                   <Text style={styles.priceAmount}>$4.99</Text>
                   <Text style={styles.pricePeriod}>{t('pro.perMonth')}</Text>
                 </View>
                
                <View style={styles.priceFeatures}>
                  <View style={styles.priceFeature}>
                    <Check size={16} color="#4CAF50" />
                    <Text style={styles.priceFeatureText}>{t('pro.allFeatures')}</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Check size={16} color="#4CAF50" />
                    <Text style={styles.priceFeatureText}>{t('pro.cancelAnytime')}</Text>
                  </View>
                  <View style={styles.priceFeature}>
                    <Check size={16} color="#4CAF50" />
                    <Text style={styles.priceFeatureText}>{t('pro.freeTrial')}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                             <TouchableOpacity
                 style={styles.upgradeButton}
                 onPress={handleUpgrade}
                 activeOpacity={0.8}
               >
                 <View style={[styles.upgradeGradient, { backgroundColor: '#FFD700' }]}>
                   <Crown size={20} color="white" />
                   <Text style={styles.upgradeButtonText}>
                     {t('pro.upgradeToPro')}
                   </Text>
                 </View>
               </TouchableOpacity>

              <TouchableOpacity
                style={styles.maybeLaterButton}
                onPress={handleMaybeLater}
                activeOpacity={0.7}
              >
                <Text style={styles.maybeLaterText}>
                  {t('pro.maybeLater')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: screenHeight * 0.85,
    backgroundColor: colors.background,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  proTitle: {
    fontSize: 28,
    fontFamily: Fonts.display?.bold,
    color: '#FFD700',
    marginBottom: 8,
  },
  proSubtitle: {
    fontSize: 16,
    fontFamily: Fonts.text?.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontFamily: Fonts.text?.semibold,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: Fonts.text?.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: Fonts.text?.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  pricingContainer: {
    marginBottom: 32,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  priceGradient: {
    padding: 24,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    color: 'white',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 36,
    fontFamily: Fonts.display?.bold,
    color: 'white',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    color: 'white',
    opacity: 0.9,
  },
  priceFeatures: {
    padding: 20,
  },
  priceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceFeatureText: {
    fontSize: 14,
    fontFamily: Fonts.text?.regular,
    color: colors.text,
    marginLeft: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontFamily: Fonts.text?.semibold,
    color: 'white',
  },
  maybeLaterButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    fontFamily: Fonts.text?.medium,
    color: colors.textSecondary,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
}); 
import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import {
  X,
  Crown,
  Zap, // Keeping Zap for 'priority support' if that's still relevant
  Clock,
  Users,
  Calendar,
  Check,
  // Removed Sparkles and Star as per no analytics/custom themes
  Lock, // Used for exclusive content or features
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { useTranslation } from 'react-i18next';
import { ImageBackground } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FullScreenPaywallProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  triggerFeature?: string;
}

const backgroundImage = { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' };

export default function FullScreenPaywall({ visible, onClose, onUpgrade, triggerFeature }: FullScreenPaywallProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const crownScaleAnim = useRef(new Animated.Value(0.8)).current; // For subtle crown pulse
  const upgradeButtonScaleAnim = useRef(new Animated.Value(1)).current; // For button press animation
  const [selectedPlan, setSelectedPlan] = React.useState<'yearly' | 'weekly'>('yearly');

  // Timer states
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation for modal entrance
  useEffect(() => {
    if (visible) {
      // Reset timer when modal opens
      setTimeLeft(5);
      setCanClose(false);
      progressAnim.setValue(0);
      
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
      ]).start(() => {
        // Start pulsing crown animation after modal opens
        Animated.loop(
          Animated.sequence([
            Animated.timing(crownScaleAnim, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(crownScaleAnim, {
              toValue: 0.8,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });

      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start();
    } else {
      // Stop crown animation when modal closes
      crownScaleAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Timer effect
  useEffect(() => {
    if (visible && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (visible && timeLeft === 0) {
      setCanClose(true);
    }
  }, [visible, timeLeft]);

  const handleUpgrade = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(upgradeButtonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(upgradeButtonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
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
        ],
      );
    });
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
      icon: <Lock size={24} color="#FFD700" />,
      title: t('pro.adFreeExperience'),
      description: t('pro.adFreeExperienceDesc'),
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ImageBackground
          source={backgroundImage}
          style={styles.backgroundImage}
          imageStyle={{ resizeMode: 'cover' }}
        >
          {/* Dark overlay instead of LinearGradient */}
          <View style={styles.darkOverlay} />
          <View style={styles.gradientOverlay}>
            {/* Close Button with Timer */}
            <TouchableOpacity 
              style={[styles.closeButtonContainer, !canClose && styles.closeButtonDisabled]} 
              onPress={canClose ? onClose : undefined}
              disabled={!canClose}
            >
              <View style={styles.closeButtonContent}>
                <Text style={[styles.closeButtonText, !canClose && styles.closeButtonTextDisabled]}>
                  {canClose ? '×' : timeLeft}
                </Text>
                {!canClose && (
                  <View style={styles.progressBarContainer}>
                    <Animated.View 
                      style={[
                        styles.progressBar,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Title & Subtitle */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Unlock Pro</Text>
              <Text style={styles.subtitle}>Get access to all premium features.</Text>
              {/* Trust signals */}
              <View style={styles.trustRow}>
                <Text style={styles.stars}>★★★★★</Text>
                <Text style={styles.trustText}>Trusted by thousands</Text>
              </View>
            </View>

            {/* Plan Card */}
            <View style={styles.planCardContainer}>
              {/* Yearly Plan */}
              <TouchableOpacity
                style={[styles.planRow, selectedPlan === 'yearly' && styles.planRowSelected]}
                onPress={() => setSelectedPlan('yearly')}
                activeOpacity={0.9}
              >
                <View style={styles.planRadioOuter}>
                  {selectedPlan === 'yearly' && <View style={styles.planRadioInner} />}
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planLabelRow}>
                    <Text style={styles.planLabel}>Yearly</Text>
                    <View style={styles.savingsBadge}><Text style={styles.savingsText}>SAVE 82%</Text></View>
                  </View>
                  <Text style={styles.planPrice}>$35.99/year <Text style={styles.planSubPrice}>($0.70/week)</Text></Text>
                  <Text style={styles.planTrial}>$35.99 per year, no free trial</Text>
                </View>
              </TouchableOpacity>
              {/* Weekly Plan */}
              <TouchableOpacity
                style={[styles.planRow, selectedPlan === 'weekly' && styles.planRowSelected]}
                onPress={() => setSelectedPlan('weekly')}
                activeOpacity={0.9}
              >
                <View style={styles.planRadioOuter}>
                  {selectedPlan === 'weekly' && <View style={styles.planRadioInner} />}
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planLabelRow}>
                    <Text style={styles.planLabel}>Weekly</Text>
                  </View>
                  <Text style={styles.planPrice}>$3.99/week</Text>
                  <Text style={styles.planTrial}>$3.99 per week, no free trial</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {selectedPlan === 'yearly' ? 'Upgrade now' : 'Upgrade now'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.renewalText}>Cancel anytime, auto renewal</Text>
          </View>
        </ImageBackground>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    // Add a slight gradient or background image if desired
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80, // Reduced top padding
    paddingBottom: 20, // Reduced bottom padding
    paddingHorizontal: 20, // Reduced horizontal padding
  },
  header: {
    alignItems: 'center',
    marginBottom: 24, // Reduced from 40
  },
  crownContainer: {
    width: 64, // Reduced from 80
    height: 64, // Reduced from 80
    borderRadius: 32, // Reduced from 40
    backgroundColor: '#FFD700' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // Reduced from 20
    // Subtle shadow for depth
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 }, // Reduced shadow
    shadowOpacity: 0.2, // Reduced opacity
    shadowRadius: 6, // Reduced radius
    elevation: 4, // Reduced elevation
  },
  proTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 28, // Reduced from 34
    color: colors.text,
    marginBottom: 8, // Reduced from 12
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  proSubtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22, // Reduced from 26
    paddingHorizontal: 8, // Reduced from 10
  },
  featuresContainer: {
    marginBottom: 16, // Reduced from 24
  },
  featuresTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3, // Reduced from title2
    color: colors.text,
    marginBottom: 16, // Reduced from 28
    textAlign: 'center',
  },
  featuresList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureIcon: {
    width: 36, // Reduced from 40
    height: 36, // Reduced from 40
    borderRadius: 18, // Reduced from 20
    backgroundColor: '#FFD700' + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0, // Remove margin since it's now in a row layout
  },
  featureTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.subheadline, // Back to subheadline for better readability
    color: colors.text,
    marginBottom: 2, // Reduced from 4
    textAlign: 'left', // Changed from center to left for list layout
    lineHeight: 18, // Increased from 16
  },
  featureDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption2, // Reduced from caption1
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14, // Reduced from 18
  },
  pricingContainer: {
    marginBottom: 16, // Reduced from 24
  },
  pricingTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3, // Reduced from title2
    color: colors.text,
    marginBottom: 12, // Reduced from 16
    textAlign: 'center',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16, // Reduced from 20
    marginBottom: 12, // Reduced from 20
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 }, // Reduced shadow
    shadowOpacity: 0.1, // Reduced opacity
    shadowRadius: 4, // Reduced radius
    elevation: 2, // Reduced elevation
    borderWidth: 1, // Reduced from 2
    borderColor: 'transparent',
  },
  priceCardPopular: {
    borderColor: colors.primary, // Highlight with primary color
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 16, // Larger padding
    paddingVertical: 6, // Larger padding
    borderRadius: 16, // More rounded
    zIndex: 1,
    shadowColor: colors.primary, // Glow effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  popularText: {
    fontFamily: Fonts.text.bold, // Bold text
    fontSize: FontSizes.caption1, // Slightly larger
    color: 'white',
    textTransform: 'uppercase', // All caps
  },
  priceGradient: {
    backgroundColor: colors.primary + '15', // Slightly more opaque gradient background
    padding: 20, // Reduced from 28
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  priceAmount: {
    fontFamily: Fonts.display.bold,
    fontSize: 32, // Reduced from 40
    color: colors.text,
    marginBottom: 4, // Reduced from 6
  },
  pricePeriod: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  priceFeatures: {
    padding: 16, // Reduced from 24
  },
  priceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // More space
  },
  priceFeatureText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
    marginLeft: 16, // More space
  },
  actionsContainer: {
    alignItems: 'center',
    paddingBottom: 20, // Ensure space at the bottom
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 20, // More space
    borderRadius: 18, // More rounded
    overflow: 'hidden',
    shadowColor: colors.primary, // Primary color shadow for CTA
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  upgradeGradient: {
    backgroundColor: colors.primary, // Solid primary color, or consider a linear gradient for more flair
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // Taller button
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontFamily: Fonts.text.bold, // Make text bolder
    fontSize: FontSizes.title3, // Larger text for CTA
    color: 'white',
    marginLeft: 12, // More space
    letterSpacing: 0.8,
  },
  maybeLaterButton: {
    paddingVertical: 14, // Slightly larger tappable area
    paddingHorizontal: 24,
  },
  maybeLaterText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textDecorationLine: 'underline', // Add underline for 'no thanks'
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 36,
    right: 24,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  closeButtonDisabled: {
    opacity: 0.3,
  },
  closeButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: -4,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.85,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stars: {
    color: '#FFD700',
    fontSize: 18,
    marginRight: 6,
  },
  trustText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  planCardContainer: {
    backgroundColor: 'rgba(20,20,30,0.95)',
    borderRadius: 18,
    padding: 12,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  planRowSelected: {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255,152,0,0.08)',
  },
  planRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#181820',
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF9800',
  },
  planInfo: {
    flex: 1,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  planLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  savingsBadge: {
    backgroundColor: '#1de9b6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  savingsText: {
    color: '#222',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planSubPrice: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.7,
    fontWeight: '400',
  },
  planTrial: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#FF9800',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  renewalText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 8,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
});
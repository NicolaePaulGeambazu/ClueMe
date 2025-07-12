import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Bell,
  Shield,
  CircleHelp as HelpCircle,
  Info,
  ChevronRight,
  User,
  LogOut,
  Calendar,
  Mail,
  Globe,
  Edit,
  Save,
  X,

  Crown,
  Star,
  Zap,
  Lock,
  CheckCircle,
  Users,
  MapPin,
  Brain,
  BarChart3,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../constants/Fonts';
import InfoModal from '../components/InfoModal';
import { LanguageSelector } from '../components/LanguageSelector';
import BannerAdComponent from '../components/ads/BannerAdComponent';
import PrivacySettings from '../components/PrivacySettings';
import InterstitialAdTrigger from '../components/ads/InterstitialAdTrigger';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { useUserUsage } from '../hooks/useUserUsage';
import FullScreenPaywall from '../components/premium/FullScreenPaywall';
import SubscriptionManagementModal from '../components/premium/SubscriptionManagementModal';
import { useSettings } from '../contexts/SettingsContext';
import notificationService from '../services/notificationService';
import { useReminderContext } from '../contexts/ReminderContext';


const { width } = Dimensions.get('window');

// Use centralized premium status manager and user usage tracking
const useSubscription = () => {
  const premium = usePremiumStatus();
  const userUsage = useUserUsage();
  
  // Get subscription details based on premium status and usage
  const getSubscriptionDetails = () => {
    if (premium.isPremium) {
      return {
        remainingReminders: 999, // Unlimited for premium
        maxReminders: 999,
        remainingLists: 999, // Unlimited for premium
        maxLists: 999,
        remainingFamilyMembers: 5,
        maxFamilyMembers: 5,
        daysUntilRenewal: 0,
      };
    } else {
      // Use actual usage data for free users
      const stats = userUsage.usageStats;
      return {
        remainingReminders: stats?.reminders.remaining || 5,
        maxReminders: stats?.reminders.limit || 5,
        remainingLists: stats?.lists.remaining || 2,
        maxLists: stats?.lists.limit || 2,
        remainingFamilyMembers: 1,
        maxFamilyMembers: 2,
        daysUntilRenewal: 0,
      };
    }
  };

  const subscriptionDetails = getSubscriptionDetails();

  return {
    isPro: premium.isPro,
    isPremium: premium.isPremium,
    plan: premium.currentTier,
    ...subscriptionDetails,
    subscriptionStatus: {
      tier: premium.currentTier,
      name: premium.status.name,
      description: premium.status.description,
      isActive: premium.isActive,
    },
    usageStats: userUsage.usageStats,
    nextResetDate: userUsage.usageStats?.nextResetDate,
  };
};

// Create styles function
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  editAvatarButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  profileInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  proBadgeText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption2,
    color: '#FFD700',
    marginLeft: 4,
  },
  email: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    color: colors.textSecondary,
  },
  anonymousBadge: {
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  anonymousText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.caption1,
    color: colors.warning,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  upgradeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  inlineUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginLeft: 'auto',
  },
  inlineUpgradeText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption1,
    color: colors.primary,
    marginLeft: 4,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginLeft: 'auto',
  },
  signInText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption1,
    color: colors.primary,
    marginLeft: 4,
  },
  usageSection: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  usageTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 12,
  },
  usageItem: {
    marginBottom: 12,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    color: colors.textSecondary,
  },
  usageCount: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption1,
    color: colors.text,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.border + '40',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  progressHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  usageWarning: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    color: colors.warning,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.subheadline,
    color: colors.text,
    marginBottom: 1,
  },
  settingDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  footerText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  footerSubtext: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textTertiary,
    textAlign: 'center',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  nameInput: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
    padding: 12,
  },
  inputBorder: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: colors.error + '15',
  },
  cancelButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.error,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
    marginLeft: 8,
  },
  bannerContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: colors.border,
  },
  upgradeModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  upgradeModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  upgradeModalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFD700' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  upgradeModalTitle: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title2,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeModalSubtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  upgradeFeatures: {
    marginBottom: 24,
  },
  upgradeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeFeatureText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
    marginLeft: 12,
  },
  upgradePricing: {
    marginBottom: 24,
  },
  pricingOption: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pricingOptionRecommended: {
    borderColor: colors.primary,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption2,
    color: 'white',
  },
  pricingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pricingOptionTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  pricingOptionPrice: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title3,
    color: colors.text,
  },
  pricingOptionDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  upgradeCTA: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeCTAText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
  },
  trialText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  settingText: {
    flex: 1,
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  subscriptionTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  subscriptionDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  manageSubscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  manageSubscriptionText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption1,
    color: colors.primary,
  },
  premiumBenefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  premiumBenefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumBenefitsContent: {
    flex: 1,
    marginLeft: 12,
  },
  premiumBenefitsTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  premiumBenefitsDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  premiumFeaturesList: {
    gap: 8,
  },
  premiumFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumFeatureText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.text,
  },
  resetInfo: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface + '50',
    borderRadius: 8,
  },
  resetText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption2,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});

export default function SettingsScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user, isAnonymous, updateUserProfile } = useAuth();
  const {
    isEnabled: notificationsEnabled,
    isLoading: notificationsLoading,
    requestPermissions,
    error: notificationError,
  } = useNotifications();
  const subscription = useSubscription();
  const premium = usePremiumStatus();
  const { fabPosition, setFabPosition } = useSettings();
  const colors = Colors[theme];
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'help' | 'privacy' | 'warning',
  });



  // Name editing state
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Privacy settings modal state
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  // Subscription management modal state
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);

  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { clearReminders } = useReminderContext();

  // Update newDisplayName when user changes
  useEffect(() => {
    setNewDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          t('settings.notificationPermissionDenied'),
          t('settings.notificationPermissionDeniedMessage'),
          [{ text: t('common.ok') }]
        );
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              clearReminders(); // Clear reminders after sign out
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.signOutError'));
            }
          },
        },
      ]
    );
  };

  const handleEditName = () => {
    setShowNameEditModal(true);
  };

  const handleSaveName = async () => {
    if (!newDisplayName.trim()) {
      Alert.alert(t('settings.nameRequired'), t('settings.nameRequiredMessage'));
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateUserProfile({ displayName: newDisplayName.trim() });
      setShowNameEditModal(false);
      Alert.alert(t('settings.nameUpdated'), t('settings.nameUpdatedMessage'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.nameUpdateError'));
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelNameEdit = () => {
    setNewDisplayName(user?.displayName || '');
    setShowNameEditModal(false);
  };

  const handleHelpSupport = () => {
    setModalConfig({
      title: t('settings.helpSupport'),
      content: t('settings.helpContent'),
      type: 'help',
    });
    setModalVisible(true);
  };

  const handleAboutClearCue = () => {
    setModalConfig({
      title: t('settings.aboutClearCue'),
      content: t('settings.aboutContent'),
      type: 'info',
    });
    setModalVisible(true);
  };

  const handleDataPrivacy = () => {
    setShowPrivacySettings(true);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const handleUpgrade = () => {
    // This will be called when user successfully upgrades
    console.log('User upgraded to premium');
    // You can add any post-upgrade logic here
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <User size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
            {!isAnonymous && (
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditName}
              >
                <Edit size={12} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {user?.displayName || t('settings.welcomeUser')}
              </Text>
              {premium.isPremium && (
                <View style={styles.proBadge}>
                  <Crown size={10} color="#FFD700" strokeWidth={2} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>
              {user?.email || t('settings.userEmail')}
            </Text>
          </View>

          {/* Inline upgrade button for signed-in non-pro users */}
          {!premium.isPremium && !isAnonymous && (
            <TouchableOpacity style={styles.inlineUpgradeButton} onPress={() => setShowUpgradeModal(true)}>
              <Sparkles size={16} color={colors.primary} strokeWidth={2} />
              <Text style={styles.inlineUpgradeText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          {/* Anonymous badge positioned at the end */}
          {isAnonymous && (
            <View style={styles.anonymousBadge}>
              <Text style={styles.anonymousText}>{t('settings.anonymousUser')}</Text>
            </View>
          )}


        </View>
      </View>
    </View>
  );

  const renderSettingsContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Account Information */}
      {!premium.isPremium && !isAnonymous && (
        <View style={styles.section}>
          {/* Usage Stats - Only show for signed-in free users */}
          <View style={styles.usageSection}>
            <Text style={styles.usageTitle}>Current Usage</Text>
            
            <View style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Monthly Reminders</Text>
                <Text style={styles.usageCount}>
                  {subscription.remainingReminders}/{subscription.maxReminders}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((subscription.maxReminders - subscription.remainingReminders) / subscription.maxReminders) * 100}%`,
                      backgroundColor: subscription.remainingReminders < 2 ? colors.warning : colors.primary
                    }
                  ]}
                >
                  {/* Glossy highlight overlay */}
                  <View style={styles.progressHighlight} />
                </View>
              </View>
              {subscription.remainingReminders < 2 && (
                <Text style={styles.usageWarning}>
                  Only {subscription.remainingReminders} reminders left this month
                </Text>
              )}
            </View>

            <View style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Lists</Text>
                <Text style={styles.usageCount}>
                  {subscription.remainingLists}/{subscription.maxLists}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((subscription.maxLists - subscription.remainingLists) / subscription.maxLists) * 100}%`,
                      backgroundColor: subscription.remainingLists < 1 ? colors.warning : colors.primary
                    }
                  ]}
                >
                  {/* Glossy highlight overlay */}
                  <View style={styles.progressHighlight} />
                </View>
              </View>
              {subscription.remainingLists < 1 && (
                <Text style={styles.usageWarning}>
                  No lists remaining. Upgrade to Pro for unlimited lists.
                </Text>
              )}
            </View>

            <View style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Family Members</Text>
                <Text style={styles.usageCount}>
                  {subscription.maxFamilyMembers - subscription.remainingFamilyMembers}/{subscription.maxFamilyMembers}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((subscription.maxFamilyMembers - subscription.remainingFamilyMembers) / subscription.maxFamilyMembers) * 100}%`,
                      backgroundColor: colors.primary
                    }
                  ]}
                >
                  {/* Glossy highlight overlay */}
                  <View style={styles.progressHighlight} />
                </View>
              </View>
            </View>

            {/* Next reset date */}
            {subscription.nextResetDate && (
              <View style={styles.resetInfo}>
                <Text style={styles.resetText}>
                  Limits reset on {subscription.nextResetDate.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}



      {/* Subscription Management */}
      {premium.isPremium && (
        <View style={styles.section}>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                <Crown size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.subscriptionContent}>
                <Text style={styles.subscriptionTitle}>{subscription.subscriptionStatus.name}</Text>
                <Text style={styles.subscriptionDescription}>
                  {subscription.subscriptionStatus.isActive ? t('settings.activeSubscription') : t('settings.inactiveSubscription')}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.manageSubscriptionButton}
              onPress={() => setShowSubscriptionManagement(true)}
            >
              <Text style={styles.manageSubscriptionText}>{t('settings.manageSubscription')}</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Appearance */}
      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '15' }]}>
              <Moon size={20} color={colors.secondary} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.darkMode')}</Text>
              <Text style={styles.settingDescription}>{t('settings.darkModeDescription')}</Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Language */}
        <LanguageSelector
          currentLanguage={i18n.language}
          onLanguageChange={handleLanguageChange}
        />

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
              <Bell size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.pushNotifications')}</Text>
              <Text style={styles.settingDescription}>
                {notificationsLoading
                  ? t('settings.loadingNotifications')
                  : notificationError
                  ? t('settings.notificationError')
                  : t('settings.pushNotificationsDescription')
                }
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            disabled={notificationsLoading}
          />
        </View>
      </View>

      {/* Privacy & Security */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={handleDataPrivacy}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
              <Shield size={20} color={colors.success} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.dataPrivacy')}</Text>
              <Text style={styles.settingDescription}>{t('settings.dataPrivacyDescription')}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Debug Section - Only in development */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <Brain size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Debug Premium Status</Text>
                <Text style={styles.settingDescription}>Check why user shows as Pro</Text>
              </View>
            </View>
            <TouchableOpacity onPress={premium.debugStatus}>
              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                <Zap size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Force Refresh</Text>
                <Text style={styles.settingDescription}>Force refresh from RevenueCat</Text>
              </View>
            </View>
            <TouchableOpacity onPress={premium.refreshStatus}>
              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
                <X size={20} color={colors.error} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Reset to Free</Text>
                <Text style={styles.settingDescription}>Reset premium status to free</Text>
              </View>
            </View>
            <TouchableOpacity onPress={premium.forceClearStatus}>
              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <Shield size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Clear RevenueCat Data</Text>
                <Text style={styles.settingDescription}>Clear cached subscription data</Text>
              </View>
            </View>
            <TouchableOpacity onPress={premium.forceClearStatus}>
              <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Support */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
              <HelpCircle size={20} color={colors.warning} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.helpSupport')}</Text>
              <Text style={styles.settingDescription}>{t('settings.helpSupportDescription')}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAboutClearCue}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.textSecondary + '15' }]}>
              <Info size={20} color={colors.textSecondary} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('settings.aboutClearCue')}</Text>
              <Text style={styles.settingDescription}>{t('settings.aboutClearCueDescription')}</Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      {isAnonymous ? (
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Login')}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}> 
                <User size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.primary }]}>Sign In</Text>
                <Text style={styles.settingDescription}>Sign in to sync your reminders and unlock more features.</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}> 
                <LogOut size={20} color={colors.error} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.error }]}>{t('settings.signOut')}</Text>
                <Text style={styles.settingDescription}>{t('settings.signOutDescription')}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('settings.footerText')}
        </Text>
      </View>

      {/* Banner Ad - Integrated at bottom of content (only for free users) */}
      {!premium.isPremium && (
        <View style={styles.bannerContainer}>
          <BannerAdComponent 
            style={{ marginTop: 16 }} 
            backgroundType="transparent"
          />
        </View>
      )}
    </ScrollView>
  );



  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      {/* Profile Section */}
      {renderProfileSection()}

      {/* Settings Content */}
      {renderSettingsContent()}

      {/* Info Modal */}
      <InfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        content={modalConfig.content}
        type={modalConfig.type}
      />

      {/* Name Edit Modal */}
      <Modal
        visible={showNameEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelNameEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconContainer}>
                  <User size={24} color={colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.modalTitle}>{t('settings.editName')}</Text>
              </View>
              <TouchableOpacity onPress={handleCancelNameEdit}>
                <X size={24} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                {t('settings.nameEditDescription')}
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={newDisplayName}
                  onChangeText={setNewDisplayName}
                  placeholder={t('settings.namePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus={true}
                  maxLength={50}
                />
                <View style={styles.inputBorder} />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelNameEdit}
                disabled={isUpdatingName}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  isUpdatingName && styles.disabledButton,
                ]}
                onPress={handleSaveName}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? (
                  <Text style={styles.saveButtonText}>{t('common.saving')}</Text>
                ) : (
                  <>
                    <Save size={16} color="white" strokeWidth={2} />
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Screen Paywall */}
      <FullScreenPaywall
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        triggerFeature="Premium Features"
      />

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        visible={showSubscriptionManagement}
        onClose={() => setShowSubscriptionManagement(false)}
      />



      {/* Interstitial Ad Trigger - Show after user changes settings */}
      <InterstitialAdTrigger
        triggerOnAction={true}
        actionCompleted={showNameEditModal || showUpgradeModal}
      />

      {/* Privacy Settings Modal */}
      <PrivacySettings
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
      />
    </SafeAreaView>
  );
}

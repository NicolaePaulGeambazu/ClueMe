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
  Settings as SettingsIcon,
  User as UserIcon,
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

const { width } = Dimensions.get('window');

// Mock subscription status - replace with actual subscription service
const useSubscription = () => {
  return {
    isPro: false,
    plan: 'free',
    remainingReminders: 35,
    maxReminders: 50,
    remainingFamilyMembers: 1,
    maxFamilyMembers: 3,
    daysUntilRenewal: 0,
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
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  profileInfo: {
    flex: 1,
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
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  anonymousBadge: {
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '30',
    alignSelf: 'flex-start',
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
  usageSection: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  usageTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.subheadline,
    color: colors.text,
    marginBottom: 16,
  },
  usageItem: {
    marginBottom: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
  },
  usageCount: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
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
    padding: 16,
    marginBottom: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 40,
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  footerText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.footnote,
    marginLeft: 6,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  upgradeButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: 'white',
    marginLeft: 8,
  },
  featureCategory: {
    marginBottom: 24,
  },
  featureCategoryTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.subheadline,
    color: colors.text,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  lockedFeature: {
    opacity: 0.7,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  limitComparison: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  limitRowLast: {
    borderBottomWidth: 0,
  },
  limitLabel: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    flex: 1,
  },
  limitValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitFree: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textTertiary,
  },
  limitSeparator: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textTertiary,
    marginHorizontal: 8,
  },
  limitPro: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.primary,
  },
  pricingSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  pricingTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pricingCardPopular: {
    borderColor: colors.primary,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.caption2,
    color: 'white',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricingPlan: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
    marginRight: 12,
  },
  pricingAmount: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes.title2,
    color: colors.text,
  },
  pricingPeriod: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  pricingSavings: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.success,
    marginTop: 8,
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
});

export default function SettingsScreen() {
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
  const colors = Colors[theme];
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'help' | 'privacy' | 'warning',
  });

  // Tab state
  const [activeTab, setActiveTab] = useState<'account' | 'general' | 'premium'>('account');

  // Name editing state
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const styles = React.useMemo(() => createStyles(colors), [colors]);

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
            } catch (error) {
              console.error('Error signing out:', error);
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
      console.error('Error updating name:', error);
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
    setModalConfig({
      title: t('settings.dataPrivacy'),
      content: t('settings.privacyContent'),
      type: 'privacy',
    });
    setModalVisible(true);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            {!isAnonymous && (
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditName}
              >
                <Edit size={14} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>
                {user?.displayName || t('settings.welcomeUser')}
              </Text>
              {subscription.isPro && (
                <View style={styles.proBadge}>
                  <Crown size={12} color="#FFD700" strokeWidth={2} />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.email}>
              {user?.email || t('settings.userEmail')}
            </Text>

            {isAnonymous && (
              <View style={styles.anonymousBadge}>
                <Text style={styles.anonymousText}>{t('settings.anonymousUser')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Status */}
        {!subscription.isPro && (
          <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgrade}>
            <View style={styles.upgradeContent}>
              <View style={styles.upgradeIcon}>
                <Sparkles size={24} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.upgradeText}>
                <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeSubtitle}>Unlock all features and remove limits</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderAccountTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.accountInfo')}</Text>

        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Mail size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('settings.email')}</Text>
            <Text style={styles.infoValue}>
              {user?.email || t('settings.notAvailable')}
            </Text>
          </View>
        </View>

        {/* Usage Stats */}
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
                    backgroundColor: subscription.remainingReminders < 10 ? colors.warning : colors.primary
                  }
                ]}
              />
            </View>
            {!subscription.isPro && subscription.remainingReminders < 10 && (
              <Text style={styles.usageWarning}>
                Only {subscription.remainingReminders} reminders left this month
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
                    width: `${((subscription.maxFamilyMembers - subscription.remainingFamilyMembers) / subscription.maxFamilyMembers) * 100}%`
                  }
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      {!isAnonymous && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>

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
    </ScrollView>
  );

  const renderGeneralTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('language.title')}</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: colors.tertiary + '15' }]}>
              <Globe size={20} color={colors.tertiary} strokeWidth={2} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('language.title')}</Text>
              <Text style={styles.settingDescription}>{t('language.description')}</Text>
            </View>
          </View>
        </View>

        <LanguageSelector
          currentLanguage={i18n.language}
          onLanguageChange={handleLanguageChange}
        />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>

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
        <Text style={styles.sectionTitle}>{t('settings.privacySecurity')}</Text>

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

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.support')}</Text>

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

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t('settings.footerText')}
        </Text>
        <Text style={styles.footerSubtext}>
          {t('settings.footerSubtext')}
        </Text>
      </View>
    </ScrollView>
  );

  const renderPremiumTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Plan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Plan</Text>
        
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planIcon}>
              {subscription.isPro ? (
                <Crown size={24} color="#FFD700" strokeWidth={2} />
              ) : (
                <Star size={24} color={colors.textSecondary} strokeWidth={2} />
              )}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>
                {subscription.isPro ? 'ClearCue Pro' : 'Free Plan'}
              </Text>
              <Text style={styles.planDescription}>
                {subscription.isPro
                  ? `Renews in ${subscription.daysUntilRenewal} days`
                  : 'Limited features with usage limits'
                }
              </Text>
            </View>
          </View>
          
          {!subscription.isPro && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Zap size={16} color="white" strokeWidth={2} />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Premium Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Features</Text>

        {/* Advanced Reminders */}
        <View style={styles.featureCategory}>
          <Text style={styles.featureCategoryTitle}>Advanced Reminders</Text>
          
          <TouchableOpacity
            style={[styles.featureItem, !subscription.isPro && styles.lockedFeature]}
            onPress={() => !subscription.isPro && handleUpgrade()}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '15' }]}>
                <Calendar size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Complex Recurring Patterns</Text>
                <Text style={styles.featureDescription}>Weekdays only, custom intervals, skip dates</Text>
              </View>
            </View>
            {subscription.isPro ? (
              <CheckCircle size={20} color={colors.success} strokeWidth={2} />
            ) : (
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureItem, !subscription.isPro && styles.lockedFeature]}
            onPress={() => !subscription.isPro && handleUpgrade()}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: colors.secondary + '15' }]}>
                <MapPin size={20} color={colors.secondary} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Location-based Reminders</Text>
                <Text style={styles.featureDescription}>Get reminded when you arrive or leave places</Text>
              </View>
            </View>
            {subscription.isPro ? (
              <CheckCircle size={20} color={colors.success} strokeWidth={2} />
            ) : (
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureItem, !subscription.isPro && styles.lockedFeature]}
            onPress={() => !subscription.isPro && handleUpgrade()}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: colors.tertiary + '15' }]}>
                <Brain size={20} color={colors.tertiary} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Smart Suggestions</Text>
                <Text style={styles.featureDescription}>AI-powered reminder recommendations</Text>
              </View>
            </View>
            {subscription.isPro ? (
              <CheckCircle size={20} color={colors.success} strokeWidth={2} />
            ) : (
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Family Features */}
        <View style={styles.featureCategory}>
          <Text style={styles.featureCategoryTitle}>Family Features</Text>
          
          <TouchableOpacity
            style={[styles.featureItem, !subscription.isPro && styles.lockedFeature]}
            onPress={() => !subscription.isPro && handleUpgrade()}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: colors.warning + '15' }]}>
                <Users size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Unlimited Family Members</Text>
                <Text style={styles.featureDescription}>Add as many family members as you need</Text>
              </View>
            </View>
            {subscription.isPro ? (
              <CheckCircle size={20} color={colors.success} strokeWidth={2} />
            ) : (
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureItem, !subscription.isPro && styles.lockedFeature]}
            onPress={() => !subscription.isPro && handleUpgrade()}
          >
            <View style={styles.featureLeft}>
              <View style={[styles.featureIcon, { backgroundColor: colors.success + '15' }]}>
                <BarChart3 size={20} color={colors.success} strokeWidth={2} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Family Analytics</Text>
                <Text style={styles.featureDescription}>Track family productivity and insights</Text>
              </View>
            </View>
            {subscription.isPro ? (
              <CheckCircle size={20} color={colors.success} strokeWidth={2} />
            ) : (
              <Lock size={20} color={colors.textTertiary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Limits */}
        <View style={styles.featureCategory}>
          <Text style={styles.featureCategoryTitle}>Usage Limits</Text>
          
          <View style={styles.limitComparison}>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Monthly Reminders</Text>
              <View style={styles.limitValues}>
                <Text style={styles.limitFree}>50</Text>
                <Text style={styles.limitSeparator}>→</Text>
                <Text style={styles.limitPro}>Unlimited</Text>
              </View>
            </View>
            
            <View style={[styles.limitRow, styles.limitRowLast]}>
              <Text style={styles.limitLabel}>Family Members</Text>
              <View style={styles.limitValues}>
                <Text style={styles.limitFree}>3</Text>
                <Text style={styles.limitSeparator}>→</Text>
                <Text style={styles.limitPro}>Unlimited</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Pricing */}
      {!subscription.isPro && (
        <View style={styles.pricingSection}>
          <Text style={styles.pricingTitle}>Choose Your Plan</Text>
          
          <TouchableOpacity style={styles.pricingCard} onPress={handleUpgrade}>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingPlan}>Monthly</Text>
              <Text style={styles.pricingAmount}>$4.99</Text>
              <Text style={styles.pricingPeriod}>/month</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.pricingCard, styles.pricingCardPopular]} onPress={handleUpgrade}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>SAVE 17%</Text>
            </View>
            <View style={styles.pricingHeader}>
              <Text style={styles.pricingPlan}>Annual</Text>
              <Text style={styles.pricingAmount}>$49.99</Text>
              <Text style={styles.pricingPeriod}>/year</Text>
            </View>
            <Text style={styles.pricingSavings}>$10 savings compared to monthly</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner Ad - Bottom of Settings (temporarily disabled) */}
      {/* <BannerAdComponent style={{ marginTop: 20, marginBottom: 20 }} /> */}
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'account' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('account')}
        >
          <UserIcon size={20} color={activeTab === 'account' ? 'white' : colors.textSecondary} strokeWidth={2} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'account' ? 'white' : colors.textSecondary },
          ]}>
            {t('settings.account')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('general')}
        >
          <SettingsIcon size={20} color={activeTab === 'general' ? 'white' : colors.textSecondary} strokeWidth={2} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'general' ? 'white' : colors.textSecondary },
          ]}>
            {t('settings.general')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'premium' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('premium')}
        >
          <Crown size={20} color={activeTab === 'premium' ? 'white' : colors.textSecondary} strokeWidth={2} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'premium' ? 'white' : colors.textSecondary },
          ]}>
            Premium
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'account' && renderAccountTab()}
      {activeTab === 'general' && renderGeneralTab()}
      {activeTab === 'premium' && renderPremiumTab()}

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

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.upgradeModalContent]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <X size={24} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.upgradeModalHeader}>
              <View style={styles.upgradeModalIcon}>
                <Crown size={32} color="#FFD700" strokeWidth={2} />
              </View>
              <Text style={styles.upgradeModalTitle}>Upgrade to ClearCue Pro</Text>
              <Text style={styles.upgradeModalSubtitle}>
                Unlock all features and remove limits
              </Text>
            </View>

            <View style={styles.upgradeFeatures}>
              <View style={styles.upgradeFeatureItem}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2} />
                <Text style={styles.upgradeFeatureText}>Unlimited reminders</Text>
              </View>
              <View style={styles.upgradeFeatureItem}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2} />
                <Text style={styles.upgradeFeatureText}>Unlimited family members</Text>
              </View>
              <View style={styles.upgradeFeatureItem}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2} />
                <Text style={styles.upgradeFeatureText}>Advanced recurring patterns</Text>
              </View>
              <View style={styles.upgradeFeatureItem}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2} />
                <Text style={styles.upgradeFeatureText}>Location-based reminders</Text>
              </View>
              <View style={styles.upgradeFeatureItem}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2} />
                <Text style={styles.upgradeFeatureText}>Family analytics & insights</Text>
              </View>
            </View>

            <View style={styles.upgradePricing}>
              <TouchableOpacity style={styles.pricingOption}>
                <View style={styles.pricingOptionHeader}>
                  <Text style={styles.pricingOptionTitle}>Monthly</Text>
                  <Text style={styles.pricingOptionPrice}>$4.99</Text>
                </View>
                <Text style={styles.pricingOptionDescription}>Billed monthly</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.pricingOption, styles.pricingOptionRecommended]}>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>BEST VALUE</Text>
                </View>
                <View style={styles.pricingOptionHeader}>
                  <Text style={styles.pricingOptionTitle}>Annual</Text>
                  <Text style={styles.pricingOptionPrice}>$49.99</Text>
                </View>
                <Text style={styles.pricingOptionDescription}>
                  Billed yearly (save $10)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.upgradeCTA}>
              <Text style={styles.upgradeCTAText}>Start Free Trial</Text>
            </TouchableOpacity>

            <Text style={styles.trialText}>
              7-day free trial • Cancel anytime
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

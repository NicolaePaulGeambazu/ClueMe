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
  User as UserIcon
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import InfoModal from '../../components/InfoModal';
import { LanguageSelector } from '../../components/LanguageSelector';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user, isAnonymous, updateUserProfile } = useAuth();
  const { 
    isEnabled: notificationsEnabled, 
    isLoading: notificationsLoading,
    requestPermissions,
    error: notificationError 
  } = useNotifications();
  const colors = Colors[theme];
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'help' | 'privacy' | 'warning'
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'account' | 'general'>('account');
  
  // Name editing state
  const [showNameEditModal, setShowNameEditModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  const styles = createStyles(colors);

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
      type: 'help'
    });
    setModalVisible(true);
  };

  const handleAboutClearCue = () => {
    setModalConfig({
      title: t('settings.aboutClearCue'),
      content: t('settings.aboutContent'),
      type: 'info'
    });
    setModalVisible(true);
  };

  const handleDataPrivacy = () => {
    setModalConfig({
      title: t('settings.dataPrivacy'),
      content: t('settings.privacyContent'),
      type: 'privacy'
    });
    setModalVisible(true);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
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
            <Text style={styles.displayName}>
              {user?.displayName || t('settings.welcomeUser')}
            </Text>
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
            activeTab === 'account' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('account')}
        >
          <UserIcon size={20} color={activeTab === 'account' ? 'white' : colors.textSecondary} strokeWidth={2} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'account' ? 'white' : colors.textSecondary }
          ]}>
            {t('settings.account')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'general' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setActiveTab('general')}
        >
          <SettingsIcon size={20} color={activeTab === 'general' ? 'white' : colors.textSecondary} strokeWidth={2} />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'general' ? 'white' : colors.textSecondary }
          ]}>
            {t('settings.general')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'account' ? renderAccountTab() : renderGeneralTab()}

      {/* Info Modal */}
      <InfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        content={modalConfig.content}
        type={modalConfig.type}
      />

      {/* Creative Name Edit Modal */}
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
                  isUpdatingName && styles.disabledButton
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
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface,
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
  displayName: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 4,
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
  },
  anonymousText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.caption1,
    color: colors.background,
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
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    marginLeft: 8,
  },
  tabContent: {
    flex: 1,
    padding: 24,
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
});
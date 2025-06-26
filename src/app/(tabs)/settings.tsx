import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
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
  Sun,
  Settings as SettingsIcon
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import InfoModal from '../../components/InfoModal';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, user, isAnonymous } = useAuth();
  const colors = Colors[theme];
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'help' | 'privacy' | 'warning'
  });
  const styles = createStyles(colors);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <User size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          
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

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('settings.memberSince')}</Text>
              <Text style={styles.infoValue}>
                {t('settings.today')}
              </Text>
            </View>
          </View>
        </View>

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
                <Text style={styles.settingDescription}>{t('settings.pushNotificationsDescription')}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
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
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('settings.footerText')}
          </Text>
          <Text style={styles.footerSubtext}>
            {t('settings.footerSubtext')}
          </Text>
        </View>
      </ScrollView>
      <InfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        content={modalConfig.content}
        type={modalConfig.type}
      />
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
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    justifyContent: 'space-between',
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
    borderRadius: 10,
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
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 48,
    marginBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.text.medium,
    fontSize: 16,
    color: colors.text,
  },
});
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
  Mail
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { userService, UserProfile } from '../../services/firebaseService';
import InfoModal from '../../components/InfoModal';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'help' | 'privacy' | 'warning'
  });
  const styles = createStyles(colors);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      if (user?.uid) {
        const profile = await userService.getUserProfile(user.uid);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleHelpSupport = () => {
    setModalConfig({
      title: 'Help & Support',
      content: 'Need help with ClearCue?\n\n📧 Email: support@clearcue.app\n🌐 Website: clearcue.app\n📱 In-app feedback available\n\nWe\'re here to help you get the most out of your reminders!',
      type: 'help'
    });
    setModalVisible(true);
  };

  const handleAboutClearCue = () => {
    setModalConfig({
      title: 'About ClearCue',
      content: 'ClearCue v1.0.0\n\nA simple, private, and effective reminder app designed to help you stay organized without the clutter.\n\n✨ Features:\n• Smart notifications\n• Calendar integration\n• Priority management\n• Family sharing\n• No ads or tracking\n\nMade with ❤️ for productivity',
      type: 'info'
    });
    setModalVisible(true);
  };

  const handleDataPrivacy = () => {
    setModalConfig({
      title: 'Data & Privacy',
      content: '🔒 Your Privacy Matters\n\nClearCue is built with privacy-first principles:\n\n📱 Local Storage:\n• Reminders stored locally on your device\n• No cloud sync unless you choose Firebase\n• Your data stays private\n\n☁️ Firebase Sync (Optional):\n• End-to-end encrypted when enabled\n• Only you can access your data\n• No data mining or tracking\n\n🚫 No Tracking:\n• No analytics or user profiling\n• No third-party data sharing\n• No targeted advertising\n\n📋 Data Control:\n• Export your data anytime\n• Delete all data permanently\n• Complete control over your information\n\nYour reminders, your privacy, your control.',
      type: 'privacy'
    });
    setModalVisible(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <User size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          
          <Text style={styles.displayName}>
            {user?.displayName || userProfile?.displayName || 'Welcome User'}
          </Text>
          <Text style={styles.email}>
            {user?.email || userProfile?.email || 'user@example.com'}
          </Text>
          
          {isAnonymous && (
            <View style={styles.anonymousBadge}>
              <Text style={styles.anonymousText}>Anonymous User</Text>
            </View>
          )}
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Mail size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {user?.email || userProfile?.email || 'Not available'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Calendar size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Today'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Moon size={20} color={colors.secondary} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
                <Bell size={20} color={colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive reminder notifications</Text>
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
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleDataPrivacy}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
                <Shield size={20} color={colors.success} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Data & Privacy</Text>
                <Text style={styles.settingDescription}>Manage your data and privacy settings</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <HelpCircle size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>Get help, contact support, and learn tips</Text>
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
                <Text style={styles.settingLabel}>About ClearCue</Text>
                <Text style={styles.settingDescription}>Version 1.0.0 • Learn more about the app</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        {!isAnonymous && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
                  <LogOut size={20} color={colors.error} strokeWidth={2} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: colors.error }]}>Sign Out</Text>
                  <Text style={styles.settingDescription}>Sign out of your account</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ClearCue is designed to be simple, private, and effective.
          </Text>
          <Text style={styles.footerSubtext}>
            No ads, no tracking, just clear reminders when you need them.
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
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
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
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.warning,
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
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 48,
    marginBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
});
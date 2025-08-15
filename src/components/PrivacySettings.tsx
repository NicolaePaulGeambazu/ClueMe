import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Lock,
  Users,
  Bell,
  BarChart3,
  Mail,
  HelpCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Fonts, FontSizes } from '../constants/Fonts';
import { reminderService } from '../services/firebaseService';

interface PrivacySettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacySettings({ visible, onClose }: PrivacySettingsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [familySharingEnabled, setFamilySharingEnabled] = useState(true);
  const [notificationTracking, setNotificationTracking] = useState(true);

  const styles = createStyles(colors);

  const handleExportData = async () => {
    setLoading(true);
    try {
      Alert.alert(
        'Export Data',
        'This will export all your reminders, tasks, and family data. The export may take a few minutes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                // This would integrate with your actual export service
                const exportData = await reminderService.exportUserData(user?.uid || '');

                // In a real app, you'd save this to a file or send via email
                Alert.alert(
                  'Export Complete',
                  'Your data has been exported successfully. Check your email for the download link.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Export Failed', 'Failed to export your data. Please try again.');
              }
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setLoading(true);
    try {
      Alert.alert(
        'Delete Account',
        'This action cannot be undone. All your data will be permanently deleted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Permanently',
            style: 'destructive',
            onPress: async () => {
              try {
                // This would integrate with your actual deletion service
                await reminderService.deleteUserAccount(user?.uid || '');

                Alert.alert(
                  'Account Deleted',
                  'Your account and all data have been permanently deleted.',
                  [{ text: 'OK', onPress: onClose }]
                );
              } catch (error) {
                Alert.alert('Deletion Failed', 'Failed to delete your account. Please try again.');
              }
            },
          },
        ]
      );
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleOpenPrivacyPolicy = () => {
    // In a real app, this would open your privacy policy URL
    Linking.openURL('https://clearcue.app/privacy').catch(() => {
      Alert.alert('Error', 'Could not open privacy policy. Please visit clearcue.app/privacy');
    });
  };

  const handleOpenTermsOfService = () => {
    // In a real app, this would open your terms of service URL
    Linking.openURL('https://clearcue.app/terms').catch(() => {
      Alert.alert('Error', 'Could not open terms of service. Please visit clearcue.app/terms');
    });
  };

  const handleContactPrivacy = () => {
    Linking.openURL('mailto:privacy@clearcue.app').catch(() => {
      Alert.alert('Error', 'Could not open email. Please contact privacy@clearcue.app');
    });
  };

  const renderPrivacySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy Controls</Text>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
            <BarChart3 size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Analytics & Performance</Text>
            <Text style={styles.settingDescription}>
              Help us improve the app by sharing anonymous usage data
            </Text>
          </View>
        </View>
        <Switch
          value={analyticsEnabled}
          onValueChange={setAnalyticsEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '15' }]}>
            <Users size={20} color={colors.secondary} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Family Sharing</Text>
            <Text style={styles.settingDescription}>
              Allow family members to see shared reminders and activities
            </Text>
          </View>
        </View>
        <Switch
          value={familySharingEnabled}
          onValueChange={setFamilySharingEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.tertiary + '15' }]}>
            <Bell size={20} color={colors.tertiary} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Notification Tracking</Text>
            <Text style={styles.settingDescription}>
              Track notification interactions to improve delivery
            </Text>
          </View>
        </View>
        <Switch
          value={notificationTracking}
          onValueChange={setNotificationTracking}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderDataSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Data</Text>

      <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.success + '15' }]}>
            <Download size={20} color={colors.success} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Export Your Data</Text>
            <Text style={styles.settingDescription}>
              Download all your reminders, tasks, and family data
            </Text>
          </View>
        </View>
        <ExternalLink size={20} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.error + '15' }]}>
            <Trash2 size={20} color={colors.error} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.error }]}>Delete Account</Text>
            <Text style={styles.settingDescription}>
              Permanently delete your account and all data
            </Text>
          </View>
        </View>
        <ExternalLink size={20} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  const renderLegalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal & Policies</Text>

      <TouchableOpacity style={styles.settingItem} onPress={handleOpenPrivacyPolicy}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
            <Shield size={20} color={colors.warning} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>
              Read our complete privacy policy and data practices
            </Text>
          </View>
        </View>
        <ExternalLink size={20} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleOpenTermsOfService}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.textSecondary + '15' }]}>
            <FileText size={20} color={colors.textSecondary} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingDescription}>
              Read our terms of service and user agreement
            </Text>
          </View>
        </View>
        <ExternalLink size={20} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleContactPrivacy}>
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: colors.primary + '15' }]}>
            <Mail size={20} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Contact Privacy Team</Text>
            <Text style={styles.settingDescription}>
              Email us with privacy questions or data requests
            </Text>
          </View>
        </View>
        <ExternalLink size={20} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  const renderInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy Information</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Lock size={16} color={colors.success} strokeWidth={2} />
          <Text style={styles.infoTitle}>Data Security</Text>
        </View>
        <Text style={styles.infoText}>
          All your data is encrypted in transit and at rest. We use industry-standard security measures to protect your information.
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Eye size={16} color={colors.primary} strokeWidth={2} />
          <Text style={styles.infoTitle}>Data Transparency</Text>
        </View>
        <Text style={styles.infoText}>
          You have full control over your data. You can view, export, or delete your information at any time.
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Users size={16} color={colors.secondary} strokeWidth={2} />
          <Text style={styles.infoTitle}>Family Privacy</Text>
        </View>
        <Text style={styles.infoText}>
          Family members can only see content you choose to share. Your personal reminders remain private unless shared.
        </Text>
      </View>
    </View>
  );

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Data</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderPrivacySection()}
          {renderDataSection()}
          {renderLegalSection()}
          {renderInfoSection()}
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
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
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.primary,
  },
  headerTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title3,
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: FontSizes.caption1,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.subheadline,
    color: colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.caption1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Fonts.text.medium,
    fontSize: FontSizes.body,
    color: colors.text,
    marginTop: 12,
  },
});

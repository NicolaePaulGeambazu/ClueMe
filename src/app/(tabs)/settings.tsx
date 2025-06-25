import React, { useState } from 'react';
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
  Search,
  Filter,
  Star
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const styles = createStyles(colors);

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

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your ClearCue experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {isAnonymous ? 'Anonymous User' : (user?.displayName || 'User')}
              </Text>
              <Text style={styles.profileEmail}>
                {isAnonymous ? 'Sign in to sync your data' : (user?.email || 'No email')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('calendar')}
            >
              <Calendar size={24} color={colors.primary} strokeWidth={2} />
              <Text style={styles.quickActionLabel}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('search')}
            >
              <Search size={24} color={colors.success} strokeWidth={2} />
              <Text style={styles.quickActionLabel}>Search</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('filter')}
            >
              <Filter size={24} color={colors.warning} strokeWidth={2} />
              <Text style={styles.quickActionLabel}>Filter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => handleQuickAction('favorites')}
            >
              <Star size={24} color={colors.error} strokeWidth={2} />
              <Text style={styles.quickActionLabel}>Favorites</Text>
            </TouchableOpacity>
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
          
          <TouchableOpacity style={styles.settingItem}>
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
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.warning + '15' }]}>
                <HelpCircle size={20} color={colors.warning} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Help & Support</Text>
                <Text style={styles.settingDescription}>Get help and support</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.textSecondary + '15' }]}>
                <Info size={20} color={colors.textSecondary} strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>About ClearCue</Text>
                <Text style={styles.settingDescription}>Version 1.0.0</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: colors.shadow,
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
});
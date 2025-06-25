import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Calendar, Settings, LogOut, Edit, Shield, HelpCircle, Info } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { userService, UserProfile } from '../../services/firebaseService';

export default function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user, signOut, isAnonymous } = useAuth();
  const colors = Colors[theme];
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              navigation.replace('MainTabs');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const styles = createStyles(colors);

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

        <View style={styles.infoSection}>
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

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Edit size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Edit Profile</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Shield size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Privacy & Security</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <HelpCircle size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>Help & Support</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionIcon}>
              <Info size={20} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionLabel}>About ClearCue</Text>
            </View>
          </TouchableOpacity>

          {!isAnonymous && (
            <TouchableOpacity 
              style={[styles.actionItem, styles.signOutItem]}
              onPress={handleSignOut}
            >
              <View style={styles.actionIcon}>
                <LogOut size={20} color={colors.error} strokeWidth={2} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: colors.error }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
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
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  actionsSection: {
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.text,
  },
  signOutItem: {
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
});
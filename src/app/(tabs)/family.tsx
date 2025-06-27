import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Users, Settings, Activity, Bell, TrendingUp, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../hooks/useFamily';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import FamilyInvitationModal from '../../components/FamilyInvitationModal';
import { formatForActivity } from '../../utils/dateUtils';

// Mock types
interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  lastActive: string;
}

interface FamilyActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  memberId: string;
  memberName: string;
}

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, isAnonymous } = useAuth();
  const { 
    family, 
    members, 
    activities, 
    pendingInvitations,
    isLoading, 
    error, 
    loadFamily, 
    removeMember,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    leaveFamily,
    isOwner,
    hasPendingInvitations
  } = useFamily();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // State management
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'notifications'>('members');
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadFamily();
    setIsRefreshing(false);
  }, [loadFamily]);

  const handleMemberPress = (member: any) => {
    // Navigate to member details
    console.log('Member pressed:', member.name);
  };

  const handleMemberMenu = (member: any) => {
    Alert.alert(
      member.name,
      t('family.memberActions'),
      [
        { text: t('family.edit'), onPress: () => console.log('Edit member:', member.id) },
        { 
          text: t('family.remove'), 
          style: 'destructive', 
          onPress: () => handleRemoveMember(member) 
        },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  const handleRemoveMember = async (member: any) => {
    try {
      await removeMember(member.id);
      Alert.alert(t('common.success'), t('family.removeSuccess'));
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert(t('common.error'), t('family.removeError'));
    }
  };

  const handleActivityPress = (activity: any) => {
    // Navigate to activity details or related screen
    console.log('Activity pressed:', activity.type);
  };

  const handleInvitations = () => {
    setShowInvitationModal(true);
  };

  const handleLeaveFamily = () => {
    Alert.alert(
      t('family.leaveFamily'),
      t('family.leaveFamilyConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('family.leaveFamily'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await leaveFamily();
              Alert.alert(t('common.success'), t('family.leaveFamilySuccess'));
            } catch (error) {
              console.error('Error leaving family:', error);
              Alert.alert(t('common.error'), t('family.leaveFamilyError'));
            }
          } 
        }
      ]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('family.loading')}</Text>
          {!family && (
            <Text style={styles.loadingSubtext}>{t('family.creatingFamily')}</Text>
          )}
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFamily}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show no family state (this should rarely happen now with auto-creation)
  if (!family) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No family found</Text>
          <Text style={styles.loadingSubtext}>Create or join a family to get started</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFamily}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <View style={styles.tabContent}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersCount}>{members.length} {t('family.membersCount')}</Text>
              <View style={styles.membersActions}>
                {isOwner && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleInvitations}>
                    <Mail size={20} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.actionButtonText}>{t('family.invitations.sendInvitation')}</Text>
                    {hasPendingInvitations && <View style={styles.notificationBadge} />}
                  </TouchableOpacity>
                )}
                {!isOwner && (
                  <TouchableOpacity style={styles.actionButton} onPress={handleInvitations}>
                    <Mail size={20} color={colors.primary} strokeWidth={2} />
                    <Text style={styles.actionButtonText}>{t('family.invitations.title')}</Text>
                    {hasPendingInvitations && <View style={styles.notificationBadge} />}
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <ScrollView 
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberCard}
                  onPress={() => handleMemberPress(member)}
                  onLongPress={() => handleMemberMenu(member)}
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <Text style={styles.memberRole}>{t(`family.roles.${member.role}`)}</Text>
                  </View>
                  <View style={[styles.onlineIndicator, { backgroundColor: member.isOnline ? colors.success : colors.textTertiary }]} />
                </TouchableOpacity>
              ))}
              
              {/* Leave Family Button for non-owners */}
              {!isOwner && (
                <TouchableOpacity style={styles.leaveFamilyButton} onPress={handleLeaveFamily}>
                  <Text style={styles.leaveFamilyButtonText}>{t('family.leaveFamily')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );

      case 'activity':
        return (
          <View style={styles.tabContent}>
            <ScrollView 
              style={styles.activityList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityCard}
                  onPress={() => handleActivityPress(activity)}
                >
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activityTimestamp}>{formatForActivity(activity.createdAt)}</Text>
                  </View>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                  <Text style={styles.activityMember}>by {activity.memberName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyText}>{t('family.noNotifications')}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]}
          onPress={() => setActiveTab('members')}
        >
          <Users size={20} color={activeTab === 'members' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'members' && styles.activeTabLabel]}>{t('family.members')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activity' && styles.activeTabButton]}
          onPress={() => setActiveTab('activity')}
        >
          <Activity size={20} color={activeTab === 'activity' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'activity' && styles.activeTabLabel]}>{t('family.activity')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.activeTabButton]}
          onPress={() => setActiveTab('notifications')}
        >
          <Bell size={20} color={activeTab === 'notifications' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>{t('family.notifications')}</Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}

      {/* Family Invitation Modal */}
      <FamilyInvitationModal
        visible={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        pendingInvitations={pendingInvitations}
        onSendInvitation={sendInvitation}
        onAcceptInvitation={acceptInvitation}
        onDeclineInvitation={declineInvitation}
        isOwner={isOwner}
      />
    </View>
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
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingSubtext: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.primary + '15',
  },
  tabLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersCount: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
  },
  membersActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  notificationBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  membersList: {
    flex: 1,
  },
  memberCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberRole: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activityList: {
    flex: 1,
  },
  activityCard: {
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
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
  },
  activityTimestamp: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  activityDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  activityMember: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.surface,
  },
  leaveFamilyButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  leaveFamilyButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.surface,
  },
});
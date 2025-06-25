import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Plus, Settings, Activity, Bell, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

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
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  // State management
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'notifications'>('members');

  // Mock family ID - in real app, get from context
  const familyId = 'mock-family-id';
  const isOwner = true; // Mock owner status

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data
      const mockMembers: FamilyMember[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Owner',
          isOnline: true,
          lastActive: '2 minutes ago'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'Member',
          isOnline: false,
          lastActive: '1 hour ago'
        }
      ];

      const mockActivities: FamilyActivity[] = [
        {
          id: '1',
          type: 'reminder_created',
          title: 'New reminder created',
          description: 'John created a new reminder for tomorrow',
          timestamp: '2 hours ago',
          memberId: '1',
          memberName: 'John Doe'
        }
      ];

      setMembers(mockMembers);
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading family data:', error);
      Alert.alert('Error', 'Failed to load family data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  }, []);

  const handleMemberPress = (member: FamilyMember) => {
    // Navigate to member details
    console.log('Member pressed:', member.name);
  };

  const handleMemberMenu = (member: FamilyMember) => {
    Alert.alert(
      member.name,
      'Choose an action',
      [
        { text: 'Edit', onPress: () => console.log('Edit member:', member.id) },
        { text: 'Remove', style: 'destructive', onPress: () => handleRemoveMember(member) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleRemoveMember = async (member: FamilyMember) => {
    try {
      setMembers(prev => prev.filter(m => m.id !== member.id));
      Alert.alert('Success', `${member.name} has been removed from the family.`);
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member. Please try again.');
    }
  };

  const handleActivityPress = (activity: FamilyActivity) => {
    // Navigate to activity details or related screen
    console.log('Activity pressed:', activity.type);
  };

  const handleAddMember = () => {
    // Navigate to add member screen
    console.log('Add member pressed');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <View style={styles.tabContent}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersCount}>{members.length} Members</Text>
              {isOwner && (
                <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
                  <Plus size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={styles.addButtonText}>Add Member</Text>
                </TouchableOpacity>
              )}
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
                >
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                    <Text style={styles.memberRole}>{member.role}</Text>
                  </View>
                  <View style={[styles.onlineIndicator, { backgroundColor: member.isOnline ? colors.success : colors.textTertiary }]} />
                </TouchableOpacity>
              ))}
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
                    <Text style={styles.activityTimestamp}>{activity.timestamp}</Text>
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
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading family...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'members' && styles.activeTabButton]}
          onPress={() => setActiveTab('members')}
        >
          <Users size={20} color={activeTab === 'members' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'members' && styles.activeTabLabel]}>Members</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activity' && styles.activeTabButton]}
          onPress={() => setActiveTab('activity')}
        >
          <Activity size={20} color={activeTab === 'activity' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'activity' && styles.activeTabLabel]}>Activity</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.activeTabButton]}
          onPress={() => setActiveTab('notifications')}
        >
          <Bell size={20} color={activeTab === 'notifications' ? colors.primary : colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  memberRole: {
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  activityTimestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  activityDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  activityMember: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
});
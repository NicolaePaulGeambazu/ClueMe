
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FluidContainer, FluidHeader, FluidButton } from '../components/design-system';
import { useFamily } from '../hooks/useFamily';
import { formatDateUK } from '../utils/formatDateUK';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  joinedDate: Date;
  isOnline: boolean;
  reminderCount: number;
}

const FamilyFluid: React.FC = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const { family } = useFamily();

  useEffect(() => {
    // Mock family data - replace with actual data fetching
    const mockMembers: FamilyMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        role: 'admin',
        joinedDate: new Date(Date.now() - 86400000 * 30),
        isOnline: true,
        reminderCount: 15,
      },
      {
        id: '2',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        role: 'member',
        joinedDate: new Date(Date.now() - 86400000 * 25),
        isOnline: false,
        reminderCount: 8,
      },
      {
        id: '3',
        name: 'Emma Johnson',
        email: 'emma@example.com',
        role: 'member',
        joinedDate: new Date(Date.now() - 86400000 * 20),
        isOnline: true,
        reminderCount: 12,
      },
    ];
    setFamilyMembers(mockMembers);
    setInviteCode('FAMILY2025');
  }, []);

  const handleInviteMember = () => {
    Alert.alert(
      'Invite Family Member',
      'Share this invite code with your family member:',
      [
        { text: 'Copy Code', onPress: () => console.log('Copy invite code') },
        { text: 'Share Link', onPress: () => console.log('Share invite link') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${memberName} from your family? They will lose access to shared reminders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
          },
        },
      ]
    );
  };

  const handleMemberPress = (member: FamilyMember) => {
    Alert.alert(
      member.name,
      `View ${member.name}'s reminders and activity`,
      [
        { text: 'View Reminders', onPress: () => console.log('View reminders') },
        { text: 'Send Message', onPress: () => console.log('Send message') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderMemberItem = (member: FamilyMember) => (
    <TouchableOpacity
      key={member.id}
      onPress={() => handleMemberPress(member)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#007AFF',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16,
        }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '600',
            color: '#FFFFFF',
          }}>
            {member.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#000000',
              marginRight: 8,
            }}>
              {member.name}
            </Text>
            {member.role === 'admin' && (
              <View style={{
                backgroundColor: '#FF9500',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}>
                  ADMIN
                </Text>
              </View>
            )}
          </View>
          
          <Text style={{
            fontSize: 15,
            color: '#8E8E93',
            marginBottom: 4,
          }}>
            {member.email}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: member.isOnline ? '#34C759' : '#8E8E93',
              marginRight: 6,
            }} />
            <Text style={{
              fontSize: 13,
              color: '#8E8E93',
            }}>
              {member.isOnline ? 'Online' : 'Offline'} • {member.reminderCount} reminders • Joined {formatDateUK(member.joinedDate)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleRemoveMember(member.id, member.name)}
          style={{ padding: 8 }}
        >
          <Icon name="ellipsis-horizontal" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FluidContainer>
        <FluidHeader
          title="Family"
          rightAction={{
            icon: 'person-add',
            onPress: handleInviteMember,
          }}
        />
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ padding: 20 }}>
            {/* Family Stats */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#000000',
                marginBottom: 16,
              }}>
                Johnson Family
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#007AFF',
                  }}>
                    {familyMembers.length}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#8E8E93',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Members
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#34C759',
                  }}>
                    {familyMembers.filter(m => m.isOnline).length}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#8E8E93',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Online
                  </Text>
                </View>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: '#FF9500',
                  }}>
                    {familyMembers.reduce((sum, m) => sum + m.reminderCount, 0)}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#8E8E93',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    Reminders
                  </Text>
                </View>
              </View>
            </View>

            {/* Invite Code */}
            <View style={{
              backgroundColor: '#E3F2FD',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#007AFF20',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Icon name="key" size={20} color="#007AFF" />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#007AFF',
                  marginLeft: 8,
                }}>
                  Family Invite Code
                </Text>
              </View>
              <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#007AFF',
                letterSpacing: 2,
                marginBottom: 8,
              }}>
                {inviteCode}
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#007AFF',
              }}>
                Share this code with family members to invite them
              </Text>
            </View>

            {/* Family Members */}
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#8E8E93',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}>
              Family Members ({familyMembers.length})
            </Text>
            
            {familyMembers.map(renderMemberItem)}
            
            <FluidButton
              title="Invite Family Member"
              onPress={handleInviteMember}
              variant="secondary"
              icon="person-add-outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </ScrollView>
      </FluidContainer>
    </SafeAreaView>
  );
};

export default FamilyFluid;

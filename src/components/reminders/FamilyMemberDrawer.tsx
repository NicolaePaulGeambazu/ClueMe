import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Check, User, Crown, Shield, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { DrawerModal } from '../common/DrawerModal';

interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  role?: 'owner' | 'admin' | 'member';
  isOnline?: boolean;
}

interface FamilyMemberDrawerProps {
  visible: boolean;
  onClose: () => void;
  members: FamilyMember[];
  assignedTo: string[];
  onToggleMember: (userId: string) => void;
  colors: any;
}

export const FamilyMemberDrawer: React.FC<FamilyMemberDrawerProps> = ({
  visible,
  onClose,
  members,
  assignedTo,
  onToggleMember,
  colors,
}) => {
  const { t } = useTranslation();

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} color={colors.warning} />;
      case 'admin':
        return <Shield size={16} color={colors.primary} />;
      default:
        return <User size={16} color={colors.textSecondary} />;
    }
  };

  const getRoleText = (role?: string) => {
    switch (role) {
      case 'owner':
        return t('family.roles.owner');
      case 'admin':
        return t('family.roles.admin');
      default:
        return t('family.roles.member');
    }
  };

  const getDisplayName = (member: FamilyMember) => {
    if (member.name && member.name.trim()) {
      return member.name;
    }
    if (member.email) {
      return member.email.split('@')[0]; // Use email prefix as fallback display name
    }
    return t('family.unknownMember');
  };

  return (
    <DrawerModal
      visible={visible}
      onClose={onClose}
      title={t('quickAdd.assignToFamilyMembers')}
      colors={colors}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {t('family.noMembers')}
            </Text>
            <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
              {t('family.inviteMembersToAssign')}
            </Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {members.map((member) => {
              const isAssigned = assignedTo.includes(member.userId);
              return (
                <TouchableOpacity
                  key={member.id}
                  testID={`family-member-${member.id}`}
                  style={[
                    styles.memberItem,
                    {
                      backgroundColor: isAssigned ? colors.primary + '10' : colors.surface,
                      borderColor: isAssigned ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => onToggleMember(member.userId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberHeader}>
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, { color: colors.text }]}>
                          {getDisplayName(member)}
                        </Text>
                        {member.isOnline && (
                          <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
                        )}
                      </View>
                      
                      <View style={styles.memberRole}>
                        {getRoleIcon(member.role)}
                        <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                          {getRoleText(member.role)}
                        </Text>
                      </View>
                    </View>


                  </View>

                  <View style={styles.assignmentStatus}>
                    {isAssigned ? (
                      <View style={[styles.assignedBadge, { backgroundColor: colors.primary }]}>
                        <Check size={16} color="white" strokeWidth={2.5} />
                      </View>
                    ) : (
                      <View style={[styles.unassignedBadge, { borderColor: colors.borderLight }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Summary */}
        {assignedTo.length > 0 && (
          <View style={[styles.summary, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.summaryText, { color: colors.primary }]}>
              {t('quickAdd.assignedCount', { count: assignedTo.length })}
            </Text>
          </View>
        )}

        {/* Done Button */}
        <TouchableOpacity
          testID="family-drawer-done"
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={styles.doneButtonText}>{t('common.done')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </DrawerModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    marginBottom: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  assignmentStatus: {
    marginLeft: 12,
  },
  assignedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  summary: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

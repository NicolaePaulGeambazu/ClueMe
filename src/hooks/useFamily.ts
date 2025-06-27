import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { familyService, Family, FamilyMember, FamilyActivity, FamilyInvitation } from '../services/firebaseService';

export const useFamily = () => {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activities, setActivities] = useState<FamilyActivity[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's family
  const loadFamily = useCallback(async () => {
    if (!user?.uid) {
      setFamily(null);
      setMembers([]);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let userFamily = await familyService.getUserFamily(user.uid);

      // If no family exists, create a default one
      if (!userFamily) {
        console.log('🏠 No family found, creating default family...');
        userFamily = await familyService.createDefaultFamilyIfNeeded(
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'User',
          user.email || ''
        );
      }

      setFamily(userFamily);

      if (userFamily) {
        // Load family members
        const familyMembers = await familyService.getFamilyMembers(userFamily.id);
        setMembers(familyMembers);

        // Load family activities
        const familyActivities = await familyService.getFamilyActivities(userFamily.id);
        setActivities(familyActivities);
      } else {
        setMembers([]);
        setActivities([]);
      }
    } catch (err) {
      console.error('Error loading family:', err);
      setError(err instanceof Error ? err.message : 'Failed to load family');
      setFamily(null);
      setMembers([]);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, user?.displayName, user?.email]);

  // Create a new family
  const createFamily = useCallback(async (familyData: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      const familyId = await familyService.createFamily(familyData);

      // Reload family data
      await loadFamily();

      return familyId;
    } catch (err) {
      console.error('Error creating family:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family');
      throw err;
    }
  }, [user?.uid, loadFamily]);

  // Add a family member
  const addMember = useCallback(async (memberData: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActive' | 'isOnline'>) => {
    if (!family) {
      throw new Error('No family loaded');
    }

    try {
      setError(null);
      const memberId = await familyService.addFamilyMember(memberData);

      // Reload family data
      await loadFamily();

      return memberId;
    } catch (err) {
      console.error('Error adding family member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add family member');
      throw err;
    }
  }, [family, loadFamily]);

  // Remove a family member
  const removeMember = useCallback(async (memberId: string) => {
    if (!family) {
      throw new Error('No family loaded');
    }

    try {
      setError(null);
      await familyService.removeFamilyMember(memberId, family.id);

      // Reload family data
      await loadFamily();
    } catch (err) {
      console.error('Error removing family member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove family member');
      throw err;
    }
  }, [family, loadFamily]);

  // Create family activity
  const createActivity = useCallback(async (activityData: Omit<FamilyActivity, 'id' | 'createdAt'>) => {
    if (!family) {
      throw new Error('No family loaded');
    }

    try {
      setError(null);
      const activityId = await familyService.createFamilyActivity(activityData);

      // Reload activities
      const familyActivities = await familyService.getFamilyActivities(family.id);
      setActivities(familyActivities);

      return activityId;
    } catch (err) {
      console.error('Error creating family activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to create family activity');
      throw err;
    }
  }, [family]);

  // Load pending invitations
  const loadPendingInvitations = useCallback(async () => {
    if (!user?.email) {
      setPendingInvitations([]);
      return;
    }

    try {
      const invitations = await familyService.getPendingInvitations(user.email);
      setPendingInvitations(invitations);
    } catch (err) {
      console.error('Error loading pending invitations:', err);
      setPendingInvitations([]);
    }
  }, [user?.email]);

  // Send family invitation
  const sendInvitation = useCallback(async (inviteeEmail: string) => {
    if (!family || !user?.uid || !user?.email) {
      throw new Error('No family loaded or user not authenticated');
    }

    try {
      setError(null);
      const invitationId = await familyService.sendFamilyInvitation({
        familyId: family.id,
        familyName: family.name,
        inviterId: user.uid,
        inviterName: user.displayName || user.email.split('@')[0],
        inviterEmail: user.email,
        inviteeEmail,
      });

      return invitationId;
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      throw err;
    }
  }, [family, user?.uid, user?.email, user?.displayName]);

  // Accept family invitation
  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user?.uid || !user?.email) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await familyService.acceptFamilyInvitation(
        invitationId,
        user.uid,
        user.displayName || user.email.split('@')[0],
        user.email
      );

      // Reload family data and invitations
      await loadFamily();
      await loadPendingInvitations();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      throw err;
    }
  }, [user?.uid, user?.email, user?.displayName, loadFamily, loadPendingInvitations]);

  // Decline family invitation
  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      await familyService.declineFamilyInvitation(invitationId);

      // Reload invitations
      await loadPendingInvitations();
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
      throw err;
    }
  }, [loadPendingInvitations]);

  // Leave family
  const leaveFamily = useCallback(async () => {
    if (!family) {
      throw new Error('No family loaded');
    }

    const currentMember = members.find(member => member.userId === user?.uid);
    if (!currentMember) {
      throw new Error('Not a member of this family');
    }

    try {
      setError(null);
      await familyService.leaveFamily(family.id, currentMember.id);

      // Clear family data
      setFamily(null);
      setMembers([]);
      setActivities([]);
    } catch (err) {
      console.error('Error leaving family:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave family');
      throw err;
    }
  }, [family, members, user?.uid]);

  // Set up real-time listeners
  useEffect(() => {
    if (!family?.id) {return;}

    const unsubscribeMembers = familyService.onFamilyMembersChange(family.id, (newMembers) => {
      setMembers(newMembers);
    });

    const unsubscribeActivities = familyService.onFamilyActivitiesChange(family.id, (newActivities) => {
      setActivities(newActivities);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeActivities();
    };
  }, [family?.id]);

  // Load family on mount and when user changes
  useEffect(() => {
    loadFamily();
    loadPendingInvitations();
  }, [loadFamily, loadPendingInvitations]);

  return {
    family,
    members,
    activities,
    pendingInvitations,
    isLoading,
    error,
    loadFamily,
    createFamily,
    addMember,
    removeMember,
    createActivity,
    loadPendingInvitations,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    leaveFamily,
    isOwner: family?.ownerId === user?.uid,
    isMember: !!family,
    hasPendingInvitations: pendingInvitations.length > 0,
  };
};

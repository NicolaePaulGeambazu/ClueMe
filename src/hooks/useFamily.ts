import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reminderService, Family, FamilyMember, FamilyActivity, FamilyInvitation, getValidFamilyMembers, clearFamilyMembersCache } from '../services/firebaseService';

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
      console.log('[useFamily] No user UID available');
      setFamily(null);
      setMembers([]);
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[useFamily] Loading family for user:', user.uid);

      let userFamily = await reminderService.getUserFamily(user.uid);
      console.log('[useFamily] User family result:', userFamily ? 'found' : 'not found');

      // If no family exists, create a default one
      if (!userFamily) {
        console.log('[useFamily] Creating default family for user:', user.uid);
        userFamily = await reminderService.createDefaultFamilyIfNeeded(
          user.uid,
          user.displayName || user.email?.split('@')[0] || 'User',
          user.email || ''
        );
        console.log('[useFamily] Default family created:', userFamily ? 'success' : 'failed');
      }

      setFamily(userFamily);

      if (userFamily) {
        console.log('[useFamily] Loading family members for family:', userFamily.id);
        // Clear cache to force fresh fetch
        clearFamilyMembersCache(userFamily.id);
        // Load family members
        const familyMembers = await getValidFamilyMembers(userFamily.id);
        console.log('[useFamily] Family members loaded:', familyMembers.length);
        setMembers(familyMembers);

        // Load family activities
        const familyActivities = await reminderService.getFamilyActivities(userFamily.id);
        setActivities(familyActivities);
      } else {
        console.log('[useFamily] No family available, setting empty arrays');
        setMembers([]);
        setActivities([]);
      }
    } catch (err) {
      console.error('[useFamily] Error loading family:', err);
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
      const familyId = await reminderService.createFamily(familyData);

      // Reload family data to get the new family
      await loadFamily();

      return familyId;
    } catch (err) {
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
      const memberId = await reminderService.addFamilyMember(memberData);

      // The listeners will automatically update the members list
      
      return memberId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family member');
      throw err;
    }
  }, [family]);

  // Remove a family member
  const removeMember = useCallback(async (memberId: string) => {
    if (!family) {
      throw new Error('No family loaded');
    }

    try {
      setError(null);
      await reminderService.removeFamilyMember(memberId, family.id);

      // The listeners will automatically update the members list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove family member');
      throw err;
    }
  }, [family]);

  // Create family activity
  const createActivity = useCallback(async (activityData: Omit<FamilyActivity, 'id' | 'createdAt'>) => {
    if (!family) {
      throw new Error('No family loaded');
    }

    try {
      setError(null);
      const activityId = await reminderService.createFamilyActivity(activityData);

      // The listeners will automatically update the activities list
      
      return activityId;
    } catch (err) {
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
      const invitations = await reminderService.getPendingInvitations(user.email);
      setPendingInvitations(invitations);
    } catch (err) {
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
      const invitationId = await reminderService.sendFamilyInvitation({
        familyId: family.id,
        familyName: family.name,
        inviterId: user.uid,
        inviterName: user.displayName || user.email.split('@')[0],
        inviterEmail: user.email,
        inviteeEmail,
      });

      return invitationId;
    } catch (err) {
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
      await reminderService.acceptFamilyInvitation(
        invitationId,
        user.uid,
        user.displayName || user.email.split('@')[0],
        user.email
      );

      // Reload family data and invitations
      await loadFamily();
      await loadPendingInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      throw err;
    }
  }, [user?.uid, user?.email, user?.displayName, loadFamily, loadPendingInvitations]);

  // Decline family invitation
  const declineInvitation = useCallback(async (invitationId: string) => {
    try {
      setError(null);
      await reminderService.declineFamilyInvitation(invitationId);

      // Reload invitations
      await loadPendingInvitations();
    } catch (err) {
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
      await reminderService.leaveFamily(family.id, currentMember.id);

      // Clear family data
      setFamily(null);
      setMembers([]);
      setActivities([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave family');
      throw err;
    }
  }, [family, members, user?.uid]);

  // Set up real-time listeners
  useEffect(() => {
    if (!family?.id) {
      return;
    }


    
    let unsubscribeMembers: (() => void) | null = null;
    let unsubscribeActivities: (() => void) | null = null;

    try {
      unsubscribeMembers = reminderService.onFamilyMembersChange(family.id, (newMembers) => {
        try {
      
          setMembers(newMembers);
        } catch (error) {
          // Fallback to manual load on error
          loadFamily();
        }
      });

      unsubscribeActivities = reminderService.onFamilyActivitiesChange(family.id, (newActivities) => {
        try {
      
          setActivities(newActivities);
        } catch (error) {
          // Fallback to manual load on error
          loadFamily();
        }
      });
    } catch (error) {
      // Fallback to manual loading
      loadFamily();
    }

    return () => {
              // Cleaning up family listeners
      if (unsubscribeMembers) {
        try {
          unsubscribeMembers();
        } catch (error) {
        }
      }
      if (unsubscribeActivities) {
        try {
          unsubscribeActivities();
        } catch (error) {
        }
      }
    };
  }, [family?.id, loadFamily]);

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

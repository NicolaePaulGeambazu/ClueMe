import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import firebaseService, { FamilyMember, Family, getValidFamilyMembers } from '../services/firebaseService';

interface FamilyContextType {
  family: Family | null;
  familyMembers: FamilyMember[] | null;
  currentMember: FamilyMember | null;
  isLoading: boolean;
  hasFamily: boolean;
  isOwner: boolean;
  createFamily: (name: string, description?: string) => Promise<void>;
  inviteMember: (email: string, name?: string) => Promise<void>;
  updateMember: (memberId: string, updates: Partial<FamilyMember>) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  refreshFamily: () => Promise<void>;
}

export const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user, requireAuth } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[] | null>(null);
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadFamily();
    } else {
      setFamily(null);
      setFamilyMembers(null);
      setCurrentMember(null);
    }
  }, [user]);

  const loadFamily = async () => {
    if (!user || user.isAnonymous) {return;}

    try {
      setIsLoading(true);

      // Get user's family
      const userFamily = await firebaseService.getUserFamily(user.uid);

      if (userFamily) {
        setFamily(userFamily);
        const members = await getValidFamilyMembers(userFamily.id);
        setFamilyMembers(members);

        // Find current user's member record
        const userMember = members.find((m: FamilyMember) => m.userId === user.uid);
        setCurrentMember(userMember || null);
      } else {
        // Create a default family for the user
        const defaultFamily = await firebaseService.createDefaultFamilyIfNeeded(
          user.uid,
          user.displayName || 'User',
          user.email || ''
        );

        if (defaultFamily) {
          setFamily(defaultFamily);
          const members = await getValidFamilyMembers(defaultFamily.id);
          setFamilyMembers(members);

          // Find current user's member record
          const userMember = members.find((m: FamilyMember) => m.userId === user.uid);
          setCurrentMember(userMember || null);
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const createFamily = async (name: string, description?: string) => {
    if (!requireAuth() || !user) {
      throw new Error('Authentication required');
    }

    try {
      const familyId = await firebaseService.createFamily({
        name,
        description,
        ownerId: user.uid,
        ownerName: user.displayName || 'User',
        memberCount: 1,
        maxMembers: 2, // Free tier default
        settings: {
          allowMemberInvites: true,
          allowReminderSharing: true,
          allowActivityNotifications: true,
        },
      });

      // Add the owner as the first member
      await firebaseService.addFamilyMember({
        familyId,
        userId: user.uid,
        name: user.displayName || 'You',
        email: user.email || '',
        role: 'owner',
        createdBy: user.uid,
      });

      await loadFamily();
    } catch (error) {
      throw error;
    }
  };

  const inviteMember = async (email: string, name?: string) => {
    if (!requireAuth() || !family) {
      throw new Error('Authentication required');
    }

    try {
      // Add member to family
      await firebaseService.addFamilyMember({
        familyId: family.id,
        userId: '', // Will be set when user accepts invitation
        name: name || email.split('@')[0],
        email,
        role: 'member',
        createdBy: user!.uid,
      });

      await loadFamily();
    } catch (error) {
      throw error;
    }
  };

  const updateMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    if (!requireAuth()) {
      throw new Error('Authentication required');
    }

    try {
      // Note: Firebase service doesn't have updateFamilyMember method
      // This would need to be implemented in the Firebase service
      await loadFamily();
    } catch (error) {
      throw error;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!requireAuth() || !family) {
      throw new Error('Authentication required');
    }

    try {
      await firebaseService.removeFamilyMember(memberId, family.id);
      await loadFamily();
    } catch (error) {
      throw error;
    }
  };

  const refreshFamily = async () => {
    await loadFamily();
  };

  const hasFamily = family !== null;
  const isOwner = user && family ? family.ownerId === user.uid : false;

  return (
    <FamilyContext.Provider value={{
      family,
      familyMembers,
      currentMember,
      isLoading,
      hasFamily,
      isOwner,
      createFamily,
      inviteMember,
      updateMember,
      removeMember,
      refreshFamily,
    }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}

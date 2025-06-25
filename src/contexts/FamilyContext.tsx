import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mockDataService, FamilyMember, Family } from '../services/mockData';

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

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

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
    if (!user || user.isAnonymous) return;

    try {
      setIsLoading(true);
      
      // Check if user owns a family
      const ownedFamily = await mockDataService.getFamilyByOwner(user.uid);
      
      if (ownedFamily) {
        setFamily(ownedFamily);
        const members = await mockDataService.getFamilyMembers(ownedFamily.id);
        setFamilyMembers(members);
        
        // Find current user's member record
        const userMember = members.find(m => m.email === user.email);
        setCurrentMember(userMember || null);
      } else {
        // Create a sample family for demo purposes
        const sampleFamily: Family = {
          id: `family_${user.uid}`,
          name: 'My Family',
          description: 'Family reminder hub',
          ownerId: user.uid,
          memberCount: 1,
          maxMembers: 10,
          settings: {
            allowMemberInvites: true,
            requireApprovalForReminders: false,
            sharedCalendar: true,
          },
          createdAt: new Date().toISOString(),
        };

        const sampleMember: FamilyMember = {
          id: `${sampleFamily.id}_member_${user.uid}`,
          name: user.displayName || 'You',
          email: user.email || undefined,
          role: 'admin',
          status: 'active',
          joinedAt: new Date().toISOString(),
          tags: ['parent'],
          preferences: {
            receiveNotifications: true,
            notificationMethods: ['push'],
            quietHours: {
              enabled: false,
              start: '22:00',
              end: '08:00',
            },
          },
        };

        setFamily(sampleFamily);
        setFamilyMembers([sampleMember]);
        setCurrentMember(sampleMember);
      }
    } catch (error) {
      console.error('Error loading family:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFamily = async (name: string, description?: string) => {
    if (!requireAuth() || !user) {
      throw new Error('Authentication required');
    }

    try {
      const familyId = await mockDataService.createFamily({
        name,
        description,
        ownerId: user.uid,
        maxMembers: 10,
        settings: {
          allowMemberInvites: true,
          requireApprovalForReminders: false,
          sharedCalendar: true,
        },
      });

      // Add the owner as the first member
      await mockDataService.addFamilyMember(familyId, {
        name: user.displayName || 'You',
        email: user.email || undefined,
        role: 'admin',
        status: 'active',
        tags: ['owner'],
        preferences: {
          receiveNotifications: true,
          notificationMethods: ['push'],
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
      });

      await loadFamily();
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  };

  const inviteMember = async (email: string, name?: string) => {
    if (!requireAuth() || !family) {
      throw new Error('Authentication required');
    }

    try {
      // Mock invite member - in real app, this would send an invitation
      await mockDataService.addFamilyMember(family.id, {
        name: name || email.split('@')[0],
        email,
        role: 'member',
        status: 'pending',
        tags: [],
        preferences: {
          receiveNotifications: true,
          notificationMethods: ['push'],
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
      });

      await loadFamily();
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  };

  const updateMember = async (memberId: string, updates: Partial<FamilyMember>) => {
    if (!requireAuth()) {
      throw new Error('Authentication required');
    }

    try {
      await mockDataService.updateFamilyMember(memberId, updates);
      await loadFamily();
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!requireAuth()) {
      throw new Error('Authentication required');
    }

    try {
      await mockDataService.removeFamilyMember(memberId);
      await loadFamily();
    } catch (error) {
      console.error('Error removing member:', error);
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
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'bill' | 'med' | 'event' | 'note';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueTime?: string;
  location?: string;
  completed: boolean;
  isFavorite: boolean;
  isRecurring: boolean;
  hasNotification: boolean;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
  tags: string[];
  preferences: {
    receiveNotifications: boolean;
    notificationMethods: ('push' | 'email' | 'sms')[];
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  settings: {
    allowMemberInvites: boolean;
    requireApprovalForReminders: boolean;
    sharedCalendar: boolean;
  };
  createdAt: string;
}

class MockDataService {
  private storageKeys = {
    reminders: 'mock_reminders',
    users: 'mock_users',
    families: 'mock_families',
    familyMembers: 'mock_family_members',
  };

  // Reminder methods
  async getReminders(userId?: string): Promise<Reminder[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.reminders);
      const allReminders: Reminder[] = stored ? JSON.parse(stored) : [];
      
      if (userId) {
        return allReminders.filter(r => r.userId === userId);
      }
      
      return allReminders;
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const reminders = await this.getReminders();
      const newReminder: Reminder = {
        ...reminderData,
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      reminders.push(newReminder);
      await AsyncStorage.setItem(this.storageKeys.reminders, JSON.stringify(reminders));
      
      return newReminder.id;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index !== -1) {
        reminders[index] = {
          ...reminders[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem(this.storageKeys.reminders, JSON.stringify(reminders));
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const filtered = reminders.filter(r => r.id !== id);
      await AsyncStorage.setItem(this.storageKeys.reminders, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  async getRemindersByType(type: string, userId?: string): Promise<Reminder[]> {
    const reminders = await this.getReminders(userId);
    return reminders.filter(r => r.type === type);
  }

  async getFavoriteReminders(userId?: string): Promise<Reminder[]> {
    const reminders = await this.getReminders(userId);
    return reminders.filter(r => r.isFavorite);
  }

  async getOverdueReminders(userId?: string): Promise<Reminder[]> {
    const reminders = await this.getReminders(userId);
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => r.dueDate && r.dueDate < today && !r.completed);
  }

  async getTodayReminders(userId?: string): Promise<Reminder[]> {
    const reminders = await this.getReminders(userId);
    const today = new Date().toISOString().split('T')[0];
    return reminders.filter(r => r.dueDate === today);
  }

  async searchReminders(searchTerm: string, userId?: string): Promise<Reminder[]> {
    const reminders = await this.getReminders(userId);
    const term = searchTerm.toLowerCase();
    
    return reminders.filter(reminder =>
      reminder.title.toLowerCase().includes(term) ||
      reminder.description?.toLowerCase().includes(term) ||
      reminder.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  // Family methods
  async getFamilies(): Promise<Family[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.families);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting families:', error);
      return [];
    }
  }

  async getFamilyByOwner(ownerId: string): Promise<Family | null> {
    const families = await this.getFamilies();
    return families.find(f => f.ownerId === ownerId) || null;
  }

  async createFamily(familyData: Omit<Family, 'id' | 'createdAt' | 'memberCount'>): Promise<string> {
    try {
      const families = await this.getFamilies();
      const newFamily: Family = {
        ...familyData,
        id: `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        memberCount: 1,
        createdAt: new Date().toISOString(),
      };
      
      families.push(newFamily);
      await AsyncStorage.setItem(this.storageKeys.families, JSON.stringify(families));
      
      return newFamily.id;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  }

  // Family member methods
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.familyMembers);
      const allMembers: FamilyMember[] = stored ? JSON.parse(stored) : [];
      return allMembers.filter(m => m.id.startsWith(familyId));
    } catch (error) {
      console.error('Error getting family members:', error);
      return [];
    }
  }

  async addFamilyMember(familyId: string, memberData: Omit<FamilyMember, 'id' | 'joinedAt'>): Promise<string> {
    try {
      const members = await this.getFamilyMembers(familyId);
      const newMember: FamilyMember = {
        ...memberData,
        id: `${familyId}_member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        joinedAt: new Date().toISOString(),
      };
      
      const allMembers = await AsyncStorage.getItem(this.storageKeys.familyMembers);
      const allMembersArray: FamilyMember[] = allMembers ? JSON.parse(allMembers) : [];
      allMembersArray.push(newMember);
      
      await AsyncStorage.setItem(this.storageKeys.familyMembers, JSON.stringify(allMembersArray));
      
      return newMember.id;
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  async updateFamilyMember(memberId: string, updates: Partial<FamilyMember>): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.familyMembers);
      const allMembers: FamilyMember[] = stored ? JSON.parse(stored) : [];
      const index = allMembers.findIndex(m => m.id === memberId);
      
      if (index !== -1) {
        allMembers[index] = { ...allMembers[index], ...updates };
        await AsyncStorage.setItem(this.storageKeys.familyMembers, JSON.stringify(allMembers));
      }
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }

  async removeFamilyMember(memberId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.familyMembers);
      const allMembers: FamilyMember[] = stored ? JSON.parse(stored) : [];
      const filtered = allMembers.filter(m => m.id !== memberId);
      await AsyncStorage.setItem(this.storageKeys.familyMembers, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.storageKeys.reminders),
        AsyncStorage.removeItem(this.storageKeys.users),
        AsyncStorage.removeItem(this.storageKeys.families),
        AsyncStorage.removeItem(this.storageKeys.familyMembers),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  async seedSampleData(userId: string): Promise<void> {
    try {
      // Create sample reminders
      const sampleReminders: Reminder[] = [
        {
          id: 'sample_1',
          title: 'Take morning vitamins',
          description: 'Daily vitamin D and multivitamin',
          type: 'med',
          priority: 'high',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '08:00',
          completed: false,
          isFavorite: true,
          isRecurring: true,
          hasNotification: true,
          tags: ['health', 'daily'],
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample_2',
          title: 'Pay electricity bill',
          description: 'Monthly electricity bill due',
          type: 'bill',
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
          isFavorite: false,
          isRecurring: true,
          hasNotification: true,
          tags: ['bills', 'monthly'],
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'sample_3',
          title: 'Team meeting',
          description: 'Weekly team standup meeting',
          type: 'event',
          priority: 'medium',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueTime: '10:00',
          location: 'Conference Room A',
          completed: false,
          isFavorite: false,
          isRecurring: true,
          hasNotification: true,
          tags: ['work', 'meeting'],
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      await AsyncStorage.setItem(this.storageKeys.reminders, JSON.stringify(sampleReminders));
    } catch (error) {
      console.error('Error seeding sample data:', error);
      throw error;
    }
  }
}

export const mockDataService = new MockDataService();
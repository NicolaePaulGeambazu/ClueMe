import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

// Types
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'task' | 'event' | 'note' | 'reminder' | 'bill' | 'med';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  dueDate?: Date;
  dueTime?: string;
  location?: string;
  isFavorite?: boolean;
  isRecurring?: boolean;
  hasNotification?: boolean;
  assignedTo?: string;
  tags?: string[];
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskType {
  id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
  joinedAt: Date;
  createdBy: string;
}

export interface FamilyActivity {
  id: string;
  familyId: string;
  type: 'member_joined' | 'member_left' | 'reminder_created' | 'reminder_completed' | 'reminder_shared' | 'family_updated';
  title: string;
  description: string;
  memberId: string;
  memberName: string;
  metadata?: any;
  createdAt: Date;
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  familyName: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    allowMemberInvites?: boolean;
    allowReminderSharing?: boolean;
    allowActivityNotifications?: boolean;
  };
}

// Helper function to check if error is a permission denied error
const isPermissionDeniedError = (error: any): boolean => {
  return error?.code === 'permission-denied' || 
         error?.message?.includes('permission-denied') ||
         error?.message?.includes('permission denied');
};

// Helper function to check if error is a collection not found error
const isCollectionNotFoundError = (error: any): boolean => {
  return error?.code === 'not-found' || 
         error?.message?.includes('collection') ||
         error?.message?.includes('not found');
};

// Helper function to handle Firebase errors gracefully
const handleFirebaseError = (error: any, operation: string): boolean => {
  if (isPermissionDeniedError(error)) {
    console.warn(`⚠️ Firebase permission denied for ${operation}. This usually means security rules are too restrictive.`);
    console.warn('💡 To fix this, update your Firebase security rules to allow read/write access.');
    return false;
  } else if (isCollectionNotFoundError(error)) {
    console.warn(`⚠️ Firebase collection not found for ${operation}. This might be a configuration issue.`);
    return false;
  } else {
    console.error(`❌ Firebase error in ${operation}:`, error);
    return false;
  }
};

// Check if Firebase is properly initialized
let isFirebaseInitialized = false;
let firebaseInitPromise: Promise<boolean> | null = null;
let firebasePermissionDenied = false;

// Helper function to check if Firestore is available
const checkFirestoreAvailability = (): boolean => {
  try {
    // Only allow Firebase on iOS for now since Android config is missing
    if (Platform.OS === 'android') {
      console.warn('❌ Firebase not configured for Android (missing google-services.json)');
      return false;
    }
    
    const firestoreInstance = firestore();
    if (!firestoreInstance) {
      console.warn('❌ Firestore instance not available');
      return false;
    }
    
    // Test if we can create a collection reference
    const testRef = firestoreInstance.collection('_test');
    if (!testRef) {
      console.warn('❌ Cannot create collection reference');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('❌ Error checking Firestore availability:', error);
    return false;
  }
};

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeFirebase = async (): Promise<boolean> => {
  if (isFirebaseInitialized) return true;
  
  if (firebaseInitPromise) return firebaseInitPromise;
  
  firebaseInitPromise = new Promise(async (resolve) => {
    try {
      console.log('🔍 Checking Firebase initialization...');
      
      // Try multiple times with delays to wait for native module to be ready
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`🔄 Firebase initialization attempt ${attempt}/5...`);
          
          // Check if Firestore is available
          if (!checkFirestoreAvailability()) {
            console.warn(`❌ Firestore not available (attempt ${attempt})`);
            if (attempt < 5) {
              await wait(1000); // Wait 1 second before retry
              continue;
            }
            isFirebaseInitialized = false;
            resolve(false);
            return;
          }
          
          console.log('✅ Firestore is available');
          
          // Try a simple operation to test if Firestore is working
          try {
            const firestoreInstance = firestore();
            const testRef = firestoreInstance.collection('_test_connection');
            console.log('✅ Collection reference created successfully');
            
            isFirebaseInitialized = true;
            console.log('🎉 Firebase Firestore is properly initialized');
            resolve(true);
            return;
          } catch (nativeError) {
            console.warn(`❌ Firestore test failed (attempt ${attempt}):`, nativeError);
            if (attempt < 5) {
              await wait(1000); // Wait 1 second before retry
              continue;
            }
            isFirebaseInitialized = false;
            resolve(false);
            return;
          }
        } catch (error) {
          console.warn(`❌ Firebase initialization error (attempt ${attempt}):`, error);
          if (attempt < 5) {
            await wait(1000); // Wait 1 second before retry
            continue;
          }
          isFirebaseInitialized = false;
          resolve(false);
          return;
        }
      }
      
      // If we get here, all attempts failed
      console.warn('❌ All Firebase initialization attempts failed');
      isFirebaseInitialized = false;
      resolve(false);
    } catch (error) {
      console.warn('❌ Firebase Firestore is not available:', error);
      isFirebaseInitialized = false;
      resolve(false);
    }
  });
  
  return firebaseInitPromise;
};

// Helper function to get Firestore instance
const getFirestoreInstance = () => {
  try {
    const firestoreInstance = firestore();
    if (!firestoreInstance) {
      throw new Error('Firestore not initialized');
    }
    return firestoreInstance;
  } catch (error) {
    console.error('Firestore initialization error:', error);
    throw new Error('Firestore is not available. Please check your Firebase configuration.');
  }
};

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: FirebaseFirestoreTypes.Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
};

// User Profile Operations
export const userService = {
  // Create or update user profile
  async createUserProfile(userData: Partial<UserProfile>): Promise<void> {
    const userId = userData.uid || auth().currentUser?.uid;
    if (!userId) throw new Error('No user ID available');

    console.log('👤 Creating user profile for:', userId);

    const profileData: UserProfile = {
      uid: userId,
      email: userData.email || auth().currentUser?.email || '',
      displayName: userData.displayName || auth().currentUser?.displayName || '',
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      isAnonymous: userData.isAnonymous || auth().currentUser?.isAnonymous || false,
      preferences: userData.preferences || {
        theme: 'system',
        notifications: true,
      },
    };

    // Check if Firebase is initialized
    console.log('🔍 Checking Firebase availability for profile creation...');
    const isInitialized = await initializeFirebase();
    if (!isInitialized) {
      console.log('❌ Firebase is not available, skipping profile creation');
      return;
    }

    console.log('✅ Firebase is available, attempting to create profile...');

    // Try to create the profile, if it fails due to collection issues, retry once
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`🔄 Profile creation attempt ${attempt + 1}...`);
        const firestoreInstance = getFirestoreInstance();
        const userRef = firestoreInstance.collection('users').doc(userId);
        
        console.log('📝 Setting user profile data...');
        await userRef.set(profileData, { merge: true });
        console.log(`✅ User profile created/updated successfully (attempt ${attempt + 1})`);
        return;
      } catch (error) {
        console.error(`❌ Error creating user profile (attempt ${attempt + 1}):`, error);
        
        // If this is the first attempt and it's a collection error, try again
        if (attempt === 0 && error instanceof Error && error.message && error.message.includes('collection')) {
          console.log('🔄 Users collection does not exist, retrying to create first document...');
          continue; // Try again
        }
        
        // If we get here, either it's the second attempt or a different error
        console.error('❌ Failed to create user profile after retry:', error);
        console.warn('⚠️ User profile creation failed, continuing without Firestore...');
        return; // Don't throw, just log and continue
      }
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userRef = firestoreInstance.collection('users').doc(userId);
      const doc = await userRef.get();
      
      if (doc.exists) {
        const data = doc.data() as any;
        return {
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // If it's a collection doesn't exist error, return null
      if (error instanceof Error && error.message && error.message.includes('collection')) {
        console.log('Users collection does not exist yet, returning null');
        return null;
      }
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userRef = firestoreInstance.collection('users').doc(userId);
      await userRef.update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete user profile
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userRef = firestoreInstance.collection('users').doc(userId);
      await userRef.delete();
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  },
};

// Helper function to remove undefined fields
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}

// Reminder Operations
export const reminderService = {
  // Create a new reminder
  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc();
      const reminderId = reminderRef.id;
      
      const newReminder: Reminder = {
        ...reminderData,
        id: reminderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await reminderRef.set(removeUndefinedFields(newReminder) as any);
      return reminderId;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Get user reminders
  async getUserReminders(userId: string, limit: number = 50): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');
      const query = remindersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);
      
      const snapshot = await query.get();
      const reminders: Reminder[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        reminders.push({
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
        });
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting user reminders:', error);
      // If it's a collection doesn't exist error, return empty array
      if (error instanceof Error && error.message && error.message.includes('collection')) {
        console.log('Collection does not exist yet, returning empty array');
        return [];
      }
      return [];
    }
  },

  // Update a reminder
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      await reminderRef.update({
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  // Delete a reminder
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      await reminderRef.delete();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // Get reminders by type
  async getRemindersByType(userId: string, type: Reminder['type']): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');
      const query = remindersRef
        .where('userId', '==', userId)
        .where('type', '==', type)
        .orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      const reminders: Reminder[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        reminders.push({
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
        });
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting reminders by type:', error);
      return [];
    }
  },

  // Get reminders by priority
  async getRemindersByPriority(userId: string, priority: Reminder['priority']): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');
      const query = remindersRef
        .where('userId', '==', userId)
        .where('priority', '==', priority)
        .orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      const reminders: Reminder[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        reminders.push({
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
        });
      });
      
      return reminders;
    } catch (error) {
      console.error('Error getting reminders by priority:', error);
      return [];
    }
  },

  // Real-time listener for user reminders
  onUserRemindersChange(userId: string, callback: (reminders: Reminder[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');
      const query = remindersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');
      
      return query.onSnapshot((snapshot) => {
        const reminders: Reminder[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          reminders.push({
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
          });
        });
        callback(reminders);
      }, (error) => {
        console.error('Error in reminders listener:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up reminders listener:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  },

  // Real-time listener for user profile
  onUserProfileChange(userId: string, callback: (profile: UserProfile | null) => void) {
    const firestoreInstance = getFirestoreInstance();
    const unsubscribe = firestoreInstance
      .collection('users')
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data();
            const profile: UserProfile = {
              uid: doc.id,
              email: data?.email || '',
              displayName: data?.displayName || '',
              createdAt: convertTimestamp(data?.createdAt || new Date()),
              updatedAt: convertTimestamp(data?.updatedAt || new Date()),
              isAnonymous: data?.isAnonymous || false,
              preferences: data?.preferences || {
                theme: 'system',
                notifications: true,
              },
            };
            callback(profile);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.error('Error listening to user profile changes:', error);
          callback(null);
        }
      );

    return unsubscribe;
  },
};

// Task Type Operations
export const taskTypeService = {
  // Create a new task type
  async createTaskType(taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = taskTypeData.createdBy || auth().currentUser?.uid;
      if (!userId) throw new Error('No user ID available');

      console.log('📝 Creating task type:', taskTypeData.name);

      const taskType: Omit<TaskType, 'id'> = {
        ...taskTypeData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      };

      const docRef = await firestoreInstance.collection('taskTypes').add(taskType);
      console.log('✅ Task type created with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      if (handleFirebaseError(error, 'createTaskType')) {
        throw error;
      }
      // If permission denied, throw a specific error that can be handled by the hook
      throw new Error('Firebase permission denied. Using fallback task types.');
    }
  },

  // Get all task types
  async getAllTaskTypes(): Promise<TaskType[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📋 Fetching all task types...');
      
      const snapshot = await firestoreInstance
        .collection('taskTypes')
        .where('isActive', '==', true)
        .orderBy('sortOrder', 'asc')
        .orderBy('name', 'asc')
        .get();

      const taskTypes: TaskType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        taskTypes.push({
          id: doc.id,
          name: data.name,
          label: data.label,
          color: data.color,
          icon: data.icon,
          description: data.description,
          isDefault: data.isDefault || false,
          isActive: data.isActive !== false,
          sortOrder: data.sortOrder || 0,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          createdBy: data.createdBy,
        });
      });

      console.log(`✅ Found ${taskTypes.length} task types`);
      return taskTypes;
    } catch (error) {
      if (handleFirebaseError(error, 'getAllTaskTypes')) {
        throw error;
      }
      // Return empty array if permission denied, so fallback types can be used
      console.log('📋 Returning empty task types array due to Firebase permission issues');
      return [];
    }
  },

  // Get default task types
  async getDefaultTaskTypes(): Promise<TaskType[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📋 Fetching default task types...');
      
      const snapshot = await firestoreInstance
        .collection('taskTypes')
        .where('isDefault', '==', true)
        .where('isActive', '==', true)
        .orderBy('sortOrder', 'asc')
        .get();

      const taskTypes: TaskType[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        taskTypes.push({
          id: doc.id,
          name: data.name,
          label: data.label,
          color: data.color,
          icon: data.icon,
          description: data.description,
          isDefault: data.isDefault || false,
          isActive: data.isActive !== false,
          sortOrder: data.sortOrder || 0,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          createdBy: data.createdBy,
        });
      });

      console.log(`✅ Found ${taskTypes.length} default task types`);
      return taskTypes;
    } catch (error) {
      if (handleFirebaseError(error, 'getDefaultTaskTypes')) {
        throw error;
      }
      // Return empty array if permission denied
      console.log('📋 Returning empty default task types array due to Firebase permission issues');
      return [];
    }
  },

  // Get task type by ID
  async getTaskTypeById(id: string): Promise<TaskType | null> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📋 Fetching task type by ID:', id);
      
      const doc = await firestoreInstance.collection('taskTypes').doc(id).get();
      
      if (!doc.exists) {
        console.log('❌ Task type not found');
        return null;
      }

      const data = doc.data()!;
      const taskType: TaskType = {
        id: doc.id,
        name: data.name,
        label: data.label,
        color: data.color,
        icon: data.icon,
        description: data.description,
        isDefault: data.isDefault || false,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 0,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        createdBy: data.createdBy,
      };

      console.log('✅ Task type found:', taskType.name);
      return taskType;
    } catch (error) {
      if (handleFirebaseError(error, 'getTaskTypeById')) {
        throw error;
      }
      return null;
    }
  },

  // Update task type
  async updateTaskType(id: string, updates: Partial<TaskType>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📝 Updating task type:', id);
      
      const updateData = {
        ...removeUndefinedFields(updates),
        updatedAt: new Date(),
      };

      await firestoreInstance.collection('taskTypes').doc(id).update(updateData);
      console.log('✅ Task type updated successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'updateTaskType')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update task type.');
    }
  },

  // Delete task type (soft delete by setting isActive to false)
  async deleteTaskType(id: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('🗑️ Soft deleting task type:', id);
      
      await firestoreInstance.collection('taskTypes').doc(id).update({
        isActive: false,
        updatedAt: new Date(),
      });
      
      console.log('✅ Task type soft deleted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'deleteTaskType')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot delete task type.');
    }
  },

  // Hard delete task type
  async hardDeleteTaskType(id: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('🗑️ Hard deleting task type:', id);
      
      await firestoreInstance.collection('taskTypes').doc(id).delete();
      
      console.log('✅ Task type hard deleted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'hardDeleteTaskType')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot delete task type.');
    }
  },

  // Seed default task types
  async seedDefaultTaskTypes(): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('No user ID available');

      console.log('🌱 Seeding default task types...');

      const defaultTaskTypes = [
        {
          name: 'task',
          label: 'Task',
          color: '#3B82F6',
          icon: 'CheckSquare',
          description: 'General tasks and to-dos',
          isDefault: true,
          isActive: true,
          sortOrder: 1,
          createdBy: userId,
        },
        {
          name: 'bill',
          label: 'Bill',
          color: '#EF4444',
          icon: 'CreditCard',
          description: 'Bills and payments due',
          isDefault: true,
          isActive: true,
          sortOrder: 2,
          createdBy: userId,
        },
        {
          name: 'med',
          label: 'Medicine',
          color: '#10B981',
          icon: 'Pill',
          description: 'Medications and health reminders',
          isDefault: true,
          isActive: true,
          sortOrder: 3,
          createdBy: userId,
        },
        {
          name: 'event',
          label: 'Event',
          color: '#8B5CF6',
          icon: 'Calendar',
          description: 'Meetings and appointments',
          isDefault: true,
          isActive: true,
          sortOrder: 4,
          createdBy: userId,
        },
        {
          name: 'note',
          label: 'Note',
          color: '#F59E0B',
          icon: 'FileText',
          description: 'Important notes and ideas',
          isDefault: true,
          isActive: true,
          sortOrder: 5,
          createdBy: userId,
        },
      ];

      const batch = firestoreInstance.batch();
      
      for (const taskType of defaultTaskTypes) {
        const docRef = firestoreInstance.collection('taskTypes').doc();
        batch.set(docRef, {
          ...taskType,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      console.log('✅ Default task types seeded successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'seedDefaultTaskTypes')) {
        throw error;
      }
      console.warn('⚠️ Could not seed default task types due to Firebase permission issues. Using fallback types.');
      // Don't throw error, just log and continue
    }
  },

  // Listen to task type changes
  onTaskTypesChange(callback: (taskTypes: TaskType[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      const unsubscribe = firestoreInstance
        .collection('taskTypes')
        .where('isActive', '==', true)
        .orderBy('sortOrder', 'asc')
        .orderBy('name', 'asc')
        .onSnapshot(
          (snapshot) => {
            const taskTypes: TaskType[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              taskTypes.push({
                id: doc.id,
                name: data.name,
                label: data.label,
                color: data.color,
                icon: data.icon,
                description: data.description,
                isDefault: data.isDefault || false,
                isActive: data.isActive !== false,
                sortOrder: data.sortOrder || 0,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
                createdBy: data.createdBy,
              });
            });
            callback(taskTypes);
          },
          (error) => {
            if (handleFirebaseError(error, 'onTaskTypesChange')) {
              console.error('Error listening to task types changes:', error);
            }
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
      if (handleFirebaseError(error, 'onTaskTypesChange')) {
        console.error('Error setting up task types listener:', error);
      }
      // Return a no-op function
      return () => {};
    }
  },
};

// Family Management
export const familyService = {
  // Family Management
  async createFamily(familyData: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('No user ID available');

      console.log('👨‍👩‍👧‍👦 Creating family...');
      
      const docRef = firestoreInstance.collection('families').doc();
      const familyId = docRef.id;
      
      const family: Family = {
        id: familyId,
        ...familyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await docRef.set(family);
      
      // Add the creator as the first member
      await this.addFamilyMember({
        familyId,
        userId,
        name: familyData.ownerName,
        email: auth().currentUser?.email || '',
        role: 'owner',
        createdBy: userId,
      });

      console.log('✅ Family created successfully:', familyId);
      return familyId;
    } catch (error) {
      if (handleFirebaseError(error, 'createFamily')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot create family.');
    }
  },

  async createDefaultFamilyIfNeeded(userId: string, userName: string, userEmail: string): Promise<Family | null> {
    try {
      console.log('🔍 Checking if user has a family...');
      
      // First check if user already has a family
      const existingFamily = await this.getUserFamily(userId);
      if (existingFamily) {
        console.log('✅ User already has a family');
        return existingFamily;
      }

      console.log('🏠 Creating default family for user...');
      
      // Create a default family
      const familyId = await this.createFamily({
        name: `${userName}'s Family`,
        description: 'Your family group for shared reminders and activities',
        ownerId: userId,
        ownerName: userName,
        memberCount: 1,
        settings: {
          allowMemberInvites: true,
          allowReminderSharing: true,
          allowActivityNotifications: true,
        },
      });

      // Create initial family activity
      await this.createFamilyActivity({
        familyId,
        type: 'member_joined',
        title: 'Family Created',
        description: `${userName} created this family`,
        memberId: userId,
        memberName: userName,
      });

      console.log('✅ Default family created successfully');
      
      // Return the newly created family
      return await this.getUserFamily(userId);
    } catch (error) {
      console.error('❌ Error creating default family:', error);
      throw error;
    }
  },

  async getUserFamily(userId: string): Promise<Family | null> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('👨‍👩‍👧‍👦 Getting user family...');
      
      const memberQuery = await firestoreInstance
        .collection('familyMembers')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (memberQuery.empty) {
        console.log('ℹ️ User is not part of any family');
        return null;
      }

      const memberDoc = memberQuery.docs[0];
      const familyId = memberDoc.data().familyId;

      const familyDoc = await firestoreInstance
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        console.log('ℹ️ Family not found');
        return null;
      }

      const data = familyDoc.data();
      if (!data) {
        console.log('ℹ️ Family data is null');
        return null;
      }
      
      const family: Family = {
        id: familyDoc.id,
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        memberCount: data.memberCount,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        settings: data.settings,
      };

      console.log('✅ Family retrieved successfully');
      return family;
    } catch (error) {
      if (handleFirebaseError(error, 'getUserFamily')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get family.');
    }
  },

  async addFamilyMember(memberData: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActive' | 'isOnline'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('No user ID available');

      console.log('👤 Adding family member...');
      
      const docRef = firestoreInstance.collection('familyMembers').doc();
      const memberId = docRef.id;
      
      const member: FamilyMember = {
        id: memberId,
        ...memberData,
        isOnline: false,
        lastActive: new Date(),
        joinedAt: new Date(),
      };

      await docRef.set(member);
      
      // Update family member count
      await firestoreInstance.collection('families').doc(memberData.familyId).update({
        memberCount: firestore.FieldValue.increment(1),
        updatedAt: new Date(),
      });

      console.log('✅ Family member added successfully:', memberId);
      return memberId;
    } catch (error) {
      if (handleFirebaseError(error, 'addFamilyMember')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot add family member.');
    }
  },

  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('👥 Getting family members...');
      
      const querySnapshot = await firestoreInstance
        .collection('familyMembers')
        .where('familyId', '==', familyId)
        .orderBy('joinedAt', 'asc')
        .get();

      const members: FamilyMember[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          familyId: data.familyId,
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
          isOnline: data.isOnline,
          lastActive: convertTimestamp(data.lastActive),
          joinedAt: convertTimestamp(data.joinedAt),
          createdBy: data.createdBy,
        });
      });

      console.log(`✅ Retrieved ${members.length} family members`);
      return members;
    } catch (error) {
      if (handleFirebaseError(error, 'getFamilyMembers')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get family members.');
    }
  },

  async removeFamilyMember(memberId: string, familyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('👤 Removing family member...');
      
      await firestoreInstance.collection('familyMembers').doc(memberId).delete();
      
      // Update family member count
      await firestoreInstance.collection('families').doc(familyId).update({
        memberCount: firestore.FieldValue.increment(-1),
        updatedAt: new Date(),
      });

      console.log('✅ Family member removed successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'removeFamilyMember')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot remove family member.');
    }
  },

  async createFamilyActivity(activityData: Omit<FamilyActivity, 'id' | 'createdAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📝 Creating family activity...');
      
      const docRef = firestoreInstance.collection('familyActivities').doc();
      const activityId = docRef.id;
      
      const activity: FamilyActivity = {
        id: activityId,
        ...activityData,
        createdAt: new Date(),
      };

      await docRef.set(activity);
      
      console.log('✅ Family activity created successfully:', activityId);
      return activityId;
    } catch (error) {
      if (handleFirebaseError(error, 'createFamilyActivity')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot create family activity.');
    }
  },

  async getFamilyActivities(familyId: string, limit: number = 50): Promise<FamilyActivity[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📝 Getting family activities...');
      
      const querySnapshot = await firestoreInstance
        .collection('familyActivities')
        .where('familyId', '==', familyId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const activities: FamilyActivity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          familyId: data.familyId,
          type: data.type,
          title: data.title,
          description: data.description,
          memberId: data.memberId,
          memberName: data.memberName,
          metadata: data.metadata,
          createdAt: convertTimestamp(data.createdAt),
        });
      });

      console.log(`✅ Retrieved ${activities.length} family activities`);
      return activities;
    } catch (error) {
      if (handleFirebaseError(error, 'getFamilyActivities')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get family activities.');
    }
  },

  // Listen to family members changes
  onFamilyMembersChange(familyId: string, callback: (members: FamilyMember[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      const unsubscribe = firestoreInstance
        .collection('familyMembers')
        .where('familyId', '==', familyId)
        .orderBy('joinedAt', 'asc')
        .onSnapshot(
          (snapshot) => {
            const members: FamilyMember[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              members.push({
                id: doc.id,
                familyId: data.familyId,
                userId: data.userId,
                name: data.name,
                email: data.email,
                role: data.role,
                avatar: data.avatar,
                isOnline: data.isOnline,
                lastActive: convertTimestamp(data.lastActive),
                joinedAt: convertTimestamp(data.joinedAt),
                createdBy: data.createdBy,
              });
            });
            callback(members);
          },
          (error) => {
            if (handleFirebaseError(error, 'onFamilyMembersChange')) {
              console.error('Error listening to family members changes:', error);
            }
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
      if (handleFirebaseError(error, 'onFamilyMembersChange')) {
        console.error('Error setting up family members listener:', error);
      }
      // Return a no-op function
      return () => {};
    }
  },

  // Listen to family activities changes
  onFamilyActivitiesChange(familyId: string, callback: (activities: FamilyActivity[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      const unsubscribe = firestoreInstance
        .collection('familyActivities')
        .where('familyId', '==', familyId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(
          (snapshot) => {
            const activities: FamilyActivity[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              activities.push({
                id: doc.id,
                familyId: data.familyId,
                type: data.type,
                title: data.title,
                description: data.description,
                memberId: data.memberId,
                memberName: data.memberName,
                metadata: data.metadata,
                createdAt: convertTimestamp(data.createdAt),
              });
            });
            callback(activities);
          },
          (error) => {
            if (handleFirebaseError(error, 'onFamilyActivitiesChange')) {
              console.error('Error listening to family activities changes:', error);
            }
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
      if (handleFirebaseError(error, 'onFamilyActivitiesChange')) {
        console.error('Error setting up family activities listener:', error);
      }
      // Return a no-op function
      return () => {};
    }
  },

  // Family Invitation Services
  async sendFamilyInvitation(invitationData: Omit<FamilyInvitation, 'id' | 'status' | 'createdAt' | 'expiresAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('No user ID available');

      console.log('📧 Sending family invitation...');
      
      const docRef = firestoreInstance.collection('familyInvitations').doc();
      const invitationId = docRef.id;
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation: FamilyInvitation = {
        id: invitationId,
        ...invitationData,
        status: 'pending',
        createdAt: new Date(),
        expiresAt,
      };

      await docRef.set(invitation);
      
      console.log('✅ Family invitation sent successfully:', invitationId);
      return invitationId;
    } catch (error) {
      if (handleFirebaseError(error, 'sendFamilyInvitation')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot send family invitation.');
    }
  },

  async getPendingInvitations(inviteeEmail: string): Promise<FamilyInvitation[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('📧 Getting pending invitations...');
      
      const querySnapshot = await firestoreInstance
        .collection('familyInvitations')
        .where('inviteeEmail', '==', inviteeEmail)
        .where('status', '==', 'pending')
        .where('expiresAt', '>', new Date())
        .orderBy('expiresAt', 'desc')
        .get();

      const invitations: FamilyInvitation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        invitations.push({
          id: doc.id,
          familyId: data.familyId,
          familyName: data.familyName,
          inviterId: data.inviterId,
          inviterName: data.inviterName,
          inviterEmail: data.inviterEmail,
          inviteeEmail: data.inviteeEmail,
          status: data.status,
          expiresAt: convertTimestamp(data.expiresAt),
          createdAt: convertTimestamp(data.createdAt),
          acceptedAt: data.acceptedAt ? convertTimestamp(data.acceptedAt) : undefined,
          declinedAt: data.declinedAt ? convertTimestamp(data.declinedAt) : undefined,
        });
      });

      console.log(`✅ Retrieved ${invitations.length} pending invitations`);
      return invitations;
    } catch (error) {
      if (handleFirebaseError(error, 'getPendingInvitations')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get pending invitations.');
    }
  },

  async acceptFamilyInvitation(invitationId: string, userId: string, userName: string, userEmail: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('✅ Accepting family invitation...');
      
      // Get the invitation
      const invitationDoc = await firestoreInstance.collection('familyInvitations').doc(invitationId).get();
      if (!invitationDoc.exists) {
        throw new Error('Invitation not found');
      }
      
      const invitationData = invitationDoc.data() as any;
      if (invitationData.status !== 'pending') {
        throw new Error('Invitation is no longer pending');
      }
      
      if (invitationData.expiresAt.toDate() < new Date()) {
        throw new Error('Invitation has expired');
      }
      
      // Update invitation status
      await firestoreInstance.collection('familyInvitations').doc(invitationId).update({
        status: 'accepted',
        acceptedAt: new Date(),
      });
      
      // Add user to family
      await this.addFamilyMember({
        familyId: invitationData.familyId,
        userId,
        name: userName,
        email: userEmail,
        role: 'member',
        createdBy: invitationData.inviterId,
      });
      
      // Create family activity
      await this.createFamilyActivity({
        familyId: invitationData.familyId,
        type: 'member_joined',
        title: 'Member Joined',
        description: `${userName} joined the family`,
        memberId: userId,
        memberName: userName,
      });
      
      console.log('✅ Family invitation accepted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'acceptFamilyInvitation')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot accept family invitation.');
    }
  },

  async declineFamilyInvitation(invitationId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('❌ Declining family invitation...');
      
      await firestoreInstance.collection('familyInvitations').doc(invitationId).update({
        status: 'declined',
        declinedAt: new Date(),
      });
      
      console.log('✅ Family invitation declined successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'declineFamilyInvitation')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot decline family invitation.');
    }
  },

  async leaveFamily(familyId: string, memberId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      
      console.log('👋 Leaving family...');
      
      // Get member info before removing
      const memberDoc = await firestoreInstance.collection('familyMembers').doc(memberId).get();
      if (!memberDoc.exists) {
        throw new Error('Member not found');
      }
      
      const memberData = memberDoc.data() as any;
      
      // Remove member
      await this.removeFamilyMember(memberId, familyId);
      
      // Create family activity
      await this.createFamilyActivity({
        familyId,
        type: 'member_left',
        title: 'Member Left',
        description: `${memberData.name} left the family`,
        memberId: memberData.userId,
        memberName: memberData.name,
      });
      
      console.log('✅ Left family successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'leaveFamily')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot leave family.');
    }
  },
}; 
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
  type: 'task' | 'event' | 'note' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  tags?: string[];
}

// Check if Firebase is properly initialized
let isFirebaseInitialized = false;
let firebaseInitPromise: Promise<boolean> | null = null;

// Helper function to check if Firestore is available
const checkFirestoreAvailability = (): boolean => {
  try {
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
      
      await reminderRef.set(newReminder);
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
    try {
      const firestoreInstance = getFirestoreInstance();
      const userRef = firestoreInstance.collection('users').doc(userId);
      
      return userRef.onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data() as any;
          const profile: UserProfile = {
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          };
          callback(profile);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('Error in profile listener:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up profile listener:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  },
}; 
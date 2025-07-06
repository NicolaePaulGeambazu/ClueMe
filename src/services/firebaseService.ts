import firebase from '@react-native-firebase/app';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
// Analytics service removed to fix Firebase issues
import { notificationService } from './notificationService';
import { Platform } from 'react-native';
import { generateNextOccurrence, shouldGenerateNextOccurrence } from '../utils/reminderUtils';

// Types
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  // Enhanced FCM token management for multi-device support
  fcmTokens: string[]; // Multiple tokens per user (multi-device)
  lastTokenUpdate?: string;
  // Enhanced notification settings
  notificationSettings?: {
    enabled: boolean;
    reminderNotifications: boolean;
    assignmentNotifications: boolean;
    familyNotifications: boolean;
    pushNotifications: boolean;
  };
  // Subscription fields
  subscriptionTier?: 'free' | 'paid';
  subscriptionExpiresAt?: Date;
  // Regional and timezone fields
  timezone?: string; // e.g., 'Europe/Berlin', 'America/New_York'
  region?: string;   // e.g., 'EU', 'UK', 'US'
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
  // Event-specific fields for start and end times
  startDate?: Date;
  startTime?: string;
  endDate?: Date;
  endTime?: string;
  location?: string;
  isFavorite?: boolean;
  isRecurring?: boolean;
  repeatPattern?: string;
  customInterval?: number;
  hasNotification?: boolean;
  notificationTimings?: Array<{
    type: 'exact' | 'before' | 'after';
    value: number;
    label: string;
  }>;
  assignedTo?: string[]; // Changed from string to string[] to support multiple assignments
  assignedBy?: string; // Track who assigned this reminder
  tags?: string[];
  completed?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Family sharing fields
  sharedWithFamily?: boolean; // Whether this reminder is shared with family
  sharedForEditing?: boolean; // Whether family members can edit this reminder
  familyId?: string; // Which family this reminder belongs to
  repeatDays?: number[]; // Days of week for custom weekly patterns (0=Sunday, 1=Monday, ...)
  customFrequencyType?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Frequency type for custom patterns
  // Recurring reminder date range
  recurringStartDate?: Date; // When recurring reminders should start
  recurringEndDate?: Date; // When recurring reminders should stop (optional)
  recurringEndAfter?: number; // Number of occurrences before ending (optional)
  recurringGroupId?: string; // ID to group related recurring reminders together
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
  maxMembers: number; // Subscription-based limit
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    allowMemberInvites?: boolean;
    allowReminderSharing?: boolean;
    allowActivityNotifications?: boolean;
  };
}

export interface Countdown {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate: string;
  targetTime?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  format: 'checkmark' | 'line' | 'number' | 'plain';
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserList {
  id: string;
  name: string;
  description?: string;
  items: ListItem[];
  format: 'checkmark' | 'line' | 'number' | 'plain';
  isFavorite: boolean;
  isPrivate: boolean;
  familyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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
  if (isFirebaseInitialized) {return true;}

  if (firebaseInitPromise) {return firebaseInitPromise;}

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
export const getFirestoreInstance = () => {
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
const convertTimestamp = (timestamp: FirebaseFirestoreTypes.Timestamp | Date | string | undefined | null): Date => {
  if (!timestamp) {
    return new Date();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    // Handle string dates from Firebase
    const parsedDate = new Date(timestamp);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }
  return new Date();
};

// User Profile Operations
export const userService = {
  // Create or update user profile
  async createUserProfile(userData: Partial<UserProfile>): Promise<void> {
    const userId = userData.uid || auth().currentUser?.uid;
    if (!userId) {throw new Error('No user ID available');}

    console.log('👤 Creating user profile for:', userId);

    const profileData: UserProfile = {
      uid: userId,
      email: userData.email || auth().currentUser?.email || '',
      displayName: userData.displayName || auth().currentUser?.displayName || '',
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date(),
      isAnonymous: userData.isAnonymous || auth().currentUser?.isAnonymous || false,
      fcmTokens: userData.fcmTokens || [],
      notificationSettings: userData.notificationSettings || {
        enabled: true,
        reminderNotifications: true,
        assignmentNotifications: true,
        familyNotifications: true,
        pushNotifications: true,
      },
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
  // Track last check time to prevent too frequent checks
  lastRecurringCheckTime: {} as { [key: string]: number },
  
  // Track recently processed recurring reminders to prevent duplicates
  recentlyProcessedRecurring: {} as { [key: string]: number },

  // Create a new reminder
  async createReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('🔥 Starting reminder creation in Firebase...');
      
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc();
      const reminderId = reminderRef.id;

      console.log('📝 Generated reminder ID:', reminderId);

      // Generate recurring group ID for recurring reminders
      let recurringGroupId: string | undefined;
      if (reminderData.isRecurring) {
        recurringGroupId = reminderId; // Use the first reminder's ID as the group ID
      }

      const newReminder: Reminder = {
        ...reminderData,
        id: reminderId,
        recurringGroupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('💾 Saving reminder to Firestore...');
      await reminderRef.set(removeUndefinedFields(newReminder) as any);
      console.log('✅ Reminder saved to Firestore successfully');

      // Create family activity if this is a family-related reminder
      if (reminderData.familyId && reminderData.sharedWithFamily) {
        try {
          console.log('👨‍👩‍👧‍👦 Creating family activity...');
          // Get user's family member info
          const familyMembers = await this.getFamilyMembers(reminderData.familyId);
          const userMember = familyMembers.find(m => m.userId === reminderData.userId);
          
          if (userMember) {
            await this.createFamilyActivity({
              familyId: reminderData.familyId,
              type: 'reminder_created',
              title: 'New Family Reminder',
              description: `${userMember.name} created: "${reminderData.title}"`,
              memberId: reminderData.userId,
              memberName: userMember.name,
              metadata: {
                reminderId: reminderId,
                reminderTitle: reminderData.title,
                reminderType: reminderData.type,
                assignedTo: reminderData.assignedTo,
                priority: reminderData.priority
              }
            });
            console.log('✅ Family activity created for new reminder');
          } else {
            console.log('⚠️ User member not found for family activity');
          }
        } catch (activityError) {
          console.error('Failed to create family activity for reminder:', activityError);
          // Don't throw here - the reminder was created successfully
        }
      }

      // Always schedule a default notification at the due time, even if no custom timings are set
      try {
        console.log('🔔 Scheduling notifications...');
        console.log('🔔 Reminder data for notification:', {
          id: reminderId,
          title: reminderData.title,
          dueDate: reminderData.dueDate,
          dueTime: reminderData.dueTime,
          hasNotification: reminderData.hasNotification,
          notificationTimings: reminderData.notificationTimings
        });
        
        // Check if notification service is available
        if (!notificationService) {
          console.error('❌ Notification service is not available');
          return reminderId;
        }
        
        await notificationService.scheduleReminderNotifications(newReminder);
        console.log('✅ Notifications scheduled for reminder:', reminderId);

        // Send assignment notifications if reminder is assigned to other users
        if (reminderData.assignedTo && reminderData.assignedTo.length > 0) {
          try {
            console.log('🔔 Sending assignment notifications...');
            await notificationService.sendAssignmentNotification(
              reminderId,
              reminderData.title,
              reminderData.userId, // assigned by
              reminderData.assignedBy || 'Unknown', // assigned by display name
              reminderData.assignedTo
            );
            console.log('✅ Assignment notifications sent successfully');
          } catch (assignmentError) {
            console.error('❌ Failed to send assignment notifications:', assignmentError);
            // Don't throw here - the reminder was created successfully
          }
        }
      } catch (notificationError) {
        console.error('❌ Failed to schedule notifications for reminder:', notificationError);
        console.error('❌ Notification error details:', {
          error: notificationError,
          reminderId: reminderId || 'unknown',
          reminderData: {
            title: reminderData.title,
            dueDate: reminderData.dueDate,
            dueTime: reminderData.dueTime
          }
        });
        // Don't throw here - the reminder was created successfully, just notification scheduling failed
      }

      console.log('✅ Reminder created successfully:', reminderId);
      return reminderId;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Get user reminders (excluding soft-deleted ones)
  async getUserReminders(userId: string, limit: number = 50): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');

      // Get all reminders for the user, then filter out deleted ones in memory
      // This handles cases where deletedAt field doesn't exist yet
      const query = remindersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      const snapshot = await query.get();
      const reminders: Reminder[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        // Skip reminders that have been soft-deleted
        if (data.deletedAt) {return;}

        reminders.push({
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
        });
      });

      return reminders;
    } catch (error) {
      console.error('Error getting user reminders:', error);
      return [];
    }
  },

  // Get family reminders with proper permission checking and performance optimizations
  async getFamilyReminders(
    userId: string, 
    familyId: string, 
    limit: number = 50,
    page: number = 0,
    useCache: boolean = true
  ): Promise<{ reminders: Reminder[]; hasMore: boolean; totalCount: number }> {
    try {
  
      
      // Check cache first
      if (useCache) {
        const cached = getCachedReminders(userId, familyId);
        if (cached) {
          console.log('📦 Using cached family reminders');
          const startIndex = page * limit;
          const endIndex = startIndex + limit;
          const paginatedReminders = cached.slice(startIndex, endIndex);
          
          return {
            reminders: paginatedReminders,
            hasMore: endIndex < cached.length,
            totalCount: cached.length
          };
        }
      }

      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');

      // Get user's family membership to check permissions
      const familyMembers = await this.getFamilyMembers(familyId);
      const userMember = familyMembers.find((m: FamilyMember) => m.userId === userId);
      
      if (!userMember) {
        console.log('User is not a member of this family');
        return { reminders: [], hasMore: false, totalCount: 0 };
      }

      // Use optimized queries with proper indexing
      const allReminders: Reminder[] = [];
      const seenIds = new Set<string>();

      // 1. Get user's own reminders (using index)
      try {
        const userQuery = remindersRef
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit * 2); // Get more to account for filtering

        const userSnapshot = await userQuery.get();
        userSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          if (!data.deletedAt) {
            seenIds.add(doc.id);
            allReminders.push({
              id: doc.id,
              ...data,
              createdAt: convertTimestamp(data.createdAt),
              updatedAt: convertTimestamp(data.updatedAt),
              dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
              deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
            });
          }
        });
      } catch (error) {
        console.error('Error getting user reminders:', error);
      }

      // 2. Get reminders assigned to this user (using index)
      try {
        const assignedQuery = remindersRef
          .where('assignedTo', 'array-contains', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit * 2);

        const assignedSnapshot = await assignedQuery.get();
        const assignedReminders = assignedSnapshot && !assignedSnapshot.empty
          ? assignedSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as Reminder))
          : [];

        assignedSnapshot.forEach((doc) => {
          const data = doc.data() as any;
          // Filter out user's own reminders in memory instead of using != in query
          if (!seenIds.has(doc.id) && !data.deletedAt && data.userId !== userId) {
            seenIds.add(doc.id);
            allReminders.push({
              id: doc.id,
              ...data,
              createdAt: convertTimestamp(data.createdAt),
              updatedAt: convertTimestamp(data.updatedAt),
              dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
              deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
            });
          }
        });
      } catch (error) {
        console.error('Error getting assigned reminders:', error);
      }

      // 3. If user is owner/admin, get family members' reminders (with performance optimization)
      if (userMember.role === 'owner' || userMember.role === 'admin') {
        const familyUserIds = familyMembers.map((m: FamilyMember) => m.userId);
        
        // For large families, limit the number of queries
        const maxFamilyQueries = Math.min(familyUserIds.length - 1, 5); // Max 5 additional queries
        const familyUserIdsToQuery = familyUserIds
          .filter(id => id !== userId)
          .slice(0, maxFamilyQueries);
        
        for (const familyUserId of familyUserIdsToQuery) {
          try {
            const familyQuery = remindersRef
              .where('userId', '==', familyUserId)
              .where('sharedWithFamily', '==', true) // Only get shared reminders
              .orderBy('createdAt', 'desc')
              .limit(Math.ceil(limit / familyUserIdsToQuery.length)); // Distribute limit

            const familySnapshot = await familyQuery.get();
            familySnapshot.forEach((doc) => {
              const data = doc.data() as any;
              if (!seenIds.has(doc.id) && !data.deletedAt) {
                seenIds.add(doc.id);
                allReminders.push({
                  id: doc.id,
                  ...data,
                  createdAt: convertTimestamp(data.createdAt),
                  updatedAt: convertTimestamp(data.updatedAt),
                  dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
                  deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
                });
              }
            });
          } catch (error) {
            console.error(`Error getting reminders for family member ${familyUserId}:`, error);
          }
        }
      }

      // Sort by updatedAt
      const sortedReminders = allReminders.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      // Cache the full result
      if (useCache) {
        setCachedReminders(userId, sortedReminders, familyId);
      }

      // Apply pagination
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const paginatedReminders = sortedReminders.slice(startIndex, endIndex);

      return {
        reminders: paginatedReminders,
        hasMore: endIndex < sortedReminders.length,
        totalCount: sortedReminders.length
      };

    } catch (error) {
      console.error('Error getting family reminders:', error);
      return { reminders: [], hasMore: false, totalCount: 0 };
    }
  },

  // Check if user has permission to view this reminder
  checkReminderPermission(
    reminderData: any, 
    userId: string, 
    userMember: FamilyMember, 
    familyMembers: FamilyMember[]
  ): boolean {
    // Owner can always view
    if (reminderData.userId === userId) {
      return true;
    }

    // If reminder is shared with family and user is a family member
    if (reminderData.sharedWithFamily && userMember) {
      // Check if user is assigned to this reminder
      if (reminderData.assignedTo && reminderData.assignedTo.includes(userId)) {
        return true;
      }

      // Check if user has admin role
      if (userMember.role === 'admin' || userMember.role === 'owner') {
        return true;
      }
    }

    return false;
  },

  // Check if user has permission to edit this reminder
  checkReminderEditPermission(
    reminderData: any, 
    userId: string, 
    userMember: FamilyMember
  ): boolean {
    // Owner can always edit
    if (reminderData.userId === userId) {
      return true;
    }

    // If reminder is shared for editing and user is a family member
    if (reminderData.sharedForEditing && userMember) {
      // Check if user is assigned to this reminder
      if (reminderData.assignedTo && reminderData.assignedTo.includes(userId)) {
        return true;
      }

      // Check if user has admin role
      if (userMember.role === 'admin' || userMember.role === 'owner') {
        return true;
      }
    }

    return false;
  },

  // Get deleted reminders for trash
  async getDeletedReminders(userId: string, limit: number = 50): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');

      // Get all reminders for the user, then filter for deleted ones in memory
      // This handles cases where deletedAt field doesn't exist yet
      const query = remindersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit * 2); // Get more to account for filtering

      const snapshot = await query.get();
      const reminders: Reminder[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        // Only include reminders that have been soft-deleted
        if (!data.deletedAt) {return;}

        reminders.push({
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
        });
      });

      // Sort by deletedAt and limit
      return reminders
        .sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting deleted reminders:', error);
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
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
          });
        });
    
        callback(reminders);
      }, (error) => {
        console.error('Error in reminders listener:', error);
        // Return empty array on error to trigger refetch

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
              fcmTokens: data?.fcmTokens || [],
              notificationSettings: data?.notificationSettings || {
                enabled: true,
                reminderNotifications: true,
                assignmentNotifications: true,
                familyNotifications: true,
                pushNotifications: true,
              },
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

  // Get a specific reminder by ID
  async getReminderById(reminderId: string): Promise<Reminder | null> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      
      const doc = await reminderRef.get();
      
      if (!doc.exists) {
        console.log('❌ Reminder not found:', reminderId);
        return null;
      }
      
      const data = doc.data();
      if (!data) {
        console.log('❌ Reminder data is undefined');
        return null;
      }
      
      const reminder: Reminder = {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        type: data.type || 'task',
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        dueDate: convertTimestamp(data.dueDate),
        dueTime: data.dueTime,
        startDate: convertTimestamp(data.startDate),
        startTime: data.startTime,
        endDate: convertTimestamp(data.endDate),
        endTime: data.endTime,
        location: data.location,
        isFavorite: data.isFavorite || false,
        isRecurring: data.isRecurring || false,
        repeatPattern: data.repeatPattern,
        customInterval: data.customInterval,
        hasNotification: data.hasNotification || false,
        notificationTimings: data.notificationTimings,
        assignedTo: data.assignedTo || [],
        assignedBy: data.assignedBy,
        tags: data.tags || [],
        completed: data.completed || false,
        deletedAt: convertTimestamp(data.deletedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        sharedWithFamily: data.sharedWithFamily || false,
        sharedForEditing: data.sharedForEditing || false,
        familyId: data.familyId,
        repeatDays: data.repeatDays || [],
        customFrequencyType: data.customFrequencyType,
        recurringStartDate: convertTimestamp(data.recurringStartDate),
        recurringEndDate: convertTimestamp(data.recurringEndDate),
        recurringGroupId: data.recurringGroupId,
      };
      
      console.log('✅ Reminder found:', reminder.title);
      return reminder;
    } catch (error) {
      console.error('Error getting reminder by ID:', error);
      if (handleFirebaseError(error, 'getReminderById')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get reminder.');
    }
  },

  // Update a reminder
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      
      // Get the current reminder to check if it's recurring
      const currentReminder = await reminderRef.get();
      const currentData = currentReminder.data() as Reminder;
      
      // Remove undefined fields before updating to prevent Firestore errors
      const cleanUpdates = removeUndefinedFields({
        ...updates,
        updatedAt: new Date(),
      });
      
      await reminderRef.update(cleanUpdates);

      // Handle recurring reminders - generate next occurrence if completed
      if (currentData.isRecurring && updates.completed === true) {
        await this.handleRecurringReminder(currentData);
      }

      // Update notifications if notification settings changed or recurring pattern changed
      const updatedReminder = { ...currentData, ...updates, updatedAt: new Date() };
      if (updates.hasNotification !== undefined || 
          updates.notificationTimings !== undefined || 
          updates.dueDate !== undefined || 
          updates.dueTime !== undefined ||
          updates.isRecurring !== undefined ||
          updates.repeatPattern !== undefined ||
          updates.repeatDays !== undefined ||
          updates.recurringEndDate !== undefined ||
          updates.recurringEndAfter !== undefined ||
          updates.customInterval !== undefined) {
        try {
          await notificationService.updateReminderNotifications(updatedReminder);
          console.log('✅ Notifications updated for reminder:', reminderId);
        } catch (notificationError) {
          console.error('Failed to update notifications for reminder:', notificationError);
          // Don't throw here - the reminder was updated successfully, just notification update failed
        }
      }
      
      // Cancel notifications if reminder is completed
      if (updates.completed === true || updates.status === 'completed') {
        try {
          const { notificationService } = await import('./notificationService');
          notificationService.cancelReminderNotifications(reminderId);
          console.log('🔔 Cancelled notifications for completed reminder');
        } catch (notificationError) {
          console.error('Failed to cancel notifications for completed reminder:', notificationError);
          // Don't throw here - the reminder was updated successfully, just notification cancellation failed
        }
      }

      // Send assignment notifications if assignments changed
      if (updates.assignedTo && updates.assignedTo.length > 0) {
        try {
          console.log('🔔 Sending assignment notifications for updated reminder...');
          const { notificationService } = await import('./notificationService');
          await notificationService.sendAssignmentNotification(
            reminderId,
            currentData.title,
            currentData.userId, // assigned by
            currentData.assignedBy || 'Unknown', // assigned by display name
            updates.assignedTo
          );
          console.log('✅ Assignment notifications sent for updated reminder');
        } catch (assignmentError) {
          console.error('❌ Failed to send assignment notifications for updated reminder:', assignmentError);
          // Don't throw here - the reminder was updated successfully
        }
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  // Handle recurring reminder logic
  async handleRecurringReminder(reminder: Reminder): Promise<void> {
    try {
      console.log('🔄 Handling recurring reminder:', reminder.title);
      console.log('📅 Current due date:', reminder.dueDate);
      console.log('📅 End date:', reminder.recurringEndDate);
      console.log('📅 End after:', reminder.recurringEndAfter);
      console.log('📅 Pattern:', reminder.repeatPattern);
      console.log('📅 Repeat days:', reminder.repeatDays);
      
      const nextOccurrence = generateNextOccurrence(reminder);
      if (nextOccurrence) {
        console.log('🔄 Generating next occurrence for recurring reminder:', reminder.title);
        console.log('📅 Next occurrence due date:', nextOccurrence.dueDate);
        
        // Check if we've reached the end conditions
        let shouldCreateNext = true;
        
        // Check recurring end date
        if (reminder.recurringEndDate && nextOccurrence.dueDate && nextOccurrence.dueDate > reminder.recurringEndDate) {
          console.log('🔄 Reached recurring end date, stopping generation');
          shouldCreateNext = false;
        }
        
        // Check recurring end after count
        if (reminder.recurringEndAfter) {
          // Count existing occurrences in this recurring group
          const existingOccurrences = await this.getRecurringGroupReminders(reminder.recurringGroupId || reminder.id);
          const completedCount = existingOccurrences.filter(r => r.completed).length;
          
          console.log('🔄 Existing completed occurrences:', completedCount, 'of', reminder.recurringEndAfter);
          
          if (completedCount >= reminder.recurringEndAfter) {
            console.log('🔄 Reached recurring end after count, stopping generation');
            shouldCreateNext = false;
          }
        }
        
        if (shouldCreateNext) {
          // Use the same recurring group ID for all occurrences
          const nextOccurrenceData = {
            ...nextOccurrence,
            recurringGroupId: reminder.recurringGroupId || reminder.id,
          } as Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>;
          
          await this.createReminder(nextOccurrenceData);
          console.log('✅ Next occurrence created successfully');
        } else {
          console.log('🔄 Stopped generating next occurrence due to end conditions');
        }
      } else {
        console.log('❌ No next occurrence generated (likely past end date or invalid pattern)');
      }
    } catch (error) {
      console.error('Error handling recurring reminder:', error);
    }
  },

  // Check and generate recurring reminders that are overdue
  async checkAndGenerateRecurringReminders(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const lastCheck = reminderService.lastRecurringCheckTime[userId] || 0;
      const timeSinceLastCheck = now - lastCheck;
      
      // Only check every 5 minutes to prevent excessive generation
      if (timeSinceLastCheck < 5 * 60 * 1000) {
        console.log('⏰ Skipping recurring check - too soon since last check:', Math.round(timeSinceLastCheck / 1000), 'seconds ago');
        return;
      }
      
      reminderService.lastRecurringCheckTime[userId] = now;
      console.log('🔄 Starting recurring reminder check for user:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Recurring reminder check timeout')), 10000); // 10 second timeout
      });
      
      const checkPromise = this.performRecurringReminderCheck(userId, now);
      
      await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error checking recurring reminders:', error);
    }
  },

  // Separate method to perform the actual check
  async performRecurringReminderCheck(userId: string, now: number): Promise<void> {
    try {
      
      const reminders = await this.getUserReminders(userId);
      const currentDate = new Date();
      
      // Group reminders by recurring group to avoid multiple queries
      const recurringGroups = new Map<string, Reminder[]>();
      
      // First pass: group reminders by recurring group
      for (const reminder of reminders) {
        if (reminder.isRecurring && reminder.repeatPattern && !reminder.completed) {
          const recurringGroupId = reminder.recurringGroupId || reminder.id;
          if (!recurringGroups.has(recurringGroupId)) {
            recurringGroups.set(recurringGroupId, []);
          }
          recurringGroups.get(recurringGroupId)!.push(reminder);
        }
      }
      
      // Second pass: process each group efficiently
      for (const [recurringGroupId, groupReminders] of recurringGroups) {
        try {
          // Get all reminders in this group in one query
          const allGroupReminders = await this.getRecurringGroupReminders(recurringGroupId);
          
          // Process each overdue reminder in the group
          for (const reminder of groupReminders) {
            const dueDate = reminder.dueDate;
            console.log('🔍 Checking reminder:', reminder.title);
            console.log('📅 Due date:', dueDate);
            console.log('📅 Current date:', currentDate);
            console.log('📅 End date:', reminder.recurringEndDate);
            
            if (dueDate && dueDate <= currentDate) {
              // Check if there's already a future occurrence
              const hasFutureOccurrence = allGroupReminders.some(r => 
                r.id !== reminder.id && // Not the current reminder
                r.dueDate && 
                r.dueDate > currentDate && 
                !r.completed && 
                !r.deletedAt
              );
              
              // Track recurring reminder processing for analytics
              if (__DEV__) {
                console.log('🔍 Has future occurrence:', hasFutureOccurrence);
                console.log('🔍 Total reminders in group:', allGroupReminders.length);
              }
              
              // Check if we've recently processed this recurring reminder (within last 10 minutes)
              const reminderKey = `${reminder.id}-${recurringGroupId}`;
              const lastProcessed = reminderService.recentlyProcessedRecurring[reminderKey] || 0;
              const timeSinceLastProcessed = now - lastProcessed;
              
              if (timeSinceLastProcessed < 10 * 60 * 1000) {
                if (__DEV__) {
                  console.log('⏭️ Skipping recurring reminder - recently processed:', reminder.title, Math.round(timeSinceLastProcessed / 1000), 'seconds ago');
                }
                // Track skipped processing for analytics
                this.trackRecurringReminderEvent('skipped_recently_processed', {
                  reminderId: reminder.id,
                  timeSinceLastProcessed: Math.round(timeSinceLastProcessed / 1000),
                  title: reminder.title
                });
              } else if (!hasFutureOccurrence) {
                if (__DEV__) {
                  console.log('🔄 Generating overdue recurring reminder:', reminder.title);
                }
                reminderService.recentlyProcessedRecurring[reminderKey] = now;
                await this.handleRecurringReminder(reminder);
                
                // Track successful generation for analytics
                this.trackRecurringReminderEvent('generated_overdue', {
                  reminderId: reminder.id,
                  title: reminder.title,
                  groupSize: allGroupReminders.length
                });
              } else {
                if (__DEV__) {
                  console.log('⏭️ Skipping recurring reminder generation - future occurrence already exists:', reminder.title);
                }
                // Track skipped due to future occurrence for analytics
                this.trackRecurringReminderEvent('skipped_future_exists', {
                  reminderId: reminder.id,
                  title: reminder.title,
                  groupSize: allGroupReminders.length
                });
              }
            } else {
              if (__DEV__) {
                console.log('⏭️ Reminder not overdue or no due date');
              }
            }
          }
        } catch (groupError) {
          console.error('Error processing recurring group:', recurringGroupId, groupError);
          // Continue with other groups even if one fails
        }
      }
      
      if (__DEV__) {
        console.log('✅ Recurring reminder check completed for user:', userId);
      }
    } catch (error) {
      console.error('Error checking recurring reminders:', error);
    }
  },

  // Track recurring reminder events for analytics
  trackRecurringReminderEvent(eventType: string, metadata: any): void {
    // Analytics tracking removed to fix Firebase issues
    if (__DEV__) {
      console.log('Recurring reminder event:', eventType, metadata);
    }
  },

  // Get all reminders in a recurring group
  async getRecurringGroupReminders(recurringGroupId: string): Promise<Reminder[]> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const querySnapshot = await firestoreInstance
        .collection('reminders')
        .where('recurringGroupId', '==', recurringGroupId)
        .orderBy('dueDate', 'asc')
        .get();

      const reminders: Reminder[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.deletedAt) {
          reminders.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
          } as Reminder);
        }
      });

      return reminders;
    } catch (error) {
      console.error('Error getting recurring group reminders:', error);
      throw error;
    }
  },

  // Delete all reminders in a recurring group
  async deleteRecurringGroup(recurringGroupId: string): Promise<void> {
    try {
      const reminders = await this.getRecurringGroupReminders(recurringGroupId);
      
      // Cancel notifications for all reminders in the group
      const { notificationService } = await import('./notificationService');
      for (const reminder of reminders) {
        try {
          notificationService.cancelReminderNotifications(reminder.id);
        } catch (notificationError) {
          console.error('Failed to cancel notifications for reminder:', reminder.id, notificationError);
        }
      }

      // Soft delete all reminders in the group
      const firestoreInstance = getFirestoreInstance();
      const batch = firestoreInstance.batch();
      
      for (const reminder of reminders) {
        const reminderRef = firestoreInstance.collection('reminders').doc(reminder.id);
        batch.update(reminderRef, {
          status: 'cancelled',
          deletedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      console.log(`✅ Deleted ${reminders.length} reminders from recurring group: ${recurringGroupId}`);
    } catch (error) {
      console.error('Error deleting recurring group:', error);
      throw error;
    }
  },

  // Delete a single occurrence of a recurring reminder
  async deleteRecurringOccurrence(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      
      // Cancel notifications for this specific reminder
      try {
        const { notificationService } = await import('./notificationService');
        notificationService.cancelReminderNotifications(reminderId);
        console.log('🔔 Cancelled notifications for deleted recurring occurrence');
      } catch (notificationError) {
        console.error('Failed to cancel notifications for deleted recurring occurrence:', notificationError);
      }

      // Soft delete just this occurrence
      await reminderRef.update({
        status: 'cancelled',
        deletedAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Recurring occurrence deleted');
    } catch (error) {
      console.error('Error deleting recurring occurrence:', error);
      throw error;
    }
  },

  // Soft delete a reminder (move to trash)
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      
      // Get the reminder data to check if it's recurring
      const reminderDoc = await reminderRef.get();
      const reminderData = reminderDoc.data();
      
      if (reminderData?.isRecurring && reminderData?.recurringGroupId) {
        // For recurring reminders, delete the entire group
        // Note: This will be overridden by the confirmation dialog in the UI
        await this.deleteRecurringGroup(reminderData.recurringGroupId);
      } else {
        // For non-recurring reminders, just delete this one
        await reminderRef.update({
          status: 'cancelled',
          deletedAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Cancel all notifications for this reminder
        try {
          const { notificationService } = await import('./notificationService');
          notificationService.cancelReminderNotifications(reminderId);
          console.log('🔔 Cancelled notifications for deleted reminder');
        } catch (notificationError) {
          console.error('Failed to cancel notifications for deleted reminder:', notificationError);
          // Don't throw here - the reminder was deleted successfully, just notification cancellation failed
        }
      }
      
      console.log('✅ Reminder moved to trash');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // Restore a deleted reminder
  async restoreReminder(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      await reminderRef.update({
        deletedAt: null,
        status: 'pending',
        updatedAt: new Date(),
      });
      console.log('✅ Reminder restored successfully');
    } catch (error) {
      console.error('Error restoring reminder:', error);
      throw error;
    }
  },

  // Permanently delete a reminder (hard delete)
  async permanentDeleteReminder(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      await reminderRef.delete();
      
      // Cancel all notifications for this reminder
      try {
        const { notificationService } = await import('./notificationService');
        notificationService.cancelReminderNotifications(reminderId);
        console.log('🔔 Cancelled notifications for permanently deleted reminder');
      } catch (notificationError) {
        console.error('Failed to cancel notifications for permanently deleted reminder:', notificationError);
        // Don't throw here - the reminder was deleted successfully, just notification cancellation failed
      }
      
      console.log('✅ Reminder permanently deleted');
    } catch (error) {
      console.error('Error permanently deleting reminder:', error);
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
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
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
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          dueDate: data.dueDate ? convertTimestamp(data.dueDate) : undefined,
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt) : undefined,
        });
      });

      return reminders;
    } catch (error) {
      console.error('Error getting reminders by priority:', error);
      return [];
    }
  },

  // Cache management functions
  clearReminderCache: (userId?: string) => {
    if (userId) {
      clearUserCache(userId);
    } else {
      reminderCache.clear();
    }
  },

  // Get cache statistics for debugging
  getCacheStats: () => {
    return {
      cacheSize: reminderCache.size,
      cacheKeys: Array.from(reminderCache.keys()),
      cacheEntries: Array.from(reminderCache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        dataLength: value.data.length,
        familyId: value.familyId
      }))
    };
  },

  // Check if family is large enough to use polling instead of real-time
  shouldUsePollingForFamily: (familySize: number): boolean => {
    return familySize > MAX_FAMILY_SIZE_FOR_REALTIME;
  },

  // Get reminders with family permissions (optimized with indexes)
  async getRemindersWithFamilyPermissions(userId: string, familyId?: string): Promise<Reminder[]> {
    // Analytics tracking removed to fix Firebase issues
    
    try {
      // Get family members first
      const familyMembers = await this.getFamilyMembers(familyId);
      console.log('👥 Getting family members...');
      
      if (!familyMembers || familyMembers.length === 0) {
        console.log('❌ No family members found, falling back to user-only reminders');
        return this.getUserReminders(userId);
      }
      
      console.log(`✅ Retrieved ${familyMembers.length} family members`);
      
      // Get user's own reminders
      const userReminders = await this.getUserReminders(userId);
      console.log(`📋 Found ${userReminders.length} user reminders`);
      
      // Get reminders assigned to this user (using index)
      let assignedReminders: Reminder[] = [];
      try {
        const firestoreInstance = getFirestoreInstance();
        const assignedQuery = firestoreInstance
          .collection('reminders')
          .where('assignedTo', 'array-contains', userId)
          .orderBy('createdAt', 'desc')
          .limit(50); // Limit for performance

        const assignedSnapshot = await assignedQuery.get();
        assignedReminders = assignedSnapshot && !assignedSnapshot.empty
          ? assignedSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
            } as Reminder))
          : [];
        console.log(`📋 Found ${assignedReminders.length} assigned reminders`);
      } catch (error) {
        console.error('Error getting assigned reminders:', error);
      }
      
      // Get family-shared reminders
      let familyReminders: Reminder[] = [];
      try {
        const firestoreInstance = getFirestoreInstance();
        const familyQuery = firestoreInstance
          .collection('reminders')
          .where('sharedWithFamily', '==', true)
          .where('familyId', '==', familyId)
          .orderBy('createdAt', 'desc')
          .limit(50);

        const familySnapshot = await familyQuery.get();
        familyReminders = familySnapshot.docs
          .map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          } as Reminder))
          .filter(reminder => reminder.userId !== userId); // Filter out user's own
        console.log(`🏠 Found ${familyReminders.length} family-shared reminders`);
      } catch (error) {
        console.error('Error getting family reminders:', error);
      }
      
      // Combine all reminders and remove duplicates
      const allReminders = [...userReminders, ...assignedReminders, ...familyReminders];
      const uniqueReminders = allReminders.filter((reminder, index, self) => 
        index === self.findIndex(r => r.id === reminder.id)
      );
      
      console.log(`✅ Total unique reminders: ${uniqueReminders.length}`);
      
      return uniqueReminders;
    } catch (error) {
      console.error('Error in getRemindersWithFamilyPermissions:', error);
      throw error;
    }
  },

  // Get reminders for a specific family member (with error handling)
  async getRemindersForFamilyMember(memberId: string): Promise<Reminder[]> {
    try {
      console.log(`👤 Getting reminders for family member ${memberId}...`);
      
      const firestoreInstance = getFirestoreInstance();
      const memberQuery = firestoreInstance
        .collection('reminders')
        .where('userId', '==', memberId);

      const memberSnapshot = await memberQuery.get();
      const memberReminders = memberSnapshot && !memberSnapshot.empty 
        ? memberSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          } as Reminder))
        : [];
      
      console.log(`✅ Found ${memberReminders.length} reminders for member ${memberId}`);
      return memberReminders;
      
    } catch (error) {
      console.error(`❌ Error getting reminders for family member ${memberId}:`, error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get reminders assigned to a user (with error handling)
  async getAssignedReminders(userId: string): Promise<Reminder[]> {
    try {
      console.log(`📋 Getting reminders assigned to user ${userId}...`);
      
      const firestoreInstance = getFirestoreInstance();
      const assignedQuery = firestoreInstance
        .collection('reminders')
        .where('assignedTo', 'array-contains', userId)
        .where('userId', '!=', userId); // Exclude user's own reminders

      const assignedSnapshot = await assignedQuery.get();
      const assignedReminders = assignedSnapshot && !assignedSnapshot.empty
        ? assignedSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          } as Reminder))
        : [];
      
      console.log(`✅ Found ${assignedReminders.length} assigned reminders`);
      return assignedReminders;
      
    } catch (error) {
      console.error(`❌ Error getting assigned reminders:`, error);
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get family members with error handling
  async getFamilyMembers(familyId?: string): Promise<FamilyMember[]> {
    try {
      if (!familyId) {
        console.log('❌ No family ID provided');
        return [];
      }

      console.log('👥 Getting family members...');
      
      const firestoreInstance = getFirestoreInstance();
      const membersQuery = firestoreInstance
        .collection('familyMembers')
        .where('familyId', '==', familyId);

      const membersSnapshot = await membersQuery.get();
      if (!membersSnapshot || !membersSnapshot.docs) {
        console.log('❌ membersSnapshot is null or docs is undefined');
        return [];
      }
      const members = !membersSnapshot.empty
        ? membersSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          } as FamilyMember))
        : [];
      
      console.log(`✅ Retrieved ${members.length} family members`);
      return members;
      
    } catch (error) {
      console.error('❌ Error getting family members:', error);
      return [];
    }
  },

  // Get user's family (simplified version)
  async getUserFamily(userId: string): Promise<Family | null> {
    try {
      const firestoreInstance = getFirestoreInstance();

  

      // Get all family memberships for this user
      const memberQuery = await firestoreInstance
        .collection('familyMembers')
        .where('userId', '==', userId)
        .get();

      if (!memberQuery || !memberQuery.docs) {
        console.log('❌ memberQuery is null or docs is undefined');
        return null;
      }

      if (memberQuery.empty) {
        console.log('ℹ️ User is not part of any family');
        return null;
      }

      // Sort by joinedAt descending and get the most recent
      const members = memberQuery.docs && memberQuery.docs.length > 0
        ? memberQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as any)).sort((a, b) => {
            const aDate = convertTimestamp(a.joinedAt);
            const bDate = convertTimestamp(b.joinedAt);
            return bDate.getTime() - aDate.getTime();
          })
        : [];

      const mostRecentMember = members[0];
      if (!mostRecentMember) {
        console.log('ℹ️ No family members found');
        return null;
      }
      
      const familyId = mostRecentMember.familyId;

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
        maxMembers: data.maxMembers || 2, // Default to free tier limit
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        settings: data.settings,
      };

      console.log('✅ Family retrieved successfully');
      return family;
    } catch (error) {
      console.error('❌ Error getting user family:', error);
      return null;
    }
  },

  // Add family member (simplified version)
  async addFamilyMember(memberData: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActive' | 'isOnline'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) {throw new Error('No user ID available');}

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

      console.log('✅ Family member added successfully:', memberId);
      return memberId;
    } catch (error) {
      console.error('❌ Error adding family member:', error);
      throw error;
    }
  },

  // Remove family member (simplified version)
  async removeFamilyMember(memberId: string, familyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('👤 Removing family member...');

      await firestoreInstance.collection('familyMembers').doc(memberId).delete();

      console.log('✅ Family member removed successfully');
    } catch (error) {
      console.error('❌ Error removing family member:', error);
      throw error;
    }
  },

  // Create family activity (simplified version)
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
      console.error('❌ Error creating family activity:', error);
      throw error;
    }
  },

  // Get family activities (simplified version)
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
        try {
          const data = doc.data();
          
          // Validate required fields
          if (!data.familyId || !data.type || !data.title || !data.description || !data.memberId || !data.memberName) {
            console.warn('Skipping family activity with missing required fields:', doc.id);
            return;
          }

          // Convert timestamp with error handling
          let createdAt: Date;
          try {
            createdAt = convertTimestamp(data.createdAt);
            if (isNaN(createdAt.getTime())) {
              console.warn('Invalid createdAt timestamp for activity:', doc.id, data.createdAt);
              createdAt = new Date(); // Fallback to current time
            }
          } catch (timestampError) {
            console.warn('Error converting timestamp for activity:', doc.id, timestampError);
            createdAt = new Date(); // Fallback to current time
          }

          activities.push({
            id: doc.id,
            familyId: data.familyId,
            type: data.type,
            title: data.title,
            description: data.description,
            memberId: data.memberId,
            memberName: data.memberName,
            metadata: data.metadata,
            createdAt: createdAt,
          });
        } catch (activityError) {
          console.error('Error processing family activity:', doc.id, activityError);
          // Continue with other activities instead of failing completely
        }
      });

      console.log(`✅ Retrieved ${activities.length} family activities`);
      return activities;
    } catch (error) {
      console.error('❌ Error getting family activities:', error);
      return [];
    }
  },

  // Create family (simplified version)
  async createFamily(familyData: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) {throw new Error('No user ID available');}

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
      console.error('❌ Error creating family:', error);
      throw error;
    }
  },

  // Create default family if needed (simplified version)
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
        maxMembers: 2, // Free tier default
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

  // Listen to family members changes (simplified version)
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
            
            // Add null check for snapshot
            if (snapshot && !snapshot.empty) {
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
            }
            
            callback(members);
          },
          (error) => {
            console.error('Error listening to family members changes:', error);
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up family members listener:', error);
      // Return a no-op function
      return () => {};
    }
  },

  // Listen to family activities changes (simplified version)
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
            
            // Add null check for snapshot
            if (snapshot && !snapshot.empty) {
              snapshot.forEach((doc) => {
                try {
                  const data = doc.data();
                  
                  // Validate required fields
                  if (!data.familyId || !data.type || !data.title || !data.description || !data.memberId || !data.memberName) {
                    console.warn('Skipping family activity with missing required fields:', doc.id);
                    return;
                  }

                  // Convert timestamp with error handling
                  let createdAt: Date;
                  try {
                    createdAt = convertTimestamp(data.createdAt);
                    if (isNaN(createdAt.getTime())) {
                      console.warn('Invalid createdAt timestamp for activity:', doc.id, data.createdAt);
                      createdAt = new Date(); // Fallback to current time
                    }
                  } catch (timestampError) {
                    console.warn('Error converting timestamp for activity:', doc.id, timestampError);
                    createdAt = new Date(); // Fallback to current time
                  }

                  activities.push({
                    id: doc.id,
                    familyId: data.familyId,
                    type: data.type,
                    title: data.title,
                    description: data.description,
                    memberId: data.memberId,
                    memberName: data.memberName,
                    metadata: data.metadata,
                    createdAt: createdAt,
                  });
                } catch (activityError) {
                  console.error('Error processing family activity in listener:', doc.id, activityError);
                  // Continue with other activities instead of failing completely
                }
              });
            }
            
            callback(activities);
          },
          (error) => {
            console.error('Error listening to family activities changes:', error);
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up family activities listener:', error);
      // Return a no-op function
      return () => {};
    }
  },

  // Family Invitation Services
  async sendFamilyInvitation(invitationData: Omit<FamilyInvitation, 'id' | 'status' | 'createdAt' | 'expiresAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) {throw new Error('No user ID available');}

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

  // Countdown Services
  async createCountdown(countdownData: Countdown): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('⏰ Creating countdown...');

      const docRef = firestoreInstance.collection('countdowns').doc(countdownData.id);
      await docRef.set({
        ...countdownData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Countdown created successfully:', countdownData.id);
    } catch (error) {
      if (handleFirebaseError(error, 'createCountdown')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot create countdown.');
    }
  },

  async getCountdowns(userId: string): Promise<Countdown[]> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('⏰ Getting countdowns for user:', userId);

      // Check if user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.warn('⚠️ No authenticated user found when getting countdowns');
        throw new Error('User not authenticated');
      }

      if (currentUser.uid !== userId) {
        console.warn('⚠️ User ID mismatch when getting countdowns:', {
          currentUserId: currentUser.uid,
          requestedUserId: userId,
        });
      }

      const querySnapshot = await firestoreInstance
        .collection('countdowns')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      const countdowns: Countdown[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        countdowns.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          targetDate: data.targetDate,
          targetTime: data.targetTime,
          color: data.color,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });

      console.log(`✅ Retrieved ${countdowns.length} countdowns for user ${userId}`);
      return countdowns;
    } catch (error: any) {
      console.error('❌ Error in getCountdowns:', error);

      // Log specific error details for debugging
      if (error.code) {
        console.error('❌ Firebase error code:', error.code);
      }
      if (error.message) {
        console.error('❌ Error message:', error.message);
      }

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        console.error('❌ Permission denied when accessing countdowns');
        throw new Error('Firebase permission denied. Cannot get countdowns.');
      } else if (error.code === 'unauthenticated') {
        console.error('❌ User not authenticated when accessing countdowns');
        throw new Error('User not authenticated. Please sign in again.');
      } else if (error.code === 'not-found') {
        console.error('❌ Countdowns collection not found');
        throw new Error('Countdowns collection not found.');
      }

      if (handleFirebaseError(error, 'getCountdowns')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get countdowns.');
    }
  },

  async updateCountdown(countdownData: Countdown): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('⏰ Updating countdown...');

      await firestoreInstance.collection('countdowns').doc(countdownData.id).update({
        ...countdownData,
        updatedAt: new Date(),
      });

      console.log('✅ Countdown updated successfully:', countdownData.id);
    } catch (error) {
      if (handleFirebaseError(error, 'updateCountdown')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update countdown.');
    }
  },

  async deleteCountdown(countdownId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      await firestoreInstance.collection('countdowns').doc(countdownId).delete();
      console.log('✅ Countdown deleted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'deleteCountdown')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot delete countdown.');
    }
  },

  // Real-time listener for user countdowns
  onUserCountdownsChange(userId: string, callback: (countdowns: Countdown[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      const countdownsRef = firestoreInstance.collection('countdowns');
      const query = countdownsRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

      return query.onSnapshot((snapshot) => {
        const countdowns: Countdown[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          countdowns.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            description: data.description,
            targetDate: data.targetDate,
            targetTime: data.targetTime,
            color: data.color,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
          });
        });
        console.log(`⏰ Countdowns updated via listener: ${countdowns.length} countdowns`);
        callback(countdowns);
      }, (error) => {
        console.error('❌ Error in countdowns listener:', error);
        callback([]);
      });
    } catch (error) {
      console.error('❌ Error setting up countdowns listener:', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  },

  // Update list permissions (owner only)
  async updateListPermissions(
    listId: string,
    permissions: {
      isPrivate: boolean;
      sharedWithFamily: boolean;
    }
  ): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('🔐 Updating list permissions:', listId);

      // Get the current list to verify ownership
      const list = await listService.getListById(listId);
      if (!list) {
        throw new Error('List not found');
      }

      if (list.createdBy !== userId) {
        throw new Error('Only list owner can update permissions');
      }

      // Get user's family to set proper familyId
      let userFamilyId: string | null = null;
      if (permissions.sharedWithFamily) {
        try {
          const userFamily = await reminderService.getUserFamily(userId);
          if (userFamily) {
            userFamilyId = userFamily.id;
            console.log('👨‍👩‍👧‍👦 User has family:', userFamily.name);
          } else {
            throw new Error('User is not in a family. Cannot share with family.');
          }
        } catch (error) {
          console.error('Could not get user family for permission update:', error);
          throw new Error('Could not verify family membership');
        }
      }

      // Update the list permissions
      const updateData = {
        isPrivate: permissions.isPrivate,
        familyId: permissions.sharedWithFamily ? userFamilyId : null,
        updatedAt: new Date(),
      };

      await firestoreInstance.collection('lists').doc(listId).update(updateData);
      console.log('✅ List permissions updated successfully');

      // Create family activity if sharing with family
      if (permissions.sharedWithFamily && userFamilyId) {
        try {
          await reminderService.createFamilyActivity({
            familyId: userFamilyId,
            type: 'reminder_shared',
            title: 'List Shared with Family',
            description: `Shared list "${list.name}" with family`,
            memberId: userId,
            memberName: auth().currentUser?.displayName || 'Family Member',
            metadata: {
              listId: listId,
              listName: list.name,
              isPrivate: permissions.isPrivate,
            }
          });
          console.log('✅ Family activity created for list sharing');
        } catch (activityError) {
          console.error('Failed to create family activity for list sharing:', activityError);
          // Don't throw here - the permissions were updated successfully
        }
      }
    } catch (error) {
      if (handleFirebaseError(error, 'updateListPermissions')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update list permissions.');
    }
  },

  // Check if user has permission to view a list
  async checkListPermission(listId: string, userId: string): Promise<{
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    reason?: string;
  }> {
    try {
      const list = await listService.getListById(listId);
      if (!list) {
        return { canView: false, canEdit: false, canDelete: false, reason: 'List not found' };
      }

      // Owner can do everything
      if (list.createdBy === userId) {
        return { canView: true, canEdit: true, canDelete: true };
      }

      // Check if user is in the same family
      if (list.familyId) {
        try {
          const userFamily = await reminderService.getUserFamily(userId);
          if (userFamily && userFamily.id === list.familyId) {
            // Family members can view non-private lists
            if (!list.isPrivate) {
              return { canView: true, canEdit: false, canDelete: false };
            }
          }
        } catch (error) {
          console.error('Error checking family membership:', error);
        }
      }

      return { canView: false, canEdit: false, canDelete: false, reason: 'No permission' };
    } catch (error) {
      console.error('Error checking list permission:', error);
      return { canView: false, canEdit: false, canDelete: false, reason: 'Error checking permission' };
    }
  }
};

// List Management
export const listService = {
  // Create a new list
  async createList(listData: Omit<UserList, 'id' | 'createdAt' | 'updatedAt' | 'items'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('📋 Creating list with family support...');

      // Get user's family to set proper familyId
      let userFamilyId: string | null = null;
      try {
        const userFamily = await reminderService.getUserFamily(userId);
        if (userFamily) {
          userFamilyId = userFamily.id;
          console.log('👨‍👩‍👧‍👦 User has family:', userFamily.name);
        }
      } catch (error) {
        console.log('⚠️ Could not get user family for list creation:', error);
      }

      // Determine if list should be shared with family
      const shouldShareWithFamily = listData.familyId !== null || 
        (userFamilyId && !listData.isPrivate);

      const list: Omit<UserList, 'id'> = {
        name: listData.name,
        description: listData.description,
        items: [],
        format: listData.format || 'checkmark',
        isFavorite: listData.isFavorite || false,
        isPrivate: listData.isPrivate || false,
        familyId: shouldShareWithFamily ? userFamilyId : null,
        createdBy: listData.createdBy || userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanListData = removeUndefinedFields(list);

      const docRef = await firestoreInstance.collection('lists').add(cleanListData);
      console.log('✅ List created with ID:', docRef.id);
      
      // Create family activity if shared with family
      if (shouldShareWithFamily && userFamilyId) {
        try {
          await reminderService.createFamilyActivity({
            familyId: userFamilyId,
            type: 'reminder_created',
            title: 'New Family List',
            description: `Created a new shared list: "${listData.name}"`,
            memberId: userId,
            memberName: auth().currentUser?.displayName || 'Family Member',
            metadata: {
              listId: docRef.id,
              listName: listData.name,
              isPrivate: listData.isPrivate,
            }
          });
          console.log('✅ Family activity created for new list');
        } catch (activityError) {
          console.error('Failed to create family activity for list:', activityError);
          // Don't throw here - the list was created successfully
        }
      }
      
      return docRef.id;
    } catch (error) {
      if (handleFirebaseError(error, 'createList')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot create list.');
    }
  },

  // Get user lists with family support
  async getUserLists(userId: string): Promise<UserList[]> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('📋 Getting lists for user:', userId);

      // First, get user's family to check for shared lists
      let userFamilyId: string | null = null;
      try {
        // Use reminderService to get user family since it has the method
        const userFamily = await reminderService.getUserFamily(userId);
        if (userFamily) {
          userFamilyId = userFamily.id;
          console.log('👨‍👩‍👧‍👦 User has family:', userFamily.name);
        }
      } catch (error) {
        console.log('⚠️ Could not get user family for list fetching:', error);
      }

      // Get lists created by the user
      const userListsSnapshot = await firestoreInstance
        .collection('lists')
        .where('createdBy', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get();

      const lists: UserList[] = [];

      // Process user's own lists
      userListsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          lists.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            items: data.items || [],
            format: data.format || 'checkmark',
            isFavorite: data.isFavorite || false,
            isPrivate: data.isPrivate || false,
            familyId: data.familyId,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            createdBy: data.createdBy,
          });
        }
      });

      // If user has a family, also get shared lists from family members
      if (userFamilyId) {
        try {
          const sharedListsSnapshot = await firestoreInstance
            .collection('lists')
            .where('familyId', '==', userFamilyId)
            .where('isPrivate', '==', false)
            .orderBy('updatedAt', 'desc')
            .get();

          sharedListsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data && data.createdBy !== userId) { // Filter out user's own lists in JavaScript
              lists.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                items: data.items || [],
                format: data.format || 'checkmark',
                isFavorite: data.isFavorite || false,
                isPrivate: data.isPrivate || false,
                familyId: data.familyId,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
                createdBy: data.createdBy,
              });
            }
          });
        } catch (error) {
          console.warn('⚠️ Could not fetch family-shared lists:', error);
        }
      }

      // Sort all lists by updatedAt (most recent first)
      lists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      console.log(`✅ Found ${lists.length} lists (${userListsSnapshot.size} own + ${lists.length - userListsSnapshot.size} shared)`);
      return lists;
    } catch (error) {
      if (handleFirebaseError(error, 'getUserLists')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get lists.');
    }
  },

  // Get a specific list by ID
  async getListById(listId: string): Promise<UserList | null> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('📋 Getting list by ID:', listId);

      const doc = await firestoreInstance.collection('lists').doc(listId).get();

      if (!doc.exists) {
        console.log('❌ List not found');
        return null;
      }

      const data = doc.data();
      if (!data) {
        console.log('❌ List data is undefined');
        return null;
      }

      const list: UserList = {
        id: doc.id,
        name: data.name,
        description: data.description,
        items: data.items || [],
        format: data.format || 'checkmark',
        isFavorite: data.isFavorite || false,
        isPrivate: data.isPrivate || false,
        familyId: data.familyId,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        createdBy: data.createdBy,
      };

      console.log('✅ List found:', list.name);
      return list;
    } catch (error) {
      if (handleFirebaseError(error, 'getListById')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get list.');
    }
  },

  // Update a list
  async updateList(listId: string, updates: Partial<UserList>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('📝 Updating list:', listId);

      // Filter out undefined values to avoid Firestore errors
      const cleanUpdates = removeUndefinedFields(updates);

      const updateData = {
        ...cleanUpdates,
        updatedAt: new Date(),
      };

      await firestoreInstance.collection('lists').doc(listId).update(updateData);
      console.log('✅ List updated successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'updateList')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update list.');
    }
  },

  // Delete a list
  async deleteList(listId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('🗑️ Deleting list:', listId);

      await firestoreInstance.collection('lists').doc(listId).delete();
      console.log('✅ List deleted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'deleteList')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot delete list.');
    }
  },

  // Add item to list
  async addListItem(listId: string, itemData: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('➕ Adding item to list:', listId);

      const item: ListItem = {
        ...itemData,
        id: firestoreInstance.collection('_temp').doc().id, // Generate ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanItem = removeUndefinedFields(item);

      const listRef = firestoreInstance.collection('lists').doc(listId);
      await listRef.update({
        items: FirebaseFirestoreTypes.FieldValue.arrayUnion(cleanItem),
        updatedAt: new Date(),
      });

      console.log('✅ Item added successfully');
      return item.id;
    } catch (error) {
      if (handleFirebaseError(error, 'addListItem')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot add item to list.');
    }
  },

  // Update list item
  async updateListItem(listId: string, itemId: string, updates: Partial<ListItem>): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('📝 Updating list item:', itemId);

      const listRef = firestoreInstance.collection('lists').doc(listId);
      const listDoc = await listRef.get();

      if (!listDoc.exists) {
        throw new Error('List not found');
      }

      const listData = listDoc.data();
      if (!listData) {
        throw new Error('List data is undefined');
      }

      const items = listData.items || [];
      const itemIndex = items.findIndex((item: ListItem) => item.id === itemId);

      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Filter out undefined values from updates
      const cleanUpdates = removeUndefinedFields(updates);

      items[itemIndex] = {
        ...items[itemIndex],
        ...cleanUpdates,
        updatedAt: new Date(),
      };

      await listRef.update({
        items,
        updatedAt: new Date(),
      });

      console.log('✅ Item updated successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'updateListItem')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update list item.');
    }
  },

  // Delete list item
  async deleteListItem(listId: string, itemId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      console.log('🗑️ Deleting list item:', itemId);

      const listRef = firestoreInstance.collection('lists').doc(listId);
      const listDoc = await listRef.get();

      if (!listDoc.exists) {
        throw new Error('List not found');
      }

      const listData = listDoc.data();
      if (!listData) {
        throw new Error('List data is undefined');
      }

      const items = listData.items || [];
      const filteredItems = items.filter((item: ListItem) => item.id !== itemId);

      await listRef.update({
        items: filteredItems,
        updatedAt: new Date(),
      });

      console.log('✅ Item deleted successfully');
    } catch (error) {
      if (handleFirebaseError(error, 'deleteListItem')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot delete list item.');
    }
  },

  // Listen to user lists changes (including family shared lists, real-time)
  onUserListsChange(userId: string, callback: (lists: UserList[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      let userLists: UserList[] = [];
      let familyLists: UserList[] = [];
      let unsubUser: (() => void) | null = null;
      let unsubFamily: (() => void) | null = null;
      let userFamilyId: string | null = null;

      // Helper to merge and callback
      const update = () => {
        // Deduplicate by id
        const all = [...userLists, ...familyLists].filter(
          (list, idx, arr) => arr.findIndex(l => l.id === list.id) === idx
        );
        // Sort by updatedAt
        all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        callback(all);
      };

      // Get familyId, then set up listeners
      reminderService.getUserFamily(userId).then(family => {
        userFamilyId = family?.id || null;

        // Listen to user's own lists
        unsubUser = firestoreInstance
          .collection('lists')
          .where('createdBy', '==', userId)
          .onSnapshot(snapshot => {
            userLists = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              userLists.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                items: data.items || [],
                format: data.format || 'checkmark',
                isFavorite: data.isFavorite || false,
                isPrivate: data.isPrivate || false,
                familyId: data.familyId,
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
                createdBy: data.createdBy,
              });
            });
            update();
          });

        // Listen to family shared lists (if in a family)
        if (userFamilyId) {
          unsubFamily = firestoreInstance
            .collection('lists')
            .where('familyId', '==', userFamilyId)
            .where('isPrivate', '==', false)
            .onSnapshot(snapshot => {
              familyLists = [];
              snapshot.forEach(doc => {
                const data = doc.data();
                // Exclude user's own lists
                if (data.createdBy !== userId) {
                  familyLists.push({
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    items: data.items || [],
                    format: data.format || 'checkmark',
                    isFavorite: data.isFavorite || false,
                    isPrivate: data.isPrivate || false,
                    familyId: data.familyId,
                    createdAt: convertTimestamp(data.createdAt),
                    updatedAt: convertTimestamp(data.updatedAt),
                    createdBy: data.createdBy,
                  });
                }
              });
              update();
            });
        }
      });

      // Return unsubscribe function
      return () => {
        if (unsubUser) unsubUser();
        if (unsubFamily) unsubFamily();
      };
    } catch (error) {
      if (handleFirebaseError(error, 'onUserListsChange')) {
        console.error('Error setting up lists listener:', error);
      }
      // Return a no-op function
      return () => {};
    }
  },

  // Listen to a specific list changes
  onListChange(listId: string, callback: (list: UserList) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();

      const unsubscribe = firestoreInstance
        .collection('lists')
        .doc(listId)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data) {
                const list: UserList = {
                  id: doc.id,
                  name: data.name,
                  description: data.description,
                  items: data.items || [],
                  format: data.format || 'checkmark',
                  isFavorite: data.isFavorite || false,
                  isPrivate: data.isPrivate || false,
                  familyId: data.familyId,
                  createdAt: convertTimestamp(data.createdAt),
                  updatedAt: convertTimestamp(data.updatedAt),
                  createdBy: data.createdBy,
                };
                console.log('📡 List updated via listener:', list.name);
                callback(list);
              }
            } else {
              console.log('📡 List not found in listener:', listId);
              // Call callback with null to indicate list was deleted
              callback(null as any);
            }
          },
          (error) => {
            if (handleFirebaseError(error, 'onListChange')) {
              console.error('Error listening to list changes:', error);
            }
            // Call callback with empty data on error to trigger refetch
            callback(null as any);
          }
        );

      return unsubscribe;
    } catch (error) {
      if (handleFirebaseError(error, 'onListChange')) {
        console.error('Error setting up list listener:', error);
      }
      // Return a no-op function
      return () => {};
    }
  },
};

// Add caching and performance optimizations
const reminderCache = new Map<string, { data: Reminder[]; timestamp: number; familyId?: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_FAMILY_SIZE_FOR_REALTIME = 10; // Use polling for families larger than 10 members

// Helper function to get cached reminders
const getCachedReminders = (userId: string, familyId?: string): Reminder[] | null => {
  const cacheKey = familyId ? `${userId}_${familyId}` : userId;
  const cached = reminderCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
};

// Helper function to set cached reminders
const setCachedReminders = (userId: string, reminders: Reminder[], familyId?: string): void => {
  const cacheKey = familyId ? `${userId}_${familyId}` : userId;
  reminderCache.set(cacheKey, {
    data: reminders,
    timestamp: Date.now(),
    familyId
  });
};

// Helper function to clear cache for a user
const clearUserCache = (userId: string): void => {
  const keysToDelete: string[] = [];
  for (const [key] of reminderCache) {
    if (key.startsWith(userId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => reminderCache.delete(key));
};

// Main firebaseService object that combines all services
const firebaseService = {
  // Initialize Firebase
  initializeFirebase,

  // User services
  ...userService,

  // Reminder services
  ...reminderService,

  // List services
  ...listService,

  // Cache management functions
  clearReminderCache: (userId?: string) => {
    if (userId) {
      clearUserCache(userId);
    } else {
      reminderCache.clear();
    }
  },

  // Get cache statistics for debugging
  getCacheStats: () => {
    return {
      cacheSize: reminderCache.size,
      cacheKeys: Array.from(reminderCache.keys()),
      cacheEntries: Array.from(reminderCache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        dataLength: value.data.length,
        familyId: value.familyId
      }))
    };
  },
};

/**
 * Add a notification to the familyNotifications collection
 * @param notification { familyId, type, reminderId, assignedTo, createdBy, createdAt, message, [extra fields] }
 */
export async function addFamilyNotification(notification: {
  familyId: string;
  type: string;
  reminderId?: string;
  assignedTo?: string[];
  createdBy: string;
  createdAt?: Date;
  message: string;
  [key: string]: any;
}): Promise<string> {
  try {
    const firestoreInstance = getFirestoreInstance();
    const docRef = firestoreInstance.collection('familyNotifications').doc();
    const notificationId = docRef.id;
    const now = new Date();
    await docRef.set({
      id: notificationId,
      ...notification,
      createdAt: notification.createdAt || now,
    });
    console.log('✅ Family notification created:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error creating family notification:', error);
    throw error;
  }
}

export default firebaseService;

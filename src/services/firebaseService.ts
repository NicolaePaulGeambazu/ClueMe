import firebase from '@react-native-firebase/app';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
// Analytics service removed to fix Firebase issues
import notificationService from './notificationService';
import { Platform } from 'react-native';
import { generateNextOccurrence, shouldGenerateNextOccurrence } from '../utils/reminderUtils';
import logger from '../utils/logger';
import type { ReminderType } from '../design-system/reminders/types';
import type { ReminderPriority } from '../design-system/reminders/types';
import type { ReminderStatus } from '../design-system/reminders/types';
import { NotificationType, NotificationTiming, RepeatPattern, SubTask } from '../design-system/reminders/types';

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
  type: ReminderType;
  priority: ReminderPriority;
  status: ReminderStatus;
  dueDate?: Date | string;
  dueTime?: string;
  // Event-specific fields for start and end times
  startDate?: Date | string;
  startTime?: string;
  endDate?: Date | string;
  endTime?: string;
  location?: string;
  isFavorite?: boolean;
  isRecurring?: boolean;
  repeatPattern?: string;
  customInterval?: number;
  hasNotification?: boolean;
  notificationTimings?: NotificationTiming[];
  assignedTo?: string[]; // Changed from string to string[] to support multiple assignments
  assignedBy?: string; // Track who assigned this reminder
  tags?: string[];
  completed?: boolean;
  deletedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Family sharing fields
  sharedWithFamily?: boolean; // Whether this reminder is shared with family
  sharedForEditing?: boolean; // Whether family members can edit this reminder
  familyId?: string; // Which family this reminder belongs to
  repeatDays?: number[]; // Days of week for custom weekly patterns (0=Sunday, 1=Monday, ...)
  customFrequencyType?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Frequency type for custom patterns
  // Recurring reminder date range
  recurringStartDate?: Date | string; // When recurring reminders should start
  recurringEndDate?: Date | string; // When recurring reminders should stop (optional)
  recurringEndAfter?: number; // Number of occurrences before ending (optional)
  recurringGroupId?: string; // ID to group related recurring reminders together
  // Task chunking fields - ADHD-friendly feature
  isChunked?: boolean; // Indicates if this task has been broken down into sub-tasks
  subTasks?: SubTask[]; // Array of sub-tasks
  parentTaskId?: string; // ID of parent task (for sub-tasks)
  chunkedProgress?: number; // Progress percentage (0-100) for chunked tasks
  // Co-ownership fields - multiple users can own and manage the same reminder
  coOwners?: string[]; // Array of user IDs who can manage this reminder (creator + assigned users)
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
  // Support both old familyId and new permissions system during migration
  familyId?: string | null; // Legacy field - will be deprecated
  permissions?: {
    owner: string; // userId who created the list
    sharedWith: string[]; // array of userIds who can see/edit
    sharedFamilies?: string[]; // optional: familyIds for family-wide sharing
    canEdit: string[]; // array of userIds who can edit (subset of sharedWith)
    canDelete: string[]; // array of userIds who can delete (usually just owner)
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Countdown {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  targetTime?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  color?: string;
  emoji?: string;
  category?: string;
  isImportant?: boolean;
  notificationEnabled?: boolean;
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
  console.error(`Firebase error in ${operation}:`, error);

  if (isPermissionDeniedError(error)) {
    console.error(`Permission denied for ${operation}`);
    return true; // Return true to indicate this is a handled error
  } else if (isCollectionNotFoundError(error)) {
    console.error(`Collection not found for ${operation}`);
    return true; // Return true to indicate this is a handled error
  } else {
    console.error(`Unhandled Firebase error for ${operation}:`, error);
    return false; // Return false to let the calling function handle it
  }
};

// Check if Firebase is properly initialized
let isFirebaseInitialized = false;
let firebaseInitPromise: Promise<boolean> | null = null;
let firebasePermissionDenied = false;

// Helper function to check if Firestore is available
const checkFirestoreAvailability = (): boolean => {
  try {
    // Remove platform restriction - allow Firebase on both iOS and Android
    const firestoreInstance = firestore();
    if (!firestoreInstance) {
      return false;
    }

    // Test if we can create a collection reference
    const testRef = firestoreInstance.collection('_test');
    if (!testRef) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Firestore availability check failed:', error);
    return false;
  }
};

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeFirebase = async (): Promise<boolean> => {
  if (isFirebaseInitialized) {
    console.log('Firebase already initialized');
    return true;
  }

  if (firebaseInitPromise) {
    console.log('Firebase initialization already in progress');
    return firebaseInitPromise;
  }

  console.log('Starting Firebase initialization...');
  firebaseInitPromise = new Promise(async (resolve) => {
    try {

      // Try multiple times with delays to wait for native module to be ready
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`Firebase initialization attempt ${attempt}/5`);
        try {

          // Check if Firestore is available
          if (!checkFirestoreAvailability()) {
            console.log(`Firestore not available on attempt ${attempt}`);
            if (attempt < 5) {
              await wait(1000); // Wait 1 second before retry
              continue;
            }
            console.log('Firebase initialization failed after 5 attempts');
            isFirebaseInitialized = false;
            resolve(false);
            return;
          }

          console.log('Firestore is available, testing connection...');

          // Try a simple operation to test if Firestore is working
          try {
            const firestoreInstance = firestore();
            const testRef = firestoreInstance.collection('_test_connection');
            console.log('Firebase connection test successful');

            isFirebaseInitialized = true;
            console.log('Firebase initialized successfully');
            resolve(true);
            return;
          } catch (nativeError) {
            console.error(`Native error on attempt ${attempt}:`, nativeError);
            if (attempt < 5) {
              await wait(1000); // Wait 1 second before retry
              continue;
            }
            isFirebaseInitialized = false;
            resolve(false);
            return;
          }
        } catch (error) {
          console.error(`Error on attempt ${attempt}:`, error);
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
      console.log('All Firebase initialization attempts failed');
      isFirebaseInitialized = false;
      resolve(false);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      isFirebaseInitialized = false;
      resolve(false);
    }
  });

  return firebaseInitPromise;
};

// Helper function to get Firestore instance
// Cache the Firestore instance to reduce repeated calls
let cachedFirestoreInstance: any = null;
let lastInstanceCheck = 0;
const INSTANCE_CACHE_DURATION = 30 * 1000; // 30 seconds

export const getFirestoreInstance = () => {
  const now = Date.now();

  // Return cached instance if it's still valid
  if (cachedFirestoreInstance && (now - lastInstanceCheck) < INSTANCE_CACHE_DURATION) {
    return cachedFirestoreInstance;
  }

  try {
    console.log('Getting Firestore instance...');
    const firestoreInstance = firestore();
    if (!firestoreInstance) {
      console.error('Firestore instance is null');
      throw new Error('Firestore not initialized');
    }
    console.log('Firestore instance obtained successfully');

    // Cache the instance
    cachedFirestoreInstance = firestoreInstance;
    lastInstanceCheck = now;

    return firestoreInstance;
  } catch (error) {
    console.error('Error getting Firestore instance:', error);
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
    const isInitialized = await initializeFirebase();
    if (!isInitialized) {
      return;
    }


    // Try to create the profile, if it fails due to collection issues, retry once
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const firestoreInstance = getFirestoreInstance();
        const userRef = firestoreInstance.collection('users').doc(userId);

        await userRef.set(profileData, { merge: true });
        return;
      } catch (error) {

        // If this is the first attempt and it's a collection error, try again
        if (attempt === 0 && error instanceof Error && error.message && error.message.includes('collection')) {
          continue; // Try again
        }

        // If we get here, either it's the second attempt or a different error
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
      // If it's a collection doesn't exist error, return null
      if (error instanceof Error && error.message && error.message.includes('collection')) {
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
      console.log('[FirebaseService] Creating reminder in Firestore:', {
        title: reminderData.title,
        isRecurring: reminderData.isRecurring,
        repeatPattern: reminderData.repeatPattern,
        dueDate: reminderData.dueDate,
        recurringEndDate: reminderData.recurringEndDate,
        userId: reminderData.userId
      });

      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc();
      const reminderId = reminderRef.id;


      // Generate recurring group ID for recurring reminders
      let recurringGroupId: string | undefined;
      if (reminderData.isRecurring) {
        recurringGroupId = reminderId; // Use the first reminder's ID as the group ID
      }

      // Create co-owners array - include the creator and all assigned users
      const coOwners = [reminderData.userId]; // Creator is always a co-owner
      if (reminderData.assignedTo && reminderData.assignedTo.length > 0) {
        // Add assigned users as co-owners (they can trigger notifications and manage the reminder)
        coOwners.push(...reminderData.assignedTo.filter(userId => userId !== reminderData.userId));
      }

      const newReminder: Reminder = {
        ...reminderData,
        id: reminderId,
        recurringGroupId,
        coOwners: coOwners, // Add co-owners field
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await reminderRef.set(removeUndefinedFields(newReminder) as any);

      console.log('[FirebaseService] Reminder created successfully:', {
        id: reminderId,
        isRecurring: newReminder.isRecurring,
        recurringGroupId: newReminder.recurringGroupId
      });

      // Create family activity if this is a family-related reminder
      if (reminderData.familyId && reminderData.sharedWithFamily) {
        try {
          // Get user's family member info
          const familyMembers = await this.getFamilyMembers(reminderData.familyId);
          const userMember = familyMembers.find(m => m.userId === reminderData.userId);

          if (userMember) {
            // Filter out undefined values from metadata to prevent Firestore errors
            const cleanMetadata: any = {};
            if (reminderId) {cleanMetadata.reminderId = reminderId;}
            if (reminderData.title) {cleanMetadata.reminderTitle = reminderData.title;}
            if (reminderData.type) {cleanMetadata.reminderType = reminderData.type;}
            if (reminderData.assignedTo && reminderData.assignedTo.length > 0) {cleanMetadata.assignedTo = reminderData.assignedTo;}
            if (reminderData.priority) {cleanMetadata.priority = reminderData.priority;}

            await this.createFamilyActivity({
              familyId: reminderData.familyId,
              type: 'reminder_created',
              title: 'New Family Reminder',
              description: `${userMember.name} created: "${reminderData.title}"`,
              memberId: reminderData.userId,
              memberName: userMember.name,
              metadata: cleanMetadata,
            });
          } else {
          }
        } catch (activityError) {
          // Don't throw here - the reminder was created successfully
        }
      }

      // Always schedule a default notification at the due time, even if no custom timings are set
      try {
        // Check if notification service is available
        if (!notificationService) {
          return reminderId;
        }

        // Convert reminder to notification service format
        const notificationReminder = {
          id: newReminder.id,
          title: newReminder.title,
          description: newReminder.description,
          dueDate: newReminder.dueDate instanceof Date ? newReminder.dueDate.toISOString() : newReminder.dueDate,
          dueTime: newReminder.dueTime,
          completed: newReminder.completed,
          priority: newReminder.priority,
          assignedTo: newReminder.assignedTo,
          createdBy: newReminder.assignedBy,
          userId: newReminder.userId,
          familyId: newReminder.familyId,
          type: newReminder.type,
          status: newReminder.status,
          coOwners: newReminder.coOwners, // Include co-owners for notification scheduling
          createdAt: newReminder.createdAt instanceof Date ? newReminder.createdAt.toISOString() : newReminder.createdAt,
          updatedAt: newReminder.updatedAt instanceof Date ? newReminder.updatedAt.toISOString() : newReminder.updatedAt,
          notificationTimings: newReminder.notificationTimings?.map(timing => ({
            type: timing.type,
            value: timing.value,
            label: timing.label || `${timing.value} minutes ${timing.type === 'before' ? 'before' : timing.type === 'after' ? 'after' : 'at'}`,
          })),
        };

        // Schedule notifications for all co-owners (creator + assigned users)
        // Each co-owner will receive notifications about the reminder
        console.log('[FirebaseService] Scheduling notifications for reminder:', {
          id: newReminder.id,
          title: newReminder.title,
          dueDate: newReminder.dueDate,
          isRecurring: newReminder.isRecurring,
          notificationTimings: newReminder.notificationTimings
        });
        await notificationService.scheduleReminderNotifications(notificationReminder);

        // Send assignment notifications if reminder is assigned to other users
        if (reminderData.assignedTo && reminderData.assignedTo.length > 0) {
          try {
            // Get the assigned by user's display name
            const assignedByUserDoc = await firestoreInstance.collection('users').doc(reminderData.userId).get();
            const assignedByUserData = assignedByUserDoc.data();
            const assignedByDisplayName = assignedByUserData?.displayName || reminderData.assignedBy || 'Unknown';

            // Note: Assignment notifications are now handled through family notifications only

            // Add family notification for assignment if this is a family reminder
            if (reminderData.familyId) {
              await addFamilyNotification({
                familyId: reminderData.familyId,
                type: 'task_assigned',
                reminderId,
                assignedTo: reminderData.assignedTo,
                createdBy: reminderData.userId,
                message: `${assignedByDisplayName} assigned "${reminderData.title}" to family members`,
                assignedByDisplayName,
                reminderTitle: reminderData.title,
              });
            }

            // Note: Assignment timestamps are now handled by the Cloud Function
            // when taskAssignments documents are created, so we don't need to
            // store them separately here
          } catch (assignmentError) {
            console.error('Assignment notification error:', assignmentError);
            // Don't throw here - the reminder was created successfully
          }
        }
      } catch (notificationError) {
        console.log('Notification scheduling failed:', {
          error: notificationError,
          reminderId: reminderId || 'unknown',
          reminderData: {
            title: reminderData.title,
            dueDate: reminderData.dueDate,
            dueTime: reminderData.dueTime,
          },
        });
        // Don't throw here - the reminder was created successfully, just notification scheduling failed
      }

      return reminderId;
    } catch (error) {
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
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
        });
      });

      return reminders;
    } catch (error) {
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
          const startIndex = page * limit;
          const endIndex = startIndex + limit;
          const paginatedReminders = cached.slice(startIndex, endIndex);

          return {
            reminders: paginatedReminders,
            hasMore: endIndex < cached.length,
            totalCount: cached.length,
          };
        }
      }

      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');

      // Get user's family membership to check permissions
      const familyMembers = await this.getFamilyMembers(familyId);
      const userMember = familyMembers.find((m: FamilyMember) => m.userId === userId);

      if (!userMember) {
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
              deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
            });
          }
        });
      } catch (error) {
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
              ...doc.data(),
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
              deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
            });
          }
        });
      } catch (error) {
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
                  deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
                });
              }
            });
          } catch (error) {
          }
        }
      }

      // Sort by updatedAt
      const sortedReminders = allReminders.sort((a, b) => {
        const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt as string).getTime();
        const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt as string).getTime();
        return bTime - aTime;
      });

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
        totalCount: sortedReminders.length,
      };

    } catch (error) {
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
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
        });
      });

      // Sort by deletedAt and limit
      return reminders
        .sort((a, b) => {
          const aTime = a.deletedAt instanceof Date ? a.deletedAt.getTime() : new Date(a.deletedAt as string).getTime();
          const bTime = b.deletedAt instanceof Date ? b.deletedAt.getTime() : new Date(b.deletedAt as string).getTime();
          return bTime - aTime;
        })
        .slice(0, limit);
    } catch (error) {
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

          // Skip deleted reminders
          if (data.deletedAt) {
            return;
          }

          reminders.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate).toISOString() : undefined,
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
          });
        });

        // Real-time listener updated
        callback(reminders);
      }, (error) => {
        // Return empty array on error to trigger refetch
        callback([]);
      });
    } catch (error) {
      // Return a no-op unsubscribe function
      return () => {};
    }
  },

  // Real-time listener for family reminders (all reminders that affect the user)
  onFamilyRemindersChange(userId: string, familyId: string, callback: (reminders: Reminder[]) => void) {
    try {
      const firestoreInstance = getFirestoreInstance();
      const remindersRef = firestoreInstance.collection('reminders');

      // Listen to reminders assigned to this user
      const assignedQuery = remindersRef
        .where('assignedTo', 'array-contains', userId)
        .orderBy('createdAt', 'desc');

      // Listen to family-shared reminders
      const familyQuery = remindersRef
        .where('sharedWithFamily', '==', true)
        .where('familyId', '==', familyId)
        .orderBy('createdAt', 'desc');

      let assignedReminders: Reminder[] = [];
      let familyReminders: Reminder[] = [];

      const assignedUnsubscribe = assignedQuery.onSnapshot((snapshot) => {
        assignedReminders = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;

          // Skip deleted reminders
          if (data.deletedAt) {
            return;
          }

          assignedReminders.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate).toISOString() : undefined,
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
          });
        });

        updateCombinedReminders();
      }, (error) => {
        assignedReminders = [];
        updateCombinedReminders();
      });

      const familyUnsubscribe = familyQuery.onSnapshot((snapshot) => {
        familyReminders = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as any;

          // Skip deleted reminders and user's own reminders
          if (data.deletedAt || data.userId === userId) {
            return;
          }

          familyReminders.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            dueDate: data.dueDate ? convertTimestamp(data.dueDate).toISOString() : undefined,
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
          });
        });

        updateCombinedReminders();
      }, (error) => {
        familyReminders = [];
        updateCombinedReminders();
      });

      const updateCombinedReminders = () => {
        // Combine and deduplicate reminders
        const allReminders = [...assignedReminders, ...familyReminders];
        const uniqueReminders = allReminders.filter((reminder, index, self) =>
          index === self.findIndex(r => r.id === reminder.id)
        );

        callback(uniqueReminders);
      };

      // Return cleanup function
      return () => {
        assignedUnsubscribe();
        familyUnsubscribe();
      };
    } catch (error) {
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
        return null;
      }

      const data = doc.data();
      if (!data) {
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

      return reminder;
    } catch (error) {
      if (handleFirebaseError(error, 'getReminderById')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot get reminder.');
    }
  },

  // Update a reminder
  async updateReminder(reminderId: string, updates: Partial<Reminder>): Promise<void> {
    try {
      console.log('[reminderService] Editing reminder:', reminderId, updates);
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);

      // Get the current reminder to check if it's recurring
      const currentReminder = await reminderRef.get();
      const currentData = currentReminder.data() as Reminder;

      // Check if assignments changed
      const oldAssignedTo = currentData.assignedTo || [];
      const newAssignedTo = updates.assignedTo || [];
      const assignmentsChanged = JSON.stringify(oldAssignedTo.sort()) !== JSON.stringify(newAssignedTo.sort());

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

      // Handle assignment changes
      if (assignmentsChanged && newAssignedTo.length > 0) {
        try {
          // Get the assigned by user's display name
          const assignedByUserId = updates.assignedBy || currentData.assignedBy || currentData.userId;
          const assignedByUserDoc = await firestoreInstance.collection('users').doc(assignedByUserId).get();
          const assignedByUserData = assignedByUserDoc.data();
          const assignedByDisplayName = assignedByUserData?.displayName || 'Unknown';

          // Note: Assignment notifications are now handled through family notifications only

          // Add family notification for assignment if this is a family reminder
          if (currentData.familyId) {
            await addFamilyNotification({
              familyId: currentData.familyId,
              type: 'task_assigned',
              reminderId,
              assignedTo: newAssignedTo,
              createdBy: assignedByUserId,
              message: `${assignedByDisplayName} assigned "${currentData.title}" to family members`,
              assignedByDisplayName,
              reminderTitle: currentData.title,
            });
          }

          // Note: Assignment timestamps are now handled by the Cloud Function
          // when taskAssignments documents are created, so we don't need to
          // store them separately here
        } catch (assignmentError) {
          console.error('Assignment notification error:', assignmentError);
          // Don't throw here - the reminder was updated successfully
        }
      }

      // Always update notifications for any edit
      const updatedReminder = { ...currentData, ...updates, updatedAt: new Date() };
      try {
        // Convert reminder to notification service format
        const notificationUpdatedReminder = {
          id: updatedReminder.id,
          title: updatedReminder.title,
          description: updatedReminder.description,
          dueDate: updatedReminder.dueDate instanceof Date ? updatedReminder.dueDate.toISOString() : updatedReminder.dueDate,
          dueTime: updatedReminder.dueTime,
          completed: updatedReminder.completed,
          priority: updatedReminder.priority,
          assignedTo: updatedReminder.assignedTo,
          createdBy: updatedReminder.assignedBy,
          userId: updatedReminder.userId,
          familyId: updatedReminder.familyId,
          type: updatedReminder.type,
          status: updatedReminder.status,
          createdAt: updatedReminder.createdAt instanceof Date ? updatedReminder.createdAt.toISOString() : updatedReminder.createdAt,
          updatedAt: updatedReminder.updatedAt instanceof Date ? updatedReminder.updatedAt.toISOString() : updatedReminder.updatedAt,
          notificationTimings: updatedReminder.notificationTimings?.map(timing => ({
            type: timing.type,
            value: timing.value,
            label: timing.label || `${timing.value} minutes ${timing.type === 'before' ? 'before' : timing.type === 'after' ? 'after' : 'at'}`,
          })),
        };
        await notificationService.updateReminderNotifications(notificationUpdatedReminder);
      } catch (notificationError) {
        // Don't throw here - the reminder was updated successfully, just notification update failed
      }
    } catch (error) {
      throw error;
    }
  },

  // Utility: Update/cancel a single occurrence notification for recurring reminders
  async updateOccurrenceNotification(reminderId: string, occurrenceDate: Date, updates: Partial<Reminder>): Promise<void> {
    try {
      // Cancel the notification for this occurrence
      try {
        await notificationService.cancelReminderNotifications(reminderId);
      } catch (notificationError) {
      }
      // Optionally, reschedule if needed
      if (updates) {
        const firestoreInstance = getFirestoreInstance();
        const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
        const currentReminder = await reminderRef.get();
        const currentData = currentReminder.data() as Reminder;
        const updatedReminder = { ...currentData, ...updates, updatedAt: new Date() };
        try {
          await notificationService.scheduleReminderNotifications(updatedReminder);
        } catch (notificationError) {
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // Handle recurring reminder logic
  async handleRecurringReminder(reminder: Reminder): Promise<void> {
    try {
      // Helper to safely cast repeatPattern
      const normalizeRepeatPattern = (pattern: string | undefined): RepeatPattern | undefined => {
        if (!pattern) {return undefined;}
        const allowed: RepeatPattern[] = [
          RepeatPattern.DAILY,
          RepeatPattern.WEEKDAYS,
          RepeatPattern.WEEKLY,
          RepeatPattern.MONTHLY,
          RepeatPattern.YEARLY,
          RepeatPattern.FIRST_MONDAY,
          RepeatPattern.LAST_FRIDAY,
          RepeatPattern.CUSTOM,
        ];
        return allowed.includes(pattern as RepeatPattern) ? (pattern as RepeatPattern) : undefined;
      };

      const extendedReminder = {
        ...reminder,
        dueDate: reminder.dueDate instanceof Date ? reminder.dueDate : reminder.dueDate ? new Date(reminder.dueDate) : undefined,
        startDate: reminder.startDate instanceof Date ? reminder.startDate : reminder.startDate ? new Date(reminder.startDate) : undefined,
        endDate: reminder.endDate instanceof Date ? reminder.endDate : reminder.endDate ? new Date(reminder.endDate) : undefined,
        recurringStartDate: reminder.recurringStartDate instanceof Date ? reminder.recurringStartDate : reminder.recurringStartDate ? new Date(reminder.recurringStartDate) : undefined,
        recurringEndDate: reminder.recurringEndDate instanceof Date ? reminder.recurringEndDate : reminder.recurringEndDate ? new Date(reminder.recurringEndDate) : undefined,
        createdAt: reminder.createdAt instanceof Date ? reminder.createdAt : reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
        updatedAt: reminder.updatedAt instanceof Date ? reminder.updatedAt : reminder.updatedAt ? new Date(reminder.updatedAt) : new Date(),
        repeatPattern: normalizeRepeatPattern(reminder.repeatPattern),
        deletedAt: reminder.deletedAt instanceof Date ? reminder.deletedAt : reminder.deletedAt ? new Date(reminder.deletedAt) : undefined,
      };
      const nextOccurrence = generateNextOccurrence(extendedReminder);
      if (nextOccurrence) {

        // Check if we've reached the end conditions
        let shouldCreateNext = true;

        // Check recurring end date
        if (reminder.recurringEndDate && nextOccurrence.dueDate && nextOccurrence.dueDate > reminder.recurringEndDate) {
          shouldCreateNext = false;
        }

        // Check recurring end after count
        if (reminder.recurringEndAfter) {
          // Count existing occurrences in this recurring group
          const existingOccurrences = await this.getRecurringGroupReminders(reminder.recurringGroupId || reminder.id);
          const completedCount = existingOccurrences.filter(r => r.completed).length;


          if (completedCount >= reminder.recurringEndAfter) {
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
        } else {
        }
      } else {
      }
    } catch (error) {
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
        return;
      }

      reminderService.lastRecurringCheckTime[userId] = now;

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Recurring reminder check timeout')), 10000); // 10 second timeout
      });

      const checkPromise = this.performRecurringReminderCheck(userId, now);

      await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
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
              }

              // Check if we've recently processed this recurring reminder (within last 10 minutes)
              const reminderKey = `${reminder.id}-${recurringGroupId}`;
              const lastProcessed = reminderService.recentlyProcessedRecurring[reminderKey] || 0;
              const timeSinceLastProcessed = now - lastProcessed;

              if (timeSinceLastProcessed < 10 * 60 * 1000) {
                if (__DEV__) {
                }
                // Track skipped processing for analytics
                this.trackRecurringReminderEvent('skipped_recently_processed', {
                  reminderId: reminder.id,
                  timeSinceLastProcessed: Math.round(timeSinceLastProcessed / 1000),
                  title: reminder.title,
                });
              } else if (!hasFutureOccurrence) {
                if (__DEV__) {
                }
                reminderService.recentlyProcessedRecurring[reminderKey] = now;
                await this.handleRecurringReminder(reminder);

                // Track successful generation for analytics
                this.trackRecurringReminderEvent('generated_overdue', {
                  reminderId: reminder.id,
                  title: reminder.title,
                  groupSize: allGroupReminders.length,
                });
              } else {
                if (__DEV__) {
                }
                // Track skipped due to future occurrence for analytics
                this.trackRecurringReminderEvent('skipped_future_exists', {
                  reminderId: reminder.id,
                  title: reminder.title,
                  groupSize: allGroupReminders.length,
                });
              }
            } else {
              if (__DEV__) {
              }
            }
          }
        } catch (groupError) {
          // Continue with other groups even if one fails
        }
      }

      if (__DEV__) {
      }
    } catch (error) {
    }
  },

  // Track recurring reminder events for analytics
  trackRecurringReminderEvent(eventType: string, metadata: any): void {
    // Analytics tracking removed to fix Firebase issues
    if (__DEV__) {
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
            deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
          } as Reminder);
        }
      });

      return reminders;
    } catch (error) {
      throw error;
    }
  },

  // Delete all reminders in a recurring group
  async deleteRecurringGroup(recurringGroupId: string): Promise<void> {
    try {
      console.log('[reminderService] Deleting recurring group:', recurringGroupId);
      const reminders = await this.getRecurringGroupReminders(recurringGroupId);

              // Cancel notifications for all reminders in the group
        for (const reminder of reminders) {
          try {
            await notificationService.cancelReminderNotifications(reminder.id);
          } catch (notificationError) {
            console.error(`[ReminderService] Error cancelling notifications for reminder ${reminder.id}:`, notificationError);
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
    } catch (error) {
      throw error;
    }
  },

  // Delete a single occurrence of a recurring reminder
  async deleteRecurringOccurrence(reminderId: string): Promise<void> {
    try {
      console.log('[reminderService] Deleting recurring occurrence:', reminderId);
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);

      // Cancel notifications for this specific reminder
      try {
        await notificationService.cancelReminderNotifications(reminderId);
      } catch (notificationError) {
        console.error(`[ReminderService] Error cancelling notifications for reminder ${reminderId}:`, notificationError);
      }

      // Soft delete just this occurrence
      await reminderRef.update({
        status: 'cancelled',
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      throw error;
    }
  },

  // Soft delete a reminder (move to trash)
  async deleteReminder(reminderId: string): Promise<void> {
    try {
      console.log('[reminderService] Deleting reminder:', reminderId);
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

        // Cancel all notifications for this reminder using comprehensive cleanup
        try {
          // Cleanup is now handled by the notification service
          await notificationService.cancelReminderNotifications(reminderId);

          console.log(`[ReminderService] Successfully cleaned up notifications for reminder ${reminderId}`);
        } catch (notificationError) {
          console.error(`[ReminderService] Error cancelling notifications for reminder ${reminderId}:`, notificationError);
          // Don't throw here - the reminder was deleted successfully, just notification cancellation failed
        }

        // Clean up assignment records and scheduled notifications for this reminder
        try {
          await this.cleanupReminderNotifications(reminderId);
        } catch (cleanupError) {
          console.error('Error cleaning up reminder notifications:', cleanupError);
          // Don't throw here - the reminder was deleted successfully, just cleanup failed
        }
      }

    } catch (error) {
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
    } catch (error) {
      throw error;
    }
  },

  // Permanently delete a reminder (hard delete)
  async permanentDeleteReminder(reminderId: string): Promise<void> {
    try {
      console.log('[reminderService] Permanently deleting reminder:', reminderId);
      const firestoreInstance = getFirestoreInstance();
      const reminderRef = firestoreInstance.collection('reminders').doc(reminderId);
      await reminderRef.delete();

      // Cancel all notifications for this reminder
      try {
        await notificationService.cancelReminderNotifications(reminderId);
      } catch (notificationError) {
        console.error(`[ReminderService] Error cancelling notifications for reminder ${reminderId}:`, notificationError);
        // Don't throw here - the reminder was deleted successfully, just notification cancellation failed
      }

      // Clean up assignment records and scheduled notifications for this reminder
      try {
        await this.cleanupReminderNotifications(reminderId);
      } catch (cleanupError) {
        console.error('Error cleaning up reminder notifications:', cleanupError);
        // Don't throw here - the reminder was deleted successfully, just cleanup failed
      }

    } catch (error) {
      throw error;
    }
  },

  // Clean up assignment records and scheduled notifications for a deleted reminder
  async cleanupReminderNotifications(reminderId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();

      // 1. Delete task assignment records
      const assignmentsQuery = await firestoreInstance
        .collection('taskAssignments')
        .where('reminderId', '==', reminderId)
        .get();

      if (!assignmentsQuery.empty) {
        const batch = firestoreInstance.batch();
        assignmentsQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`[ReminderService] Cleaned up ${assignmentsQuery.docs.length} task assignment records for reminder ${reminderId}`);
      }

      // 2. Delete scheduled notifications
      const scheduledQuery = await firestoreInstance
        .collection('scheduledNotifications')
        .where('reminderId', '==', reminderId)
        .get();

      if (!scheduledQuery.empty) {
        const batch = firestoreInstance.batch();
        scheduledQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`[ReminderService] Cleaned up ${scheduledQuery.docs.length} scheduled notifications for reminder ${reminderId}`);
      }

      // 3. Delete pending FCM notifications
      const fcmQuery = await firestoreInstance
        .collection('fcmNotifications')
        .where('data.reminderId', '==', reminderId)
        .where('status', '==', 'pending')
        .get();

      if (!fcmQuery.empty) {
        const batch = firestoreInstance.batch();
        fcmQuery.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`[ReminderService] Cleaned up ${fcmQuery.docs.length} pending FCM notifications for reminder ${reminderId}`);
      }

    } catch (error) {
      console.error(`[ReminderService] Error cleaning up notifications for reminder ${reminderId}:`, error);
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
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
        });
      });

      return reminders;
    } catch (error) {
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
          deletedAt: data.deletedAt ? convertTimestamp(data.deletedAt).toISOString() : undefined,
        });
      });

      return reminders;
    } catch (error) {
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
        familyId: value.familyId,
      })),
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

      if (!familyMembers || familyMembers.length === 0) {
        return this.getUserReminders(userId);
      }

      // Get user's own reminders
      const userReminders = await this.getUserReminders(userId);

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
              ...doc.data(),
            } as Reminder))
          : [];
      } catch (error) {
        // Error handled by caller
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
            ...doc.data(),
          } as Reminder))
          .filter(reminder => reminder.userId !== userId); // Filter out user's own
      } catch (error) {
        // Error handled by caller
      }

      // Combine all reminders and remove duplicates
      const allReminders = [...userReminders, ...assignedReminders, ...familyReminders];
      const uniqueReminders = allReminders.filter((reminder, index, self) =>
        index === self.findIndex(r => r.id === reminder.id)
      );

      return uniqueReminders;
    } catch (error) {
      throw error;
    }
  },

  // Get reminders for a specific family member (with error handling)
  async getRemindersForFamilyMember(memberId: string): Promise<Reminder[]> {
    try {
              const firestoreInstance = getFirestoreInstance();
        const memberQuery = firestoreInstance
          .collection('reminders')
          .where('userId', '==', memberId);

        const memberSnapshot = await memberQuery.get();
        const memberReminders = memberSnapshot && !memberSnapshot.empty
          ? memberSnapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data(),
            } as Reminder))
          : [];

        return memberReminders;

      } catch (error) {
        // Return empty array instead of throwing
        return [];
      }
  },

  // Export user data for privacy compliance
  async exportUserData(userId: string): Promise<any> {
    try {

      const firestoreInstance = getFirestoreInstance();

      // Get user profile
      const userDoc = await firestoreInstance.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Get user reminders
      const remindersQuery = firestoreInstance
        .collection('reminders')
        .where('userId', '==', userId);
      const remindersSnapshot = await remindersQuery.get();
      const reminders = remindersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get family data
      const familyQuery = firestoreInstance
        .collection('familyMembers')
        .where('userId', '==', userId);
      const familySnapshot = await familyQuery.get();
      const familyData = familySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get family activities
      const activitiesQuery = firestoreInstance
        .collection('familyActivities')
        .where('memberId', '==', userId);
      const activitiesSnapshot = await activitiesQuery.get();
      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        userProfile: userData,
        reminders: reminders,
        familyMemberships: familyData,
        familyActivities: activities,
        exportVersion: '1.0',
      };

      return exportData;

    } catch (error) {
      throw new Error('Failed to export user data');
    }
  },

  // Delete user account and all associated data
  async deleteUserAccount(userId: string): Promise<void> {
    try {

      const firestoreInstance = getFirestoreInstance();
      const batch = firestoreInstance.batch();

      // Delete user reminders
      const remindersQuery = firestoreInstance
        .collection('reminders')
        .where('userId', '==', userId);
      const remindersSnapshot = await remindersQuery.get();
      remindersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete family memberships
      const familyQuery = firestoreInstance
        .collection('familyMembers')
        .where('userId', '==', userId);
      const familySnapshot = await familyQuery.get();
      familySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete family activities
      const activitiesQuery = firestoreInstance
        .collection('familyActivities')
        .where('memberId', '==', userId);
      const activitiesSnapshot = await activitiesQuery.get();
      activitiesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user profile
      const userRef = firestoreInstance.collection('users').doc(userId);
      batch.delete(userRef);

      // Commit the batch
      await batch.commit();


    } catch (error) {
      throw new Error('Failed to delete user account');
    }
  },

  // Get reminders assigned to a user (with error handling)
  async getAssignedReminders(userId: string): Promise<Reminder[]> {
    try {

      const firestoreInstance = getFirestoreInstance();
      const assignedQuery = firestoreInstance
        .collection('reminders')
        .where('assignedTo', 'array-contains', userId)
        .where('userId', '!=', userId); // Exclude user's own reminders

      const assignedSnapshot = await assignedQuery.get();
      const assignedReminders = assignedSnapshot && !assignedSnapshot.empty
        ? assignedSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
          } as Reminder))
        : [];

      return assignedReminders;

    } catch (error) {
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get family members with error handling
  async getFamilyMembers(familyId?: string): Promise<FamilyMember[]> {
    try {
      if (!familyId) {
        return [];
      }

      // Use the new getValidFamilyMembers function to filter out invalid users
      return await getValidFamilyMembers(familyId);

    } catch (error) {
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
        return null;
      }

      if (memberQuery.empty) {
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
        return null;
      }

      const familyId = mostRecentMember.familyId;

      const familyDoc = await firestoreInstance
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        return null;
      }

      const data = familyDoc.data();
      if (!data) {
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

              // Family retrieved successfully
      return family;
    } catch (error) {
      return null;
    }
  },

  // Add family member (simplified version)
  async addFamilyMember(memberData: Omit<FamilyMember, 'id' | 'joinedAt' | 'lastActive' | 'isOnline'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) {throw new Error('No user ID available');}


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

      return memberId;
    } catch (error) {
      throw error;
    }
  },

  // Remove family member (simplified version)
  async removeFamilyMember(memberId: string, familyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();


      await firestoreInstance.collection('familyMembers').doc(memberId).delete();

    } catch (error) {
      throw error;
    }
  },

  // Create family activity (simplified version)
  async createFamilyActivity(activityData: Omit<FamilyActivity, 'id' | 'createdAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();


      const docRef = firestoreInstance.collection('familyActivities').doc();
      const activityId = docRef.id;

      const activity: FamilyActivity = {
        id: activityId,
        ...activityData,
        createdAt: new Date(),
      };

      await docRef.set(activity);

      return activityId;
    } catch (error) {
      throw error;
    }
  },

  // Get family activities (simplified version)
  async getFamilyActivities(familyId: string, limit: number = 50): Promise<FamilyActivity[]> {
    try {
      const firestoreInstance = getFirestoreInstance();

              // Getting family activities

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
            return;
          }

          // Convert timestamp with error handling
          let createdAt: Date;
          try {
            createdAt = convertTimestamp(data.createdAt);
            if (isNaN(createdAt.getTime())) {
              createdAt = new Date(); // Fallback to current time
            }
          } catch (timestampError) {
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
          // Continue with other activities instead of failing completely
        }
      });

              // Retrieved family activities
      return activities;
    } catch (error) {
      return [];
    }
  },

  // Create family (simplified version)
  async createFamily(familyData: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;
      if (!userId) {throw new Error('No user ID available');}


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

      return familyId;
    } catch (error) {
      throw error;
    }
  },

  // Create default family if needed (simplified version)
  async createDefaultFamilyIfNeeded(userId: string, userName: string, userEmail: string): Promise<Family | null> {
          try {
        // First check if user already has a family
        const existingFamily = await this.getUserFamily(userId);
        if (existingFamily) {
          return existingFamily;
        }

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

        // Return the newly created family
        return await this.getUserFamily(userId);
      } catch (error) {
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
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
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
                    return;
                  }

                  // Convert timestamp with error handling
                  let createdAt: Date;
                  try {
                    createdAt = convertTimestamp(data.createdAt);
                    if (isNaN(createdAt.getTime())) {
                      createdAt = new Date(); // Fallback to current time
                    }
                  } catch (timestampError) {
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
                  // Continue with other activities instead of failing completely
                }
              });
            }

            callback(activities);
          },
          (error) => {
            // Return empty array on error
            callback([]);
          }
        );

      return unsubscribe;
    } catch (error) {
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

              // Retrieved pending invitations
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


      await firestoreInstance.collection('familyInvitations').doc(invitationId).update({
        status: 'declined',
        declinedAt: new Date(),
      });

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


      const docRef = firestoreInstance.collection('countdowns').doc(countdownData.id);
      await docRef.set({
        ...countdownData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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


      // Check if user is authenticated
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (currentUser.uid !== userId) {
        console.log('User ID mismatch:', {
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

      return countdowns;
    } catch (error: any) {

      // Log specific error details for debugging
      if (error.code) {
      }
      if (error.message) {
      }

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        throw new Error('Firebase permission denied. Cannot get countdowns.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('User not authenticated. Please sign in again.');
      } else if (error.code === 'not-found') {
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


      await firestoreInstance.collection('countdowns').doc(countdownData.id).update({
        ...countdownData,
        updatedAt: new Date(),
      });

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
        callback(countdowns);
      }, (error) => {
        callback([]);
      });
    } catch (error) {
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
          } else {
            throw new Error('User is not in a family. Cannot share with family.');
          }
        } catch (error) {
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

      // Create family activity if sharing with family
      if (permissions.sharedWithFamily && userFamilyId) {
        try {
          // Filter out undefined values from metadata
          const cleanMetadata: any = {};
          if (listId) {cleanMetadata.listId = listId;}
          if (list.name) {cleanMetadata.listName = list.name;}
          if (permissions.isPrivate !== undefined) {cleanMetadata.isPrivate = permissions.isPrivate;}

          await reminderService.createFamilyActivity({
            familyId: userFamilyId,
            type: 'reminder_shared',
            title: 'List Shared with Family',
            description: `Shared list "${list.name}" with family`,
            memberId: userId,
            memberName: auth().currentUser?.displayName || 'Family Member',
            metadata: cleanMetadata,
          });
        } catch (activityError) {
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

      // Check new permissions system first
      if (list.permissions) {
        const permissions = list.permissions;

        // Check if user is in sharedWith array
        if (permissions.sharedWith && permissions.sharedWith.includes(userId)) {
          const canEdit = permissions.canEdit && permissions.canEdit.includes(userId);
          const canDelete = permissions.canDelete && permissions.canDelete.includes(userId);
          return { canView: true, canEdit, canDelete };
        }

        // Check if user's family is in sharedFamilies array
        if (permissions.sharedFamilies && permissions.sharedFamilies.length > 0) {
          try {
            const userFamily = await reminderService.getUserFamily(userId);
            if (userFamily && permissions.sharedFamilies.includes(userFamily.id)) {
              return { canView: true, canEdit: false, canDelete: false };
            }
          } catch (error) {
          }
        }
      }

      // Legacy support: check old familyId field
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
        }
      }

      return { canView: false, canEdit: false, canDelete: false, reason: 'No permission' };
    } catch (error) {
      return { canView: false, canEdit: false, canDelete: false, reason: 'Error checking permission' };
    }
  },

  // Update a list's familyId (for fixing shared lists)
  async updateListFamilyId(listId: string, newFamilyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();


      await firestoreInstance.collection('lists').doc(listId).update({
        familyId: newFamilyId,
        updatedAt: new Date(),
      });

    } catch (error) {
      if (handleFirebaseError(error, 'updateListFamilyId')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update list familyId.');
    }
  },

  // Share list with specific users
  async shareListWithUsers(listId: string, userIds: string[], canEdit: boolean = false): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if user has permission to share this list
      const permission = await this.checkListPermission(listId, userId);
      if (!permission.canEdit && !permission.canDelete) {
        throw new Error('You do not have permission to share this list');
      }


      const listDoc = await firestoreInstance.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new Error('List not found');
      }

      const listData = listDoc.data();
      const currentPermissions = listData?.permissions || {
        owner: listData?.createdBy || userId,
        sharedWith: [],
        sharedFamilies: [],
        canEdit: [],
        canDelete: [listData?.createdBy || userId],
      };

      // Add new users to sharedWith
      const updatedSharedWith = [...new Set([...currentPermissions.sharedWith, ...userIds])];

      // Add to canEdit if requested
      let updatedCanEdit = [...currentPermissions.canEdit];
      if (canEdit) {
        updatedCanEdit = [...new Set([...updatedCanEdit, ...userIds])];
      }

      await firestoreInstance.collection('lists').doc(listId).update({
        permissions: {
          ...currentPermissions,
          sharedWith: updatedSharedWith,
          canEdit: updatedCanEdit,
        },
        updatedAt: new Date(),
      });

    } catch (error) {
      if (handleFirebaseError(error, 'shareListWithUsers')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot share list with users.');
    }
  },

  // Share list with a family
  async shareListWithFamily(listId: string, familyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if user has permission to share this list
      const permission = await this.checkListPermission(listId, userId);
      if (!permission.canEdit && !permission.canDelete) {
        throw new Error('You do not have permission to share this list');
      }


      const listDoc = await firestoreInstance.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new Error('List not found');
      }

      const listData = listDoc.data();
      const currentPermissions = listData?.permissions || {
        owner: listData?.createdBy || userId,
        sharedWith: [],
        sharedFamilies: [],
        canEdit: [],
        canDelete: [listData?.createdBy || userId],
      };

      // Add family to sharedFamilies
      const updatedSharedFamilies = [...new Set([...currentPermissions.sharedFamilies, familyId])];

      await firestoreInstance.collection('lists').doc(listId).update({
        permissions: {
          ...currentPermissions,
          sharedFamilies: updatedSharedFamilies,
        },
        updatedAt: new Date(),
      });

    } catch (error) {
      if (handleFirebaseError(error, 'shareListWithFamily')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot share list with family.');
    }
  },

  // Remove user access to a list
  async removeUserFromList(listId: string, userIdToRemove: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();
      const userId = auth().currentUser?.uid;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check if user has permission to modify this list
      const permission = await this.checkListPermission(listId, userId);
      if (!permission.canEdit && !permission.canDelete) {
        throw new Error('You do not have permission to modify this list');
      }


      const listDoc = await firestoreInstance.collection('lists').doc(listId).get();
      if (!listDoc.exists) {
        throw new Error('List not found');
      }

      const listData = listDoc.data();
      const currentPermissions = listData?.permissions;

      if (!currentPermissions) {
        throw new Error('List does not use new permissions system');
      }

      // Remove user from all permission arrays
      const updatedSharedWith = currentPermissions.sharedWith.filter((id: string) => id !== userIdToRemove);
      const updatedCanEdit = currentPermissions.canEdit.filter((id: string) => id !== userIdToRemove);
      const updatedCanDelete = currentPermissions.canDelete.filter((id: string) => id !== userIdToRemove);

      await firestoreInstance.collection('lists').doc(listId).update({
        permissions: {
          ...currentPermissions,
          sharedWith: updatedSharedWith,
          canEdit: updatedCanEdit,
          canDelete: updatedCanDelete,
        },
        updatedAt: new Date(),
      });

    } catch (error) {
      if (handleFirebaseError(error, 'removeUserFromList')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot remove user from list.');
    }
  },
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


      // Get user's family to set proper familyId
      let userFamilyId: string | null = null;
      try {
        const userFamily = await reminderService.getUserFamily(userId);
        if (userFamily) {
          userFamilyId = userFamily.id;
        }
      } catch (error) {
      }

      // Create permissions object for the new list
      const permissions = {
        owner: userId,
        sharedWith: [],
        sharedFamilies: userFamilyId ? [userFamilyId] : [],
        canEdit: [],
        canDelete: [userId], // Only owner can delete
      };

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
        familyId: shouldShareWithFamily ? userFamilyId : null, // Legacy support
        permissions: shouldShareWithFamily ? permissions : undefined,
        createdBy: listData.createdBy || userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanListData = removeUndefinedFields(list);

      const docRef = await firestoreInstance.collection('lists').add(cleanListData);

      // Create family activity if shared with family
      if (shouldShareWithFamily && userFamilyId) {
        try {
          // Filter out undefined values from metadata
          const cleanMetadata: any = {};
          if (docRef.id) {cleanMetadata.listId = docRef.id;}
          if (listData.name) {cleanMetadata.listName = listData.name;}
          if (listData.isPrivate !== undefined) {cleanMetadata.isPrivate = listData.isPrivate;}

          await reminderService.createFamilyActivity({
            familyId: userFamilyId,
            type: 'reminder_created',
            title: 'New Family List',
            description: `Created a new shared list: "${listData.name}"`,
            memberId: userId,
            memberName: auth().currentUser?.displayName || 'Family Member',
            metadata: cleanMetadata,
          });
        } catch (activityError) {
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


      // First, get user's family to check for shared lists
      let userFamilyId: string | null = null;
      try {
        // Use reminderService to get user family since it has the method
        const userFamily = await reminderService.getUserFamily(userId);
        if (userFamily) {
          userFamilyId = userFamily.id;
        }
      } catch (error) {
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
        }
      }

      // Sort all lists by updatedAt (most recent first)
      lists.sort((a, b) => {
        const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt as string).getTime();
        const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt as string).getTime();
        return bTime - aTime;
      });

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


      const doc = await firestoreInstance.collection('lists').doc(listId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
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


      // Filter out undefined values to avoid Firestore errors
      const cleanUpdates = removeUndefinedFields(updates);

      const updateData = {
        ...cleanUpdates,
        updatedAt: new Date(),
      };

      await firestoreInstance.collection('lists').doc(listId).update(updateData);
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


      await firestoreInstance.collection('lists').doc(listId).delete();
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
      console.log('Adding item to list:', { listId, itemData });
      const firestoreInstance = getFirestoreInstance();

      const item: ListItem = {
        ...itemData,
        id: firestoreInstance.collection('_temp').doc().id, // Generate ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanItem = removeUndefinedFields(item);
      console.log('Clean item data:', cleanItem);

      const listRef = firestoreInstance.collection('lists').doc(listId);
      console.log('Updating list document:', listId);

      await listRef.update({
        items: firestore.FieldValue.arrayUnion(cleanItem),
        updatedAt: new Date(),
      });

      console.log('Item added successfully with ID:', item.id);
      return item.id;
    } catch (error) {
      console.error('Error in addListItem:', error);
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
        all.sort((a, b) => {
          const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt as string).getTime();
          const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt as string).getTime();
          return bTime - aTime;
        });
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
                } else {
                }
              });
              update();
            }, (error) => {
            });
        } else {
        }
      }).catch(error => {
      });

      // Return unsubscribe function
      return () => {
        if (unsubUser) {unsubUser();}
        if (unsubFamily) {unsubFamily();}
      };
    } catch (error) {
      if (handleFirebaseError(error, 'onUserListsChange')) {
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
                callback(list);
              }
            } else {
              // Call callback with null to indicate list was deleted
              callback(null as any);
            }
          },
          (error) => {
            if (handleFirebaseError(error, 'onListChange')) {
            }
            // Call callback with empty data on error to trigger refetch
            callback(null as any);
          }
        );

      return unsubscribe;
    } catch (error) {
      if (handleFirebaseError(error, 'onListChange')) {
      }
      // Return a no-op function
      return () => {};
    }
  },

  // Update a list's familyId (for fixing shared lists)
  async updateListFamilyId(listId: string, newFamilyId: string): Promise<void> {
    try {
      const firestoreInstance = getFirestoreInstance();


      await firestoreInstance.collection('lists').doc(listId).update({
        familyId: newFamilyId,
        updatedAt: new Date(),
      });

    } catch (error) {
      if (handleFirebaseError(error, 'updateListFamilyId')) {
        throw error;
      }
      throw new Error('Firebase permission denied. Cannot update list familyId.');
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
    familyId,
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
        familyId: value.familyId,
      })),
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

    // Filter out undefined values to prevent Firestore errors
    const cleanNotification: any = {
      id: notificationId,
      familyId: notification.familyId,
      type: notification.type,
      createdBy: notification.createdBy,
      message: notification.message,
      createdAt: notification.createdAt || now,
    };

    // Only add optional fields if they have values
    if (notification.reminderId) {
      cleanNotification.reminderId = notification.reminderId;
    }
    if (notification.assignedTo && notification.assignedTo.length > 0) {
      cleanNotification.assignedTo = notification.assignedTo;
    }

    // Add any additional fields from the notification object
    Object.entries(notification).forEach(([key, value]) => {
      if (value !== undefined &&
          !['familyId', 'type', 'reminderId', 'assignedTo', 'createdBy', 'createdAt', 'message'].includes(key)) {
        cleanNotification[key] = value;
      }
    });

    await docRef.set(cleanNotification);
    return notificationId;
  } catch (error) {
    throw error;
  }
}

// Cache for valid family members to reduce Firestore calls
const validFamilyMembersCache = new Map<string, { members: FamilyMember[]; timestamp: number }>();
const VALID_MEMBERS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (increased from 2 minutes)

// Get only valid family members (whose userId exists in users collection)
export async function getValidFamilyMembers(familyId: string) {
  // Check cache first
  const cached = validFamilyMembersCache.get(familyId);
  if (cached && Date.now() - cached.timestamp < VALID_MEMBERS_CACHE_DURATION) {
    console.log(`[getValidFamilyMembers] Returning cached members for family ${familyId}`);
    return cached.members;
  }

  console.log(`[getValidFamilyMembers] Fetching members for family ${familyId}`);
  const firestoreInstance = getFirestoreInstance();

  try {
    const membersSnapshot = await firestoreInstance
      .collection('familyMembers')
      .where('familyId', '==', familyId)
      .get();

    const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember));

    // Filter out members without userId and cache the result
    const validMembers = members.filter(member => member.userId && member.userId.trim() !== '');

    console.log(`[getValidFamilyMembers] Found ${validMembers.length} valid members out of ${members.length} total for family ${familyId}`);

    // Cache the result
    validFamilyMembersCache.set(familyId, {
      members: validMembers,
      timestamp: Date.now(),
    });

    return validMembers;
  } catch (error) {
    console.error(`[getValidFamilyMembers] Error fetching family members for ${familyId}:`, error);
    // Return empty array on error to prevent app crashes
    return [];
  }
}

// Function to clear family members cache (useful for testing or when family data changes)
export function clearFamilyMembersCache(familyId?: string) {
  if (familyId) {
    validFamilyMembersCache.delete(familyId);
    console.log(`[clearFamilyMembersCache] Cleared cache for family ${familyId}`);
  } else {
    validFamilyMembersCache.clear();
    console.log('[clearFamilyMembersCache] Cleared all family members cache');
  }
}

export default firebaseService;

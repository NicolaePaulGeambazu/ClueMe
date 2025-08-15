import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { reminderService, Reminder as FirebaseReminder, FamilyMember, addFamilyNotification } from '../services/firebaseService';
import notificationService from '../services/notificationService';
import globalNotificationService from '../services/globalNotificationService';
import { useAuth } from './AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useFamily } from './FamilyContext';
import { measurePerformance, performanceMonitor } from '../utils/performanceUtils';
import analyticsService from '../services/analyticsService';
import { cleanReminderForFirestore, filterReminders } from '../utils/reminderUtils';
import { ReminderStatus, ReminderPriority } from '../design-system/reminders/types';
import { userUsageService } from '../services/userUsageService';

// Convert Firebase reminder to a simpler format for the UI
const convertToUIReminder = (firebaseReminder: FirebaseReminder) => {
  // Skip deleted reminders
  if (firebaseReminder.deletedAt) {
    return null;
  }

  // Helper function to safely convert date to ISO string
  const safeDateToISO = (date: any): string | undefined => {
    if (!date) {return undefined;}
    try {
      // Handle Firestore Timestamp objects
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toISOString();
      }
      // Handle Date objects
      if (date instanceof Date) {
        return date.toISOString();
      }
      // Handle string dates
      if (typeof date === 'string') {
        return new Date(date).toISOString();
      }
      // Handle timestamp numbers
      if (typeof date === 'number') {
        return new Date(date).toISOString();
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  };

  return {
    id: firebaseReminder.id,
    userId: firebaseReminder.userId,
    title: firebaseReminder.title,
    description: firebaseReminder.description || '',
    type: firebaseReminder.type === 'reminder' ? 'task' : firebaseReminder.type,
    priority: firebaseReminder.priority,
    dueDate: safeDateToISO(firebaseReminder.dueDate),
    dueTime: firebaseReminder.dueTime || '',
    location: firebaseReminder.location || '',
    completed: firebaseReminder.status === 'completed' || firebaseReminder.completed || false,
    isFavorite: firebaseReminder.isFavorite || false,
    isRecurring: firebaseReminder.isRecurring || false,
    repeatPattern: firebaseReminder.repeatPattern,
    customInterval: firebaseReminder.customInterval,
    repeatDays: firebaseReminder.repeatDays || [],
    recurringStartDate: safeDateToISO(firebaseReminder.recurringStartDate),
    recurringEndDate: safeDateToISO(firebaseReminder.recurringEndDate),
    recurringEndAfter: firebaseReminder.recurringEndAfter,
    customFrequencyType: firebaseReminder.customFrequencyType,
    hasNotification: firebaseReminder.hasNotification || false,
    notificationTimings: firebaseReminder.notificationTimings,
    assignedTo: firebaseReminder.assignedTo || [],
    tags: firebaseReminder.tags || [],
    createdAt: safeDateToISO(firebaseReminder.createdAt),
    updatedAt: safeDateToISO(firebaseReminder.updatedAt),
  };
};

// Debounce function to prevent excessive updates
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
};

interface ReminderContextType {
  reminders: any[];
  isLoading: boolean;
  isInitialized: boolean;
  isDataFullyLoaded: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  stats: {
    total: number;
    pending: number;
    favorites: number;
    overdue: number;
  };
  loadReminders: (page?: number, useCache?: boolean) => Promise<void>;
  loadMoreReminders: () => Promise<void>;
  refreshReminders: () => Promise<void>;
  createReminder: (reminderData: Omit<FirebaseReminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReminder: (reminderId: string, updates: Partial<FirebaseReminder>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  toggleReminderCompletion: (reminderId: string) => Promise<void>;
  toggleFavorite: (reminderId: string) => Promise<void>;
  getRemindersByType: (type: string) => Promise<any[]>;
  getRemindersByPriority: (priority: string) => Promise<any[]>;
  getFavoriteReminders: () => Promise<any[]>;
  getOverdueReminders: () => Promise<any[]>;
  checkRecurringReminders: () => Promise<void>;
  useFirebase: boolean;
  getPerformanceStats: () => any;
  getPerformanceRecommendations: () => any;
  clearPerformanceMetrics: () => void;
  clearReminders: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminderContext = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminderContext must be used within a ReminderProvider');
  }
  return context;
};

interface ReminderProviderProps {
  children: React.ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { family } = useFamily();
  const { notifyTaskCreated, notifyTaskAssigned } = useNotifications();

  // State management
  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDataFullyLoaded, setIsDataFullyLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  // Refs for cleanup and optimization
  const unsubscribeRef = useRef<null | (() => void)>(null);
  const lastUpdateRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced update function to prevent excessive re-renders
  const debouncedSetReminders = useCallback(
    debounce((newReminders: any[]) => {
      setReminders(newReminders);
    }, 300), // Increased from 100ms to 300ms for more stability
    []
  );

  // Optimized reminder update function
  const updateRemindersOptimized = useCallback((newReminders: any[]) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // If updates are too frequent, debounce them
    if (timeSinceLastUpdate < 300) { // Increased from 100ms to 300ms
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        debouncedSetReminders(newReminders);
        lastUpdateRef.current = Date.now();
      }, 300); // Increased from 100ms to 300ms
    } else {
      // Direct update if enough time has passed
      debouncedSetReminders(newReminders);
      lastUpdateRef.current = now;
    }
  }, [debouncedSetReminders]);

  const loadReminders = useCallback(async (page: number = 0, useCache: boolean = true) => {
    if (!user || authLoading) {return;}

    try {
      // Only show loading on initial load or manual refresh
      if (page === 0 && !isInitialized) {
        setIsLoading(true);
      }
      setError(null);

      let result;
      let cacheHit = false;

      // If user is in a family, load family reminders with proper permissions
      if (family) {
        // Check cache first
        if (useCache) {
          const cached = reminderService.getCacheStats();
          const cacheKey = `${user.uid}_${family.id}`;
          cacheHit = cached.cacheKeys.includes(cacheKey);
        }

        // Use getRemindersWithFamilyPermissions to get all reminders the user should see
        const allReminders = await measurePerformance(
          () => reminderService.getRemindersWithFamilyPermissions(user.uid, family.id),
          family.memberCount
        );

        const uiReminders = allReminders.map(convertToUIReminder).filter(Boolean);

        // Simple pagination for now (can be enhanced later)
        const pageSize = 50;
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const pageReminders = uiReminders.slice(startIndex, endIndex);

        if (page === 0) {
          updateRemindersOptimized(pageReminders);
          // Schedule notifications for assigned tasks on initial load
          scheduleNotificationsForAssignedTasks(pageReminders);
        } else {
          setReminders(prev => [...prev, ...pageReminders]);
        }

        setHasMore(endIndex < uiReminders.length);
        setTotalCount(uiReminders.length);
        setCurrentPage(page);
      } else {
        // Fallback to user's own reminders only
        const firebaseReminders = await measurePerformance(
          () => reminderService.getUserReminders(user.uid),
          1
        );
        const uiReminders = firebaseReminders.map(convertToUIReminder).filter(Boolean);
        updateRemindersOptimized(uiReminders);

        // Schedule notifications for assigned tasks on initial load
        scheduleNotificationsForAssignedTasks(uiReminders);

        setHasMore(false);
        setTotalCount(uiReminders.length);
        setCurrentPage(0);
      }

      setIsInitialized(true);

      // Set a timeout to mark data as fully loaded after all background operations complete
      setTimeout(() => {
        setIsDataFullyLoaded(true);
      }, 2000); // 2 second delay to allow all async operations to complete
    } catch (err) {
      setError('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, family, isInitialized, updateRemindersOptimized]);

  // Load more reminders (for pagination)
  const loadMoreReminders = useCallback(async () => {
    if (!hasMore || isLoading) {return;}

    await loadReminders(currentPage + 1, false); // Don't use cache for pagination
  }, [hasMore, isLoading, currentPage, loadReminders]);

  // Refresh reminders (clear cache and reload)
  const refreshReminders = useCallback(async () => {
    if (!user) {return;}

    try {
      setIsLoading(true);
      setError(null);

      // Clear cache and force fresh data
      reminderService.clearReminderCache(user.uid);
      await loadReminders(0, false);
    } catch (error) {
      setError('Failed to refresh reminders');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadReminders]);

  const createReminder = useCallback(async (reminderData: Omit<FirebaseReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      // UI layer should check usage limits and show paywall before calling this
      // Add family context if user is in a family
      const reminderWithFamily = {
        ...reminderData,
        familyId: family?.id,
        sharedWithFamily: family ? true : false,
      };

      const reminderId = await reminderService.createReminder(reminderWithFamily);

      // Increment usage count after successful creation (do not throw if fails)
      try {
        await userUsageService.incrementReminderCount(user.uid);
      } catch (usageError) {
        console.warn('[ReminderContext] Failed to increment reminder count:', usageError);
      }

      // Notify family members if reminder is shared
      if (family && reminderWithFamily.sharedWithFamily) {
        await addFamilyNotification({
          familyId: family.id,
          type: 'reminder_created',
          reminderId,
          createdBy: user.uid,
          message: `New reminder created: ${reminderData.title}`,
        });
      }

      return reminderId;
    } catch (error) {
      throw error;
    }
  }, [user, family, notifyTaskAssigned]);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<FirebaseReminder>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, updates);
    } catch (error) {
      throw error;
    }
  }, [user]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.deleteReminder(reminderId);
    } catch (error) {
      throw error;
    }
  }, [user]);

  const toggleReminderCompletion = useCallback(async (reminderId: string) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {return;}

      const newStatus = reminder.completed ? ReminderStatus.PENDING : ReminderStatus.COMPLETED;
      await reminderService.updateReminder(reminderId, { status: newStatus });
    } catch (error) {
      throw error;
    }
  }, [user, reminders]);

  const toggleFavorite = useCallback(async (reminderId: string) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) {return;}

      await reminderService.updateReminder(reminderId, { isFavorite: !reminder.isFavorite });
    } catch (error) {
      throw error;
    }
  }, [user, reminders]);

  // Set up real-time listeners with optimization
  useEffect(() => {
    if (!user || authLoading) {return;}

    let unsubscribe: (() => void) | null = null;

    try {
      if (family) {
        // Family mode: Listen to both user and family reminders
        let userReminders: any[] = [];
        let familyReminders: any[] = [];

        // Listen to user's own reminders
        const userUnsubscribe = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
          try {
            userReminders = firebaseReminders.map(convertToUIReminder).filter(Boolean);
            // Debounce the update to prevent rapid fluctuations
            setTimeout(() => {
              updateCombinedReminders();
              setIsLoading(false);
            }, 100);
          } catch (error) {
            // Silent fallback - don't trigger full reload
          }
        });

        // Listen to family reminders (assigned and shared)
        const familyRemindersUnsubscribe = reminderService.onFamilyRemindersChange(user.uid, family.id, (firebaseReminders) => {
          try {
            const previousFamilyReminders = [...familyReminders];
            familyReminders = firebaseReminders.map(convertToUIReminder).filter(Boolean);

            // Check for new assignments in real-time
            checkForNewAssignments(previousFamilyReminders, familyReminders);

            // Debounce the update to prevent rapid fluctuations
            setTimeout(() => {
              updateCombinedReminders();
              setIsLoading(false);
            }, 100);
          } catch (error) {
            // Silent fallback - don't trigger full reload
          }
        });

        // Function to combine and update reminders
        const updateCombinedReminders = () => {
          // Combine user and family reminders
          const allReminders = [...userReminders, ...familyReminders];

          // Remove duplicates based on ID
          const uniqueReminders = allReminders.filter((reminder, index, self) =>
            index === self.findIndex(r => r.id === reminder.id)
          );

          // Only update if there are actual changes
          updateRemindersOptimized(uniqueReminders);

          // Schedule notifications for assigned tasks
          scheduleNotificationsForAssignedTasks(uniqueReminders);
        };

        // Listen to family members changes to refetch when family structure changes
        const familyUnsubscribe = reminderService.onFamilyMembersChange(family.id, (newMembers) => {
          // Debounced reload to prevent excessive updates
          setTimeout(() => loadReminders(0, false), 500);
        });

        // Listen to family activities to refetch when family activities change
        const activitiesUnsubscribe = reminderService.onFamilyActivitiesChange(family.id, (newActivities) => {
          // Debounced reload to prevent excessive updates
          setTimeout(() => loadReminders(0, false), 500);
        });

        unsubscribe = () => {
          userUnsubscribe();
          familyRemindersUnsubscribe();
          familyUnsubscribe();
          activitiesUnsubscribe();
        };
      } else {
        // Use optimized real-time listener for user's own reminders
        let previousUserReminders: any[] = [];
        unsubscribe = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
          try {
            const uiReminders = firebaseReminders.map(convertToUIReminder).filter(Boolean);

            // Check for new assignments in real-time
            checkForNewAssignments(previousUserReminders, uiReminders);

            // Debounce the update to prevent rapid fluctuations
            setTimeout(() => {
              updateRemindersOptimized(uiReminders);

              // Schedule notifications for assigned tasks
              scheduleNotificationsForAssignedTasks(uiReminders);

              // Update previous reminders for next comparison
              previousUserReminders = [...uiReminders];

              setIsLoading(false);
            }, 100);
          } catch (error) {
            // Silent fallback - don't trigger full reload
          }
        });
      }

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = null;
        }
      };
    } catch (error) {
      // Fallback to manual loading
      loadReminders();
    }
  }, [user, authLoading, family, loadReminders, updateRemindersOptimized]);

  // Load reminders when user changes (but only if not already initialized)
  useEffect(() => {
    if (user && !authLoading && !isInitialized) {
      loadReminders();
    }
  }, [user, authLoading, isInitialized, loadReminders]);

  const getRemindersByType = useCallback(async (type: string) => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByType(user.uid, type as any);
      return firebaseReminders.map(convertToUIReminder).filter(Boolean);
    } catch (err) {
      return [];
    }
  }, [user]);

  const getRemindersByPriority = useCallback(async (priority: string) => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByPriority(user.uid, priority as any);
      return firebaseReminders.map(convertToUIReminder).filter(Boolean);
    } catch (err) {
      return [];
    }
  }, [user]);

  const getFavoriteReminders = useCallback(async () => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByPriority(user.uid, ReminderPriority.HIGH);
      return firebaseReminders.map(convertToUIReminder).filter(Boolean);
    } catch (err) {
      return [];
    }
  }, [user]);

  // Check and generate recurring reminders
  const checkRecurringReminders = useCallback(async () => {
    if (!user) {return;}

    try {
      await reminderService.checkAndGenerateRecurringReminders(user.uid);
      // Don't reload reminders here - let the real-time listener handle it
    } catch (err) {
      // Silent error
    }
  }, [user]);

  // Schedule notifications for tasks assigned to the current user
  const scheduleNotificationsForAssignedTasks = useCallback(async (allReminders: any[]) => {
    if (!user) {return;}

    try {
      console.log(`[ReminderContext] Checking for assigned tasks to schedule notifications for user: ${user.uid}`);

      // Find reminders that are assigned to the current user
      const assignedReminders = allReminders.filter(reminder =>
        reminder.assignedTo &&
        reminder.assignedTo.includes(user.uid) &&
        reminder.userId !== user.uid // Exclude user's own reminders
      );

      console.log(`[ReminderContext] Found ${assignedReminders.length} tasks assigned to current user`);

      // Schedule notifications for each assigned task
      for (const reminder of assignedReminders) {
        try {
          // Convert to notification service format
          const notificationReminder = {
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            dueDate: reminder.dueDate,
            dueTime: reminder.dueTime,
            completed: reminder.completed,
            priority: reminder.priority,
            assignedTo: reminder.assignedTo,
            createdBy: reminder.userId, // Original creator
            userId: reminder.userId, // Original creator
            familyId: reminder.familyId,
            type: reminder.type,
            status: reminder.status,
            createdAt: reminder.createdAt,
            updatedAt: reminder.updatedAt,
            notificationTimings: reminder.notificationTimings || [
              { type: 'before', value: 15, label: '15 minutes before' },
            ],
            isRecurring: reminder.isRecurring,
            repeatPattern: reminder.repeatPattern,
            recurringStartDate: reminder.recurringStartDate,
            recurringEndDate: reminder.recurringEndDate,
          };

          // Schedule notifications for this assigned task
          await notificationService.scheduleReminderNotifications(notificationReminder);

          console.log(`[ReminderContext] Scheduled notifications for assigned task: ${reminder.id}`);
        } catch (error) {
          console.error(`[ReminderContext] Error scheduling notifications for assigned task ${reminder.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[ReminderContext] Error in scheduleNotificationsForAssignedTasks:', error);
    }
  }, [user]);

  // Check for new assignments in real-time and schedule notifications immediately
  const checkForNewAssignments = useCallback(async (previousReminders: any[], currentReminders: any[]) => {
    if (!user) {return;}

    try {
      console.log('[ReminderContext] Checking for assignment changes in real-time');

      // Find reminders that were previously assigned to the current user
      const previousAssignedIds = new Set(
        previousReminders
          .filter(reminder =>
            reminder.assignedTo &&
            reminder.assignedTo.includes(user.uid) &&
            reminder.userId !== user.uid
          )
          .map(reminder => reminder.id)
      );

      const currentAssignedReminders = currentReminders.filter(reminder =>
        reminder.assignedTo &&
        reminder.assignedTo.includes(user.uid) &&
        reminder.userId !== user.uid
      );

      const currentAssignedIds = new Set(currentAssignedReminders.map(reminder => reminder.id));

      // Find newly assigned reminders
      const newAssignments = currentAssignedReminders.filter(reminder =>
        !previousAssignedIds.has(reminder.id)
      );

      // Find removed assignments
      const removedAssignments = Array.from(previousAssignedIds).filter(id =>
        !currentAssignedIds.has(id)
      );

      // Handle new assignments
      if (newAssignments.length > 0) {
        console.log(`[ReminderContext] Found ${newAssignments.length} new assignments in real-time`);

        // Schedule notifications for new assignments immediately
        for (const reminder of newAssignments) {
          try {
            console.log(`[ReminderContext] Scheduling notifications for new assignment: ${reminder.id} - ${reminder.title}`);

            // Convert to notification service format
            const notificationReminder = {
              id: reminder.id,
              title: reminder.title,
              description: reminder.description,
              dueDate: reminder.dueDate,
              dueTime: reminder.dueTime,
              completed: reminder.completed,
              priority: reminder.priority,
              assignedTo: reminder.assignedTo,
              createdBy: reminder.userId, // Original creator
              userId: reminder.userId, // Original creator
              familyId: reminder.familyId,
              type: reminder.type,
              status: reminder.status,
              createdAt: reminder.createdAt,
              updatedAt: reminder.updatedAt,
              notificationTimings: reminder.notificationTimings || [
                { type: 'before', value: 15, label: '15 minutes before' },
              ],
              isRecurring: reminder.isRecurring,
              repeatPattern: reminder.repeatPattern,
              recurringStartDate: reminder.recurringStartDate,
              recurringEndDate: reminder.recurringEndDate,
            };

            // Schedule notifications for this newly assigned task
            await notificationService.scheduleReminderNotifications(notificationReminder);

            console.log(`[ReminderContext] Successfully scheduled notifications for new assignment: ${reminder.id}`);
          } catch (error) {
            console.error(`[ReminderContext] Error scheduling notifications for new assignment ${reminder.id}:`, error);
          }
        }
      }

      // Handle removed assignments
      if (removedAssignments.length > 0) {
        console.log(`[ReminderContext] Found ${removedAssignments.length} removed assignments in real-time`);

        // Cancel notifications for removed assignments
        for (const reminderId of removedAssignments) {
          try {
            console.log(`[ReminderContext] Canceling notifications for removed assignment: ${reminderId}`);
            await notificationService.cancelReminderNotifications(reminderId);
            console.log(`[ReminderContext] Successfully canceled notifications for removed assignment: ${reminderId}`);
          } catch (error) {
            console.error(`[ReminderContext] Error canceling notifications for removed assignment ${reminderId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[ReminderContext] Error in checkForNewAssignments:', error);
    }
  }, [user]);

  const getOverdueReminders = useCallback(async () => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getUserReminders(user.uid);
      const uiReminders = firebaseReminders.map(convertToUIReminder).filter(Boolean);
      const today = new Date().toISOString().split('T')[0];
      return uiReminders.filter(r => r && r.dueDate && r.dueDate < today && !r.completed);
    } catch (err) {
      return [];
    }
  }, [user]);

  // Clear all reminders and reset state
  const clearReminders = useCallback(() => {
    setReminders([]);
    setIsInitialized(false);
    setIsDataFullyLoaded(false);
    setError(null);
    setHasMore(false);
    setTotalCount(0);
    setCurrentPage(0);
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  // Memoized stats calculation to prevent rapid fluctuations
  const stats = useMemo(() => {
    // Show loading state until all data is fully loaded
    if (!reminders || !isInitialized || !isDataFullyLoaded) {
      return { total: 0, pending: 0, favorites: 0, overdue: 0 };
    }

    return {
      total: reminders.length,
      pending: filterReminders.byCompleted(reminders, false).length,
      favorites: filterReminders.byFavorite(reminders).length,
      overdue: filterReminders.byOverdue(reminders).length,
    };
  }, [reminders, isInitialized, isDataFullyLoaded]);

  const contextValue: ReminderContextType = {
    reminders,
    isLoading,
    isInitialized,
    isDataFullyLoaded,
    error,
    hasMore,
    totalCount,
    currentPage,
    stats,
    loadReminders,
    loadMoreReminders,
    refreshReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleReminderCompletion,
    toggleFavorite,
    getRemindersByType,
    getRemindersByPriority,
    getFavoriteReminders,
    getOverdueReminders,
    checkRecurringReminders,
    useFirebase: true,
    // Performance monitoring
    getPerformanceStats: () => performanceMonitor.getStats(),
    getPerformanceRecommendations: () => performanceMonitor.getRecommendations(),
    clearPerformanceMetrics: () => performanceMonitor.clear(),
    clearReminders, // <-- Add to context
  };

  return (
    <ReminderContext.Provider value={contextValue}>
      {children}
    </ReminderContext.Provider>
  );
};

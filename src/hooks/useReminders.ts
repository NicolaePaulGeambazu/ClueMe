import { useState, useEffect, useCallback, useRef } from 'react';
import { reminderService, Reminder as FirebaseReminder, FamilyMember, addFamilyNotification } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './useNotifications';
import { useFamily } from './useFamily';
import { measurePerformance, performanceMonitor } from '../utils/performanceUtils';

// Convert Firebase reminder to a simpler format for the UI
const convertToUIReminder = (firebaseReminder: FirebaseReminder) => ({
  id: firebaseReminder.id,
  userId: firebaseReminder.userId,
  title: firebaseReminder.title,
  description: firebaseReminder.description || '',
  type: firebaseReminder.type === 'reminder' ? 'task' : firebaseReminder.type,
  priority: firebaseReminder.priority,
  dueDate: firebaseReminder.dueDate ? firebaseReminder.dueDate.toISOString() : undefined,
  dueTime: firebaseReminder.dueTime || '',
  location: firebaseReminder.location || '',
  completed: firebaseReminder.status === 'completed' || firebaseReminder.completed || false,
  isFavorite: firebaseReminder.isFavorite || false,
  isRecurring: firebaseReminder.isRecurring || false,
  repeatPattern: firebaseReminder.repeatPattern,
  customInterval: firebaseReminder.customInterval,
  repeatDays: firebaseReminder.repeatDays || [],
  recurringStartDate: firebaseReminder.recurringStartDate,
  recurringEndDate: firebaseReminder.recurringEndDate,
  recurringEndAfter: firebaseReminder.recurringEndAfter,
  customFrequencyType: firebaseReminder.customFrequencyType,
  hasNotification: firebaseReminder.hasNotification || false,
  notificationTimings: firebaseReminder.notificationTimings,
  assignedTo: firebaseReminder.assignedTo || [],
  tags: firebaseReminder.tags || [],
  createdAt: firebaseReminder.createdAt.toISOString(),
  updatedAt: firebaseReminder.updatedAt.toISOString(),
});

export const useReminders = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { family } = useFamily();
  const { notifyTaskCreated, notifyTaskAssigned } = useNotifications();
  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const unsubscribeRef = useRef<null | (() => void)>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadReminders = useCallback(async (page: number = 0, useCache: boolean = true) => {
    if (!user || authLoading) {return;}

    try {
      setIsLoading(true);
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
        
        result = await measurePerformance(
          () => reminderService.getFamilyReminders(user.uid, family.id, 50, page, useCache),
          family.memberCount
        );
        
        const uiReminders = result.reminders.map(convertToUIReminder);
        
        if (page === 0) {
          setReminders(uiReminders);
        } else {
          setReminders(prev => [...prev, ...uiReminders]);
        }
        
        setHasMore(result.hasMore);
        setTotalCount(result.totalCount);
        setCurrentPage(page);
      } else {
        // Fallback to user's own reminders only
        console.log('👤 Loading user reminders only...');
        const firebaseReminders = await measurePerformance(
          () => reminderService.getUserReminders(user.uid),
          1
        );
        const uiReminders = firebaseReminders.map(convertToUIReminder);
        setReminders(uiReminders);
        setHasMore(false);
        setTotalCount(uiReminders.length);
        setCurrentPage(0);
      }
    } catch (err) {
      setError('Failed to load reminders');
      console.error('Error loading reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, family]);

  // Load more reminders (for pagination)
  const loadMoreReminders = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    await loadReminders(currentPage + 1, false); // Don't use cache for pagination
  }, [hasMore, isLoading, currentPage, loadReminders]);

  // Refresh reminders (clear cache and reload)
  const refreshReminders = useCallback(async () => {
    // Clear cache for this user
    reminderService.clearReminderCache(user?.uid);
    await loadReminders(0, false);
  }, [user?.uid, loadReminders]);

  const createReminder = useCallback(async (reminderData: Omit<FirebaseReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      if (__DEV__) {
        console.log('🔄 Starting reminder creation...', { title: reminderData.title });
      }
      
      // Add family context if user is in a family
      const reminderWithFamily = {
        ...reminderData,
        assignedBy: reminderData.assignedTo && reminderData.assignedTo.length > 0 ? user.uid : undefined,
        familyId: family?.id,
        sharedWithFamily: !!(family && reminderData.assignedTo && reminderData.assignedTo.length > 0),
        sharedForEditing: !!(family && reminderData.assignedTo && reminderData.assignedTo.length > 0),
      };

      const id = await reminderService.createReminder(reminderWithFamily);
      
      // Clear cache to ensure fresh data
      reminderService.clearReminderCache(user.uid);
      
      // Trigger refetch after creation
      await loadReminders(0, false);

      // Send notifications if this is a family task with assigned members
      if (family && reminderData.assignedTo && reminderData.assignedTo.length > 0) {
        if (__DEV__) {
          console.log('👨‍👩‍👧‍👦 Sending family notifications...');
        }
        const taskNotificationData = {
          taskId: id,
          taskTitle: reminderData.title,
          taskDescription: reminderData.description,
          assignedBy: user.uid,
          assignedByDisplayName: user.displayName || user.email || 'Family Member',
          assignedTo: reminderData.assignedTo, // Already an array
          dueDate: reminderData.dueDate?.toISOString(),
          priority: reminderData.priority,
        };

        // Notify family about new task
        await notifyTaskCreated(taskNotificationData);

        // Notify assigned member specifically
        await notifyTaskAssigned(taskNotificationData);

        // Add to family notifications tab
        await addFamilyNotification({
          familyId: family.id,
          type: 'reminder_assigned',
          reminderId: id,
          assignedTo: reminderData.assignedTo,
          createdBy: user.uid,
          message: `${user.displayName || user.email || 'A family member'} assigned you a new reminder: "${reminderData.title}"`,
          createdAt: new Date(),
        });
      }

      if (__DEV__) {
        console.log('🎉 Reminder creation completed successfully');
      }
      return id;
    } catch (err) {
      console.error('❌ Error in createReminder:', err);
      setError('Failed to create reminder');
      throw err;
    }
  }, [user, loadReminders, notifyTaskCreated, notifyTaskAssigned, family]);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<FirebaseReminder>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, updates);
      
      // Clear cache to ensure fresh data
      reminderService.clearReminderCache(user.uid);
      
      // Trigger refetch after update
      await loadReminders(0, false);
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.deleteReminder(reminderId);
      
      // Clear cache to ensure fresh data
      reminderService.clearReminderCache(user.uid);
      
      // Trigger refetch after deletion
      await loadReminders(0, false);
    } catch (err) {
      setError('Failed to delete reminder');
      throw err;
    }
  }, [user, loadReminders]);

  const toggleReminderCompletion = useCallback(async (reminderId: string, completed: boolean) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      // Get the current reminder to check if it's recurring
      const currentReminder = reminders.find(r => r.id === reminderId);
      
      await reminderService.updateReminder(reminderId, {
        status: completed ? 'completed' : 'pending',
        completed: completed,
      });
      
      // If this was a recurring reminder that was completed, the next occurrence
      // will be automatically generated by the reminderService.updateReminder method
      
      // Trigger refetch after toggle
      await loadReminders(0, false);
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders, reminders]);

  const toggleFavorite = useCallback(async (reminderId: string, isFavorite: boolean) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, { isFavorite });
      
      // Trigger refetch after toggle
      await loadReminders(0, false);
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders]);

  // Set up real-time listener with performance optimizations
  useEffect(() => {
    if (!user || authLoading) {
      // Clean up any existing listeners when user is not available
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    try {
      let unsubscribe: (() => void) | null = null;
      
      if (family) {
        // For family users, we need to listen to both user's own reminders and family reminders
        console.log('🏠 Setting up family reminders listeners...');
        
        // Listen to user's own reminders
        const userUnsubscribe = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
          try {
        
            // Trigger a full refetch to get both user and family reminders
            loadReminders(0, false);
          } catch (error) {
            console.error('Error processing user reminders from listener:', error);
            loadReminders(0, false);
          }
        });

        // Listen to family members changes to refetch when family structure changes
        const familyUnsubscribe = reminderService.onFamilyMembersChange(family.id, (newMembers) => {
          try {
            console.log('📡 Family members updated, refetching reminders:', newMembers.length);
            loadReminders(0, false);
          } catch (error) {
            console.error('Error processing family members from listener:', error);
            loadReminders(0, false);
          }
        });

        // Listen to family activities to refetch when family activities change
        const activitiesUnsubscribe = reminderService.onFamilyActivitiesChange(family.id, (newActivities) => {
          try {
            console.log('📡 Family activities updated, refetching reminders:', newActivities.length);
            loadReminders(0, false);
          } catch (error) {
            console.error('Error processing family activities from listener:', error);
            loadReminders(0, false);
          }
        });

        unsubscribe = () => {
          console.log('🔇 Cleaning up family reminders listeners');
          userUnsubscribe();
          familyUnsubscribe();
          activitiesUnsubscribe();
        };
      } else {
        // Use standard real-time listener for user's own reminders
        console.log('👤 Setting up user reminders listener...');
        unsubscribe = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
          try {
            const uiReminders = firebaseReminders.map(convertToUIReminder);
            setReminders(uiReminders);
            setIsLoading(false);
            console.log('📡 Reminders updated via real-time listener:', uiReminders.length);
          } catch (error) {
            console.error('Error processing reminders from listener:', error);
            // Fallback to manual load on error
            loadReminders(0, false);
          }
        });
      }

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up reminders listener:', error);
      // Fallback to manual loading
      loadReminders();
    }
  }, [user, authLoading, family, loadReminders]);

  // Load reminders when user changes
  useEffect(() => {
    if (user && !authLoading) {
      loadReminders();
    }
  }, [user, authLoading, loadReminders]);

  const getRemindersByType = useCallback(async (type: string) => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByType(user.uid, type as any);
      return firebaseReminders.map(convertToUIReminder);
    } catch (err) {
      console.error('Error getting reminders by type:', err);
      return [];
    }
  }, [user]);

  const getRemindersByPriority = useCallback(async (priority: string) => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByPriority(user.uid, priority as any);
      return firebaseReminders.map(convertToUIReminder);
    } catch (err) {
      console.error('Error getting reminders by priority:', err);
      return [];
    }
  }, [user]);

  const getFavoriteReminders = useCallback(async () => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getRemindersByPriority(user.uid, 'high');
      return firebaseReminders.map(convertToUIReminder);
    } catch (err) {
      console.error('Error getting favorite reminders:', err);
      return [];
    }
  }, [user]);

  // Check and generate recurring reminders
  const checkRecurringReminders = useCallback(async () => {
    if (!user) {return;}

    try {
      await reminderService.checkAndGenerateRecurringReminders(user.uid);
      await loadReminders(); // Reload reminders to show newly generated ones
    } catch (err) {
      console.error('Error checking recurring reminders:', err);
    }
  }, [user, loadReminders]);

  const getOverdueReminders = useCallback(async () => {
    if (!user) {return [];}

    try {
      const firebaseReminders = await reminderService.getUserReminders(user.uid);
      const uiReminders = firebaseReminders.map(convertToUIReminder);
      const today = new Date().toISOString().split('T')[0];
      return uiReminders.filter(r => r.dueDate && r.dueDate < today && !r.completed);
    } catch (err) {
      console.error('Error getting overdue reminders:', err);
      return [];
    }
  }, [user]);

  return {
    reminders,
    isLoading,
    error,
    loadReminders,
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
    loadMoreReminders,
    refreshReminders,
    hasMore,
    totalCount,
    currentPage,
    // Performance monitoring
    getPerformanceStats: () => performanceMonitor.getStats(),
    getPerformanceRecommendations: () => performanceMonitor.getRecommendations(),
    clearPerformanceMetrics: () => performanceMonitor.clear(),
  };
};

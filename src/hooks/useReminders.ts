import { useState, useEffect, useCallback, useRef } from 'react';
import { reminderService, Reminder as FirebaseReminder } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from './useNotifications';
import { useFamily } from './useFamily';

// Convert Firebase reminder to a simpler format for the UI
const convertToUIReminder = (firebaseReminder: FirebaseReminder) => ({
  id: firebaseReminder.id,
  userId: firebaseReminder.userId,
  title: firebaseReminder.title,
  description: firebaseReminder.description || '',
  type: firebaseReminder.type === 'reminder' ? 'task' : firebaseReminder.type,
  priority: firebaseReminder.priority,
  dueDate: firebaseReminder.dueDate ? firebaseReminder.dueDate.toISOString().split('T')[0] : undefined,
  dueTime: firebaseReminder.dueTime || '',
  location: firebaseReminder.location || '',
  completed: firebaseReminder.status === 'completed' || firebaseReminder.completed || false,
  isFavorite: firebaseReminder.isFavorite || false,
  isRecurring: firebaseReminder.isRecurring || false,
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
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const loadReminders = useCallback(async () => {
    if (!user || authLoading) {return;}

    try {
      setIsLoading(true);
      setError(null);

      const firebaseReminders = await reminderService.getUserReminders(user.uid);
      const uiReminders = firebaseReminders.map(convertToUIReminder);
      setReminders(uiReminders);
    } catch (err) {
      setError('Failed to load reminders');
      console.error('Error loading reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const createReminder = useCallback(async (reminderData: Omit<FirebaseReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      const id = await reminderService.createReminder(reminderData);
      await loadReminders();

      // Send notifications if this is a family task with assigned members
      if (family && reminderData.assignedTo && reminderData.assignedTo.length > 0) {
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
      }

      return id;
    } catch (err) {
      setError('Failed to create reminder');
      throw err;
    }
  }, [user, loadReminders, notifyTaskCreated, notifyTaskAssigned, family]);

  const updateReminder = useCallback(async (reminderId: string, updates: Partial<FirebaseReminder>) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, updates);
      await loadReminders();
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders]);

  const deleteReminder = useCallback(async (reminderId: string) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.deleteReminder(reminderId);
      await loadReminders();
    } catch (err) {
      setError('Failed to delete reminder');
      throw err;
    }
  }, [user, loadReminders]);

  const toggleReminderCompletion = useCallback(async (reminderId: string, completed: boolean) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, {
        status: completed ? 'completed' : 'pending',
        completed: completed,
      });
      await loadReminders();
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders]);

  const toggleFavorite = useCallback(async (reminderId: string, isFavorite: boolean) => {
    if (!user) {throw new Error('User not authenticated');}

    try {
      await reminderService.updateReminder(reminderId, { isFavorite });
      await loadReminders();
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [user, loadReminders]);

  // Set up real-time listener
  useEffect(() => {
    if (!user || authLoading) {return;}

    try {
      const unsubscribe = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
        const uiReminders = firebaseReminders.map(convertToUIReminder);
        setReminders(uiReminders);
        setIsLoading(false);
      });

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (error) {
      console.error('Error setting up reminders listener:', error);
      // Fallback to manual loading
      loadReminders();
    }
  }, [user, authLoading, loadReminders]);

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
      const firebaseReminders = await reminderService.getUserReminders(user.uid);
      const uiReminders = firebaseReminders.map(convertToUIReminder);
      return uiReminders.filter(r => r.isFavorite);
    } catch (err) {
      console.error('Error getting favorite reminders:', err);
      return [];
    }
  }, [user]);

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
    useFirebase: true,
  };
};

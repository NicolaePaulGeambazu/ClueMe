import { useState, useEffect, useCallback, useRef } from 'react';
import { mockDataService, Reminder as MockReminder } from '../services/mockData';
import { reminderService, Reminder as FirebaseReminder } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

// Convert between Firebase and Mock reminder types
const convertToFirebaseReminder = (mockReminder: MockReminder): Omit<FirebaseReminder, 'id'> => ({
  userId: mockReminder.userId,
  title: mockReminder.title,
  description: mockReminder.description,
  type: mockReminder.type === 'bill' ? 'bill' : mockReminder.type === 'med' ? 'med' : mockReminder.type,
  priority: mockReminder.priority,
  status: mockReminder.completed ? 'completed' : 'pending',
  dueDate: mockReminder.dueDate ? new Date(mockReminder.dueDate) : undefined,
  dueTime: mockReminder.dueTime,
  location: mockReminder.location,
  isFavorite: mockReminder.isFavorite,
  isRecurring: mockReminder.isRecurring,
  hasNotification: mockReminder.hasNotification,
  assignedTo: mockReminder.assignedTo,
  tags: mockReminder.tags,
  completed: mockReminder.completed,
  createdAt: new Date(mockReminder.createdAt),
  updatedAt: new Date(mockReminder.updatedAt),
});

const convertToMockReminder = (firebaseReminder: FirebaseReminder): MockReminder => ({
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
  assignedTo: firebaseReminder.assignedTo || '',
  tags: firebaseReminder.tags || [],
  createdAt: firebaseReminder.createdAt.toISOString(),
  updatedAt: firebaseReminder.updatedAt.toISOString(),
});

export const useReminders = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<MockReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirebase, setUseFirebase] = useState(true);
  const unsubscribeRef = useRef<null | (() => void)>(null);

  const loadReminders = useCallback(async () => {
    if (!user || authLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (useFirebase) {
        try {
          const firebaseReminders = await reminderService.getUserReminders(user.uid);
          const mockReminders = firebaseReminders.map(convertToMockReminder);
          setReminders(mockReminders);
          return;
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      const fetchedReminders = await mockDataService.getReminders(user.uid);
      setReminders(fetchedReminders);
    } catch (err) {
      setError('Failed to load reminders');
      console.error('Error loading reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, useFirebase]);

  const createReminder = useCallback(async (reminderData: Omit<MockReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      if (useFirebase) {
        try {
          const firebaseReminderData = convertToFirebaseReminder({
            ...reminderData,
            id: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          const id = await reminderService.createReminder(firebaseReminderData);
          await loadReminders();
          return id;
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      const id = await mockDataService.createReminder({
        ...reminderData,
        userId: user.uid,
      });
      await loadReminders();
      return id;
    } catch (err) {
      setError('Failed to create reminder');
      throw err;
    }
  }, [user, loadReminders, useFirebase]);

  const updateReminder = useCallback(async (id: string, updates: Partial<MockReminder>) => {
    try {
      if (useFirebase) {
        try {
          const firebaseUpdates: Partial<FirebaseReminder> = {};
          if (updates.title) firebaseUpdates.title = updates.title;
          if (updates.description !== undefined) firebaseUpdates.description = updates.description;
          if (updates.type) firebaseUpdates.type = updates.type === 'bill' ? 'bill' : updates.type === 'med' ? 'med' : updates.type;
          if (updates.priority) firebaseUpdates.priority = updates.priority;
          if (updates.completed !== undefined) firebaseUpdates.status = updates.completed ? 'completed' : 'pending';
          if (updates.dueDate) firebaseUpdates.dueDate = new Date(updates.dueDate);
          if (updates.isFavorite !== undefined) firebaseUpdates.isFavorite = updates.isFavorite;
          if (updates.tags) firebaseUpdates.tags = updates.tags;
          
          await reminderService.updateReminder(id, firebaseUpdates);
          setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          return;
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      await mockDataService.updateReminder(id, updates);
      setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) {
      setError('Failed to update reminder');
      throw err;
    }
  }, [useFirebase]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      if (useFirebase) {
        try {
          await reminderService.deleteReminder(id);
          setReminders(prev => prev.filter(r => r.id !== id));
          return;
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      await mockDataService.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete reminder');
      throw err;
    }
  }, [useFirebase]);

  const toggleComplete = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newCompletedState = !reminder.completed;
    await updateReminder(id, { completed: newCompletedState });
  }, [reminders, updateReminder]);

  const toggleFavorite = useCallback(async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const newFavoriteState = !reminder.isFavorite;
    await updateReminder(id, { isFavorite: newFavoriteState });
  }, [reminders, updateReminder]);

  const searchReminders = useCallback(async (searchTerm: string) => {
    if (!user) return [];
    
    try {
      if (useFirebase) {
        try {
          // For now, search locally since Firebase doesn't have a search method
          const firebaseReminders = await reminderService.getUserReminders(user.uid);
          const mockReminders = firebaseReminders.map(convertToMockReminder);
          const term = searchTerm.toLowerCase();
          
          return mockReminders.filter(reminder =>
            reminder.title.toLowerCase().includes(term) ||
            reminder.description?.toLowerCase().includes(term) ||
            reminder.tags.some(tag => tag.toLowerCase().includes(term))
          );
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      return await mockDataService.searchReminders(searchTerm, user.uid);
    } catch (err) {
      console.error('Error searching reminders:', err);
      return [];
    }
  }, [user, useFirebase]);

  const getRemindersByType = useCallback(async (type: string) => {
    if (!user) return [];
    
    try {
      if (useFirebase) {
        try {
          const firebaseReminders = await reminderService.getRemindersByType(user.uid, type as any);
          return firebaseReminders.map(convertToMockReminder);
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      return await mockDataService.getRemindersByType(type, user.uid);
    } catch (err) {
      console.error('Error getting reminders by type:', err);
      return [];
    }
  }, [user, useFirebase]);

  const getFavoriteReminders = useCallback(async () => {
    if (!user) return [];
    
    try {
      if (useFirebase) {
        try {
          const firebaseReminders = await reminderService.getUserReminders(user.uid);
          const mockReminders = firebaseReminders.map(convertToMockReminder);
          return mockReminders.filter(r => r.isFavorite);
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      return await mockDataService.getFavoriteReminders(user.uid);
    } catch (err) {
      console.error('Error getting favorite reminders:', err);
      return [];
    }
  }, [user, useFirebase]);

  const getOverdueReminders = useCallback(async () => {
    if (!user) return [];
    
    try {
      if (useFirebase) {
        try {
          const firebaseReminders = await reminderService.getUserReminders(user.uid);
          const mockReminders = firebaseReminders.map(convertToMockReminder);
          const today = new Date().toISOString().split('T')[0];
          return mockReminders.filter(r => r.dueDate && r.dueDate < today && !r.completed);
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      return await mockDataService.getOverdueReminders(user.uid);
    } catch (err) {
      console.error('Error getting overdue reminders:', err);
      return [];
    }
  }, [user, useFirebase]);

  const getTodayReminders = useCallback(async () => {
    if (!user) return [];
    
    try {
      if (useFirebase) {
        try {
          const firebaseReminders = await reminderService.getUserReminders(user.uid);
          const mockReminders = firebaseReminders.map(convertToMockReminder);
          const today = new Date().toISOString().split('T')[0];
          return mockReminders.filter(r => r.dueDate === today);
        } catch (firebaseError) {
          console.warn('Firebase failed, falling back to local storage:', firebaseError);
          setUseFirebase(false);
        }
      }
      
      // Fallback to mock data
      return await mockDataService.getTodayReminders(user.uid);
    } catch (err) {
      console.error('Error getting today reminders:', err);
      return [];
    }
  }, [user, useFirebase]);

  // Real-time Firestore listener
  useEffect(() => {
    if (!user || authLoading || !useFirebase) return;
    setIsLoading(true);
    setError(null);
    // Subscribe to Firestore changes
    unsubscribeRef.current = reminderService.onUserRemindersChange(user.uid, (firebaseReminders) => {
      const mockReminders = firebaseReminders.map(convertToMockReminder);
      setReminders(mockReminders);
      setIsLoading(false);
    });
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [user, authLoading, useFirebase]);

  useEffect(() => {
    if (!authLoading) {
      loadReminders();
    }
  }, [loadReminders, authLoading]);

  return {
    reminders,
    isLoading,
    error,
    loadReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    toggleComplete,
    toggleFavorite,
    searchReminders,
    getRemindersByType,
    getFavoriteReminders,
    getOverdueReminders,
    getTodayReminders,
    useFirebase,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { TaskType } from '../services/firebaseService';

// Fallback task types since taskTypeService was removed
const defaultTaskTypes: TaskType[] = [
  {
    id: 'task',
    name: 'task',
    label: 'Task',
    color: '#3B82F6',
    icon: 'CheckSquare',
    description: 'General tasks and to-dos',
    isDefault: true,
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'bill',
    name: 'bill',
    label: 'Bill',
    color: '#EF4444',
    icon: 'CreditCard',
    description: 'Bills and payments',
    isDefault: true,
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'med',
    name: 'med',
    label: 'Medication',
    color: '#10B981',
    icon: 'Pill',
    description: 'Medication reminders',
    isDefault: true,
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'event',
    name: 'event',
    label: 'Event',
    color: '#8B5CF6',
    icon: 'Calendar',
    description: 'Events and appointments',
    isDefault: true,
    isActive: true,
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'note',
    name: 'note',
    label: 'Note',
    color: '#F59E0B',
    icon: 'FileText',
    description: 'Notes and memos',
    isDefault: true,
    isActive: true,
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
];

export const useTaskTypes = () => {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load task types
  const loadTaskTypes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use fallback task types since taskTypeService was removed
      setTaskTypes(defaultTaskTypes);
      
    } catch (err) {
      console.error('Error loading task types:', err);
      setError('Failed to load task types');
      // Use fallback types on error
      setTaskTypes(defaultTaskTypes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create task type (simplified - just add to local state)
  const createTaskType = useCallback(async (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      const newTaskType: TaskType = {
        id: Date.now().toString(),
        ...taskTypeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setTaskTypes(prev => [...prev, newTaskType]);
      return newTaskType.id;
    } catch (err) {
      console.error('Error creating task type:', err);
      setError('Failed to create task type');
      throw err;
    }
  }, []);

  // Update task type (simplified - just update local state)
  const updateTaskType = useCallback(async (id: string, updates: Partial<TaskType>) => {
    try {
      setError(null);
      
      setTaskTypes(prev => prev.map(type => 
        type.id === id 
          ? { ...type, ...updates, updatedAt: new Date() }
          : type
      ));
    } catch (err) {
      console.error('Error updating task type:', err);
      setError('Failed to update task type');
      throw err;
    }
  }, []);

  // Delete task type (simplified - just remove from local state)
  const deleteTaskType = useCallback(async (id: string) => {
    try {
      setError(null);
      
      setTaskTypes(prev => prev.filter(type => type.id !== id));
    } catch (err) {
      console.error('Error deleting task type:', err);
      setError('Failed to delete task type');
      throw err;
    }
  }, []);

  // Seed default task types (simplified - just set default types)
  const seedDefaultTaskTypes = useCallback(async () => {
    try {
      setError(null);
      
      // Reset to default types
      setTaskTypes(defaultTaskTypes);
    } catch (err) {
      console.error('Error seeding default task types:', err);
      setError('Failed to seed default task types');
    }
  }, []);

  // Get task type by ID
  const getTaskTypeById = useCallback((id: string): TaskType | null => {
    return taskTypes.find(type => type.id === id) || null;
  }, [taskTypes]);

  // Get task type by name
  const getTaskTypeByName = useCallback((name: string): TaskType | null => {
    return taskTypes.find(type => type.name === name) || null;
  }, [taskTypes]);

  // Get active task types
  const getActiveTaskTypes = useCallback((): TaskType[] => {
    return taskTypes.filter(type => type.isActive);
  }, [taskTypes]);

  // Get default task types
  const getDefaultTaskTypes = useCallback((): TaskType[] => {
    return taskTypes.filter(type => type.isDefault && type.isActive);
  }, [taskTypes]);

  // Listen to task type changes (simplified - no-op since we're using local state)
  const onTaskTypesChange = useCallback((callback: (types: TaskType[]) => void) => {
    // Since we're using local state, we don't need real-time updates
    // Just call the callback with current types
    callback(taskTypes);
    
    // Return a no-op unsubscribe function
    return () => {};
  }, [taskTypes]);

  // Load task types on mount
  useEffect(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  return {
    taskTypes,
    isLoading,
    error,
    loadTaskTypes,
    createTaskType,
    updateTaskType,
    deleteTaskType,
    seedDefaultTaskTypes,
    getTaskTypeById,
    getTaskTypeByName,
    getActiveTaskTypes,
    getDefaultTaskTypes,
    onTaskTypesChange,
  };
};

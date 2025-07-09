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
      setError('Failed to load task types');
      // Use fallback types on error
      setTaskTypes(defaultTaskTypes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Seed default task types (simplified - just set default types)
  const seedDefaultTaskTypes = useCallback(async () => {
    try {
      setError(null);
      
      // Reset to default types
      setTaskTypes(defaultTaskTypes);
    } catch (err) {
      setError('Failed to seed default task types');
    }
  }, []);

  // Load task types on mount
  useEffect(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  return {
    taskTypes,
    isLoading,
    error,
    loadTaskTypes,
    seedDefaultTaskTypes,
  };
};

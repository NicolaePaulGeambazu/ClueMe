import { useState, useEffect, useCallback } from 'react';
import { taskTypeService, TaskType } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { FALLBACK_TASK_TYPES } from '../constants/config';

export const useTaskTypes = () => {
  const { user } = useAuth();
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Load task types
  const loadTaskTypes = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user, skipping task types load');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading task types...');
      const types = await taskTypeService.getAllTaskTypes();
      
      if (types.length === 0) {
        console.log('📋 No task types found in Firebase, using fallback types');
        setUseFallback(true);
        // Convert fallback types to TaskType format
        const fallbackTypes: TaskType[] = FALLBACK_TASK_TYPES.map((type, index) => ({
          id: type.id,
          name: type.id,
          label: type.label,
          color: type.color,
          icon: type.icon,
          description: type.description,
          isDefault: true,
          isActive: true,
          sortOrder: index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.uid,
        }));
        setTaskTypes(fallbackTypes);
      } else {
        console.log(`✅ Loaded ${types.length} task types from Firebase`);
        setUseFallback(false);
        
        // Deduplicate task types by name to prevent duplicate keys
        const seen = new Set<string>();
        const duplicates = new Set<string>();
        const uniqueTypes: TaskType[] = [];
        
        for (const current of types) {
          if (seen.has(current.name)) {
            duplicates.add(current.name);
          } else {
            seen.add(current.name);
            uniqueTypes.push(current);
          }
        }
        
        if (duplicates.size > 0) {
          console.warn(`⚠️ Found ${duplicates.size} duplicate task types: ${Array.from(duplicates).join(', ')}`);
        }
        
        console.log(`✅ Deduplicated to ${uniqueTypes.length} unique task types`);
        setTaskTypes(uniqueTypes);
      }
    } catch (err) {
      console.error('❌ Error loading task types:', err);
      
      // If it's a permission denied error, use fallback types
      if (err instanceof Error && err.message.includes('permission denied')) {
        console.log('📋 Using fallback task types due to Firebase permission issues');
        setUseFallback(true);
        setError('Firebase permission denied. Using fallback task types.');
        
        // Convert fallback types to TaskType format
        const fallbackTypes: TaskType[] = FALLBACK_TASK_TYPES.map((type, index) => ({
          id: type.id,
          name: type.id,
          label: type.label,
          color: type.color,
          icon: type.icon,
          description: type.description,
          isDefault: true,
          isActive: true,
          sortOrder: index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.uid,
        }));
        setTaskTypes(fallbackTypes);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load task types');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Create new task type
  const createTaskType = useCallback(async (taskTypeData: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // If using fallback, don't try to create in Firebase
    if (useFallback) {
      throw new Error('Cannot create task types when using fallback mode. Firebase permissions are required.');
    }

    try {
      console.log('🔄 Creating task type...');
      const id = await taskTypeService.createTaskType({
        ...taskTypeData,
        createdBy: user.uid,
      });
      console.log('✅ Task type created with ID:', id);
      
      // Reload task types to get the updated list
      await loadTaskTypes();
      
      return id;
    } catch (err) {
      console.error('❌ Error creating task type:', err);
      throw err;
    }
  }, [user?.uid, loadTaskTypes, useFallback]);

  // Update task type
  const updateTaskType = useCallback(async (id: string, updates: Partial<TaskType>) => {
    // If using fallback, don't try to update in Firebase
    if (useFallback) {
      throw new Error('Cannot update task types when using fallback mode. Firebase permissions are required.');
    }

    try {
      console.log('🔄 Updating task type...');
      await taskTypeService.updateTaskType(id, updates);
      console.log('✅ Task type updated');
      
      // Reload task types to get the updated list
      await loadTaskTypes();
    } catch (err) {
      console.error('❌ Error updating task type:', err);
      throw err;
    }
  }, [loadTaskTypes, useFallback]);

  // Delete task type
  const deleteTaskType = useCallback(async (id: string) => {
    // If using fallback, don't try to delete in Firebase
    if (useFallback) {
      throw new Error('Cannot delete task types when using fallback mode. Firebase permissions are required.');
    }

    try {
      console.log('🔄 Deleting task type...');
      await taskTypeService.deleteTaskType(id);
      console.log('✅ Task type deleted');
      
      // Reload task types to get the updated list
      await loadTaskTypes();
    } catch (err) {
      console.error('❌ Error deleting task type:', err);
      throw err;
    }
  }, [loadTaskTypes, useFallback]);

  // Seed default task types
  const seedDefaultTaskTypes = useCallback(async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    // If using fallback, don't try to seed in Firebase
    if (useFallback) {
      console.log('📋 Already using fallback task types, skipping Firebase seeding');
      return;
    }

    try {
      console.log('🔄 Seeding default task types...');
      await taskTypeService.seedDefaultTaskTypes();
      console.log('✅ Default task types seeded');
      
      // Reload task types to get the updated list
      await loadTaskTypes();
    } catch (err) {
      console.error('❌ Error seeding default task types:', err);
      
      // If seeding fails due to permissions, switch to fallback mode
      if (err instanceof Error && err.message.includes('permission denied')) {
        console.log('📋 Switching to fallback task types due to Firebase permission issues');
        setUseFallback(true);
        setError('Firebase permission denied. Using fallback task types.');
        
        // Convert fallback types to TaskType format
        const fallbackTypes: TaskType[] = FALLBACK_TASK_TYPES.map((type, index) => ({
          id: type.id,
          name: type.id,
          label: type.label,
          color: type.color,
          icon: type.icon,
          description: type.description,
          isDefault: true,
          isActive: true,
          sortOrder: index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.uid,
        }));
        setTaskTypes(fallbackTypes);
      } else {
        throw err;
      }
    }
  }, [user?.uid, loadTaskTypes, useFallback]);

  // Get task type by name
  const getTaskTypeByName = useCallback((name: string): TaskType | undefined => {
    return taskTypes.find(type => type.name === name);
  }, [taskTypes]);

  // Get task type by ID
  const getTaskTypeById = useCallback((id: string): TaskType | undefined => {
    return taskTypes.find(type => type.id === id);
  }, [taskTypes]);

  // Get default task types
  const getDefaultTaskTypes = useCallback((): TaskType[] => {
    return taskTypes.filter(type => type.isDefault);
  }, [taskTypes]);

  // Load task types on mount and when user changes
  useEffect(() => {
    loadTaskTypes();
  }, [loadTaskTypes]);

  // Set up real-time listener for task types (only if not using fallback)
  useEffect(() => {
    if (!user?.uid || useFallback) return;

    console.log('👂 Setting up task types listener...');
    const unsubscribe = taskTypeService.onTaskTypesChange((types) => {
      console.log('📡 Task types updated via listener:', types.length);
      if (types.length > 0) {
        // Deduplicate task types by name to prevent duplicate keys
        const seen = new Set<string>();
        const duplicates = new Set<string>();
        const uniqueTypes: TaskType[] = [];
        
        for (const current of types) {
          if (seen.has(current.name)) {
            duplicates.add(current.name);
          } else {
            seen.add(current.name);
            uniqueTypes.push(current);
          }
        }
        
        if (duplicates.size > 0) {
          console.warn(`⚠️ Found ${duplicates.size} duplicate task types: ${Array.from(duplicates).join(', ')}`);
        }
        
        console.log(`✅ Deduplicated listener data to ${uniqueTypes.length} unique task types`);
        setTaskTypes(uniqueTypes);
        setUseFallback(false);
      } else {
        // If no types returned, switch to fallback
        console.log('📋 No task types returned from listener, switching to fallback');
        setUseFallback(true);
        const fallbackTypes: TaskType[] = FALLBACK_TASK_TYPES.map((type, index) => ({
          id: type.id,
          name: type.id,
          label: type.label,
          color: type.color,
          icon: type.icon,
          description: type.description,
          isDefault: true,
          isActive: true,
          sortOrder: index + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.uid,
        }));
        setTaskTypes(fallbackTypes);
      }
    });

    return () => {
      console.log('🔇 Cleaning up task types listener...');
      unsubscribe();
    };
  }, [user?.uid, useFallback]);

  return {
    taskTypes,
    isLoading,
    error,
    useFallback,
    loadTaskTypes,
    createTaskType,
    updateTaskType,
    deleteTaskType,
    seedDefaultTaskTypes,
    getTaskTypeByName,
    getTaskTypeById,
    getDefaultTaskTypes,
  };
}; 
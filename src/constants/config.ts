export interface TaskType {
  id: string;
  label: string;
  color: string;
  icon: string;
  description: string;
}

export type TaskTypeId = typeof FALLBACK_TASK_TYPES[number]['id'];

// Default task types will now be loaded from Firebase
// These are fallback values in case Firebase is not available
export const FALLBACK_TASK_TYPES: readonly TaskType[] = [
  { id: 'task', label: 'Task', color: '#3B82F6', icon: '✓', description: 'General tasks' },
  { id: 'bill', label: 'Bill', color: '#EF4444', icon: '💳', description: 'Bills & payments' },
  { id: 'med', label: 'Medicine', color: '#10B981', icon: '💊', description: 'Health & meds' },
  { id: 'event', label: 'Event', color: '#8B5CF6', icon: '📅', description: 'Meetings & events' },
  { id: 'note', label: 'Note', color: '#F59E0B', icon: '📝', description: 'Notes & ideas' },
] as const;

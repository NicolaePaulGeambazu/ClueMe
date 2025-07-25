export interface Item {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  isFavorite: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  dueTime?: string;
  location?: string;
  tags: string[];
  userId: string;
  assignedTo?: string;
  createdAt: any;
  updatedAt: any;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  analytics: boolean;
}
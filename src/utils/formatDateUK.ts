
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';

/**
 * UK date formatting utilities for consistent date display throughout the app
 */

export const formatDateUK = (date: Date): string => {
  return format(date, 'dd/MM/yyyy', { locale: enGB });
};

export const formatTimeUK = (date: Date): string => {
  return format(date, 'HH:mm', { locale: enGB });
};

export const formatDateTimeUK = (date: Date): string => {
  return format(date, 'dd/MM/yyyy \'at\' HH:mm', { locale: enGB });
};

export const formatDateTimeShortUK = (date: Date): string => {
  return format(date, 'dd/MM/yy HH:mm', { locale: enGB });
};

export const formatDayDateUK = (date: Date): string => {
  return format(date, 'EEEE, dd/MM/yyyy', { locale: enGB });
};

export const formatRelativeDateUK = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${formatTimeUK(date)}`;
  } else if (diffDays === 1) {
    return `Tomorrow at ${formatTimeUK(date)}`;
  } else if (diffDays === -1) {
    return `Yesterday at ${formatTimeUK(date)}`;
  } else if (diffDays > 1 && diffDays <= 7) {
    return format(date, 'EEEE \'at\' HH:mm', { locale: enGB });
  } else {
    return formatDateTimeUK(date);
  }
};

export const formatDurationUK = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

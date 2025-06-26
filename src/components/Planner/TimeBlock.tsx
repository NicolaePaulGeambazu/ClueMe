import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Star, CheckCircle, AlertCircle, User } from 'lucide-react-native';
import { Fonts } from '../../constants/Fonts';

interface TimeBlockProps {
  reminder: any;
  onPress: () => void;
  colors: any;
  compact?: boolean;
}

export const TimeBlock: React.FC<TimeBlockProps> = ({
  reminder,
  onPress,
  colors,
  compact = false
}) => {
  const styles = createStyles(colors);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return '#3B82F6';
      case 'bill': return '#EF4444';
      case 'med': return '#10B981';
      case 'event': return '#8B5CF6';
      case 'note': return '#F59E0B';
      default: return colors.primary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '✓';
      case 'bill': return '💳';
      case 'med': return '💊';
      case 'event': return '📅';
      case 'note': return '📝';
      default: return '•';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isOverdue = () => {
    if (!reminder.dueDate) return false;
    const dueDate = new Date(reminder.dueDate);
    const now = new Date();
    return dueDate < now && !reminder.completed;
  };

  const typeColor = getTypeColor(reminder.type);
  const priorityColor = getPriorityColor(reminder.priority);
  const overdue = isOverdue();

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactBlock,
          { borderLeftColor: typeColor },
          overdue && styles.overdueBlock
        ]}
        onPress={onPress}
      >
        <Text style={styles.compactTitle} numberOfLines={1}>
          {reminder.title}
        </Text>
        {reminder.isFavorite && (
          <Star size={10} color={colors.warning} fill={colors.warning} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.block,
        { borderLeftColor: typeColor },
        overdue && styles.overdueBlock
      ]}
      onPress={onPress}
    >
      <View style={styles.blockHeader}>
        <View style={styles.blockTitleRow}>
          <Text style={styles.typeIcon}>{getTypeIcon(reminder.type)}</Text>
          <Text style={styles.blockTitle} numberOfLines={1}>
            {reminder.title}
          </Text>
          {reminder.isFavorite && (
            <Star size={14} color={colors.warning} fill={colors.warning} />
          )}
        </View>
        
        <View style={styles.blockMeta}>
          {reminder.dueTime && (
            <View style={styles.timeMeta}>
              <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.timeText}>{formatTime(reminder.dueTime)}</Text>
            </View>
          )}
          
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {reminder.priority}
            </Text>
          </View>
        </View>
      </View>

      {reminder.description && (
        <Text style={styles.blockDescription} numberOfLines={2}>
          {reminder.description}
        </Text>
      )}

      <View style={styles.blockFooter}>
        {reminder.assignedTo && (
          <View style={styles.assignedTo}>
            <User size={12} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.assignedText}>{reminder.assignedTo}</Text>
          </View>
        )}
        
        {overdue && (
          <View style={styles.overdueIndicator}>
            <AlertCircle size={12} color={colors.error} strokeWidth={2} />
            <Text style={styles.overdueText}>Overdue</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  compactBlock: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  overdueBlock: {
    borderColor: colors.error,
    backgroundColor: colors.error + '05',
  },
  blockHeader: {
    marginBottom: 8,
  },
  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  blockTitle: {
    flex: 1,
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: colors.text,
  },
  compactTitle: {
    flex: 1,
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.text,
  },
  blockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontFamily: Fonts.text.medium,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  blockDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  blockFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignedTo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    fontFamily: Fonts.text.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueText: {
    fontFamily: Fonts.text.medium,
    fontSize: 11,
    color: colors.error,
    marginLeft: 4,
  },
}); 
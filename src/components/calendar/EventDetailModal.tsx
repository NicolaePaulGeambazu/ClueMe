import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Repeat,
  Bell,
  Star,
  CheckCircle,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes } from '../../constants/Fonts';
import { CalendarEvent, getEventTypeColor } from '../../utils/calendarUtils';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';

interface EventDetailModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onComplete: (event: CalendarEvent) => void;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onEdit,
  onDelete,
  onComplete
}: EventDetailModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const styles = createStyles(colors);

  if (!event) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return '📅';
      case 'task': return '✓';
      case 'bill': return '💳';
      case 'med': return '💊';
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Normal Priority';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerContent}>
            <View style={[styles.typeIconContainer, { backgroundColor: `${getEventTypeColor(event.type)}15` }]}>
              <Text style={styles.typeIcon}>{getTypeIcon(event.type)}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.eventType, { color: getEventTypeColor(event.type) }]}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </Text>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {event.title}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Description */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {event.description}
              </Text>
            </View>
          )}

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Date & Time</Text>
            <View style={styles.infoRow}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {formatDate(event.date)}
              </Text>
            </View>
            {event.dueTime && (
              <View style={styles.infoRow}>
                <Clock size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {formatTimeOnly(event.dueTime)}
                </Text>
              </View>
            )}
          </View>

          {/* Location */}
          {event.location && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
              <View style={styles.infoRow}>
                <MapPin size={20} color={colors.secondary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {event.location}
                </Text>
              </View>
            </View>
          )}

          {/* Priority */}
          {event.priority && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority</Text>
              <View style={styles.infoRow}>
                <AlertTriangle size={20} color={getPriorityColor(event.priority)} />
                <Text style={[styles.infoText, { color: getPriorityColor(event.priority) }]}>
                  {getPriorityLabel(event.priority)}
                </Text>
              </View>
            </View>
          )}

          {/* Status & Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status</Text>
            <View style={styles.statusContainer}>
              {event.completed && (
                <View style={[styles.statusChip, { backgroundColor: `${colors.success}15` }]}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={[styles.statusText, { color: colors.success }]}>Completed</Text>
                </View>
              )}
              {event.isRecurring && (
                <View style={[styles.statusChip, { backgroundColor: `${colors.primary}15` }]}>
                  <Repeat size={16} color={colors.primary} />
                  <Text style={[styles.statusText, { color: colors.primary }]}>Recurring</Text>
                </View>
              )}
            </View>
          </View>

          {/* Recurring Details */}
          {event.isRecurring && event.recurringEndDate && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurring Details</Text>
              <View style={styles.infoRow}>
                <Repeat size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Ends on {formatDate(new Date(event.recurringEndDate))}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actions, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => onEdit(event)}
          >
            <Edit3 size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Edit
            </Text>
          </TouchableOpacity>

          {!event.completed && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => onComplete(event)}
            >
              <CheckCircle size={20} color={colors.background} />
              <Text style={[styles.actionButtonText, { color: colors.background }]}>
                Complete
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => onDelete(event)}
          >
            <Trash2 size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  typeIcon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  eventType: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.text.bold,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
    marginBottom: 12,
  },
  description: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.regular,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.text.medium,
    marginLeft: 12,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.text.semibold,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: FontSizes.callout,
    fontFamily: Fonts.text.semibold,
  },
});
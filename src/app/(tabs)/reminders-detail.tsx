import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle, Clock, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { formatTimeOnly } from '../../utils/dateUtils';

export default function RemindersDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { title, reminders } = route.params || {};
  
  const styles = createStyles(colors);

  // Debug: Log the reminders data
  console.log('RemindersDetailScreen - reminders:', reminders);
  if (reminders && reminders.length > 0) {
    reminders.forEach((reminder: any, index: number) => {
      console.log(`Reminder ${index}:`, {
        id: reminder.id,
        title: reminder.title,
        dueTime: reminder.dueTime,
        dueTimeType: typeof reminder.dueTime,
        dueDate: reminder.dueDate
      });
    });
  }

  // Helper for type icon/emoji
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

  // Helper for priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  if (!reminders || reminders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || t('reminders.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('reminders.noRemindersForDate')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || t('reminders.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {reminders.map((reminder: any, index: number) => (
          <View key={reminder.id || index} style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderIcon}>{getTypeIcon(reminder.type)}</Text>
              <Text style={styles.reminderTitle}>{reminder.title}</Text>
              {reminder.isFavorite && <Star size={16} color={colors.warning} />}
            </View>
            
            {reminder.description && (
              <Text style={styles.reminderDescription}>{reminder.description}</Text>
            )}
            
            <View style={styles.reminderMeta}>
              {reminder.dueTime && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>
                    {formatTimeOnly(reminder.dueTime)}
                  </Text>
                </View>
              )}
              
              {reminder.priority && (
                <View style={styles.metaItem}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(reminder.priority) }]} />
                  <Text style={styles.metaText}>{reminder.priority}</Text>
                </View>
              )}
              
              {reminder.completed && (
                <View style={styles.metaItem}>
                  <CheckCircle size={14} color={colors.success} />
                  <Text style={styles.metaText}>{t('reminders.completed')}</Text>
                </View>
              )}
            </View>
            
            {reminder.tags && reminder.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {reminder.tags.map((tag: string, tagIndex: number) => (
                  <View key={tagIndex} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.display.semibold,
    fontSize: FontSizes.title2,
    color: colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  reminderTitle: {
    flex: 1,
    fontFamily: Fonts.text.semibold,
    fontSize: FontSizes.body,
    color: colors.text,
  },
  reminderDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.subheadline,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: LineHeights.subheadline,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.textSecondary,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: Fonts.text.regular,
    fontSize: FontSizes.footnote,
    color: colors.primary,
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, RotateCcw, AlertTriangle, Clock, User, Star, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { LoginPrompt } from '../../components/auth/LoginPrompt';
import { Colors } from '../../constants/Colors';
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { formatDate } from '../../utils/dateUtils';
import { reminderService, Reminder } from '../../services/firebaseService';

interface DeletedReminder extends Reminder {
  deletedAt: Date;
}

export default function TrashScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user, isAnonymous } = useAuth();
  const { showLoginPrompt, setShowLoginPrompt, guardAction, executeAfterAuth } = useAuthGuard();

  const [deletedReminders, setDeletedReminders] = useState<DeletedReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    loadDeletedReminders();
  }, []);

  const loadDeletedReminders = async () => {
    if (!user?.uid) {return;}

    try {
      setIsLoading(true);
      const deletedReminders = await reminderService.getDeletedReminders(user.uid);
      setDeletedReminders(deletedReminders as DeletedReminder[]);
    } catch (error) {
      console.error('Error loading deleted reminders:', error);
      Alert.alert('Error', 'Failed to load deleted reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDeletedReminders();
    setIsRefreshing(false);
  };

  const handleRestore = async (reminderId: string) => {
    const restoreAction = async () => {
      try {
        await reminderService.restoreReminder(reminderId);
        setDeletedReminders(prev => prev.filter(r => r.id !== reminderId));
        Alert.alert('Success', 'Reminder restored successfully');
      } catch (error) {
        console.error('Error restoring reminder:', error);
        Alert.alert('Error', 'Failed to restore reminder');
      }
    };

    guardAction(restoreAction);
  };

  const handlePermanentDelete = async (reminderId: string) => {
    Alert.alert(
      'Permanent Delete',
      'This action cannot be undone. Are you sure you want to permanently delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.permanentDeleteReminder(reminderId);
              setDeletedReminders(prev => prev.filter(r => r.id !== reminderId));
              Alert.alert('Success', 'Reminder permanently deleted');
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) {return;}

    Alert.alert(
      'Restore Reminders',
      `Are you sure you want to restore ${selectedItems.length} reminder(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await Promise.all(selectedItems.map(id => reminderService.restoreReminder(id)));
              setDeletedReminders(prev => prev.filter(r => !selectedItems.includes(r.id)));
              setSelectedItems([]);
              setIsSelectionMode(false);
              Alert.alert('Success', `${selectedItems.length} reminder(s) restored successfully`);
            } catch (error) {
              console.error('Error restoring reminders:', error);
              Alert.alert('Error', 'Failed to restore reminders');
            }
          },
        },
      ]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {return;}

    Alert.alert(
      'Permanent Delete',
      `Are you sure you want to permanently delete ${selectedItems.length} reminder(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(selectedItems.map(id => reminderService.permanentDeleteReminder(id)));
              setDeletedReminders(prev => prev.filter(r => !selectedItems.includes(r.id)));
              setSelectedItems([]);
              setIsSelectionMode(false);
              Alert.alert('Success', `${selectedItems.length} reminder(s) permanently deleted`);
            } catch (error) {
              console.error('Error deleting reminders:', error);
              Alert.alert('Error', 'Failed to delete reminders');
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (reminderId: string) => {
    setSelectedItems(prev =>
      prev.includes(reminderId)
        ? prev.filter(id => id !== reminderId)
        : [...prev, reminderId]
    );
  };

  const formatDeletedDate = (deletedAt: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {return 'Today';}
    if (diffInDays === 1) {return 'Yesterday';}
    if (diffInDays < 7) {return `${diffInDays} days ago`;}
    if (diffInDays < 30) {return `${Math.floor(diffInDays / 7)} weeks ago`;}
    return formatDate(deletedAt);
  };

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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading deleted reminders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Trash2 size={24} color={colors.error} strokeWidth={2} />
          <Text style={styles.title}>Trash</Text>
          <Text style={styles.subtitle}>{deletedReminders.length} deleted reminder(s)</Text>
        </View>

        {deletedReminders.length > 0 && (
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedItems([]);
            }}
          >
            <Text style={styles.selectionButtonText}>
              {isSelectionMode ? 'Cancel' : 'Select'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isSelectionMode && selectedItems.length > 0 && (
        <View style={styles.bulkActions}>
          <TouchableOpacity
            style={[styles.bulkButton, styles.restoreButton]}
            onPress={handleBulkRestore}
          >
            <RotateCcw size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.bulkButtonText}>Restore ({selectedItems.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bulkButton, styles.deleteButton]}
            onPress={handleBulkDelete}
          >
            <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.bulkButtonText}>Delete ({selectedItems.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAnonymous && (
        <View style={styles.anonymousNotice}>
          <Text style={styles.noticeText}>
            Sign in to access your deleted reminders and restore them across devices.
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {deletedReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Trash2 size={48} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No deleted reminders</Text>
            <Text style={styles.emptyDescription}>
              Deleted reminders will appear here for 30 days before being permanently removed.
            </Text>
          </View>
        ) : (
          <View style={styles.remindersList}>
            {deletedReminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                {isSelectionMode && (
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedItems.includes(reminder.id) && styles.checkboxSelected,
                    ]}
                    onPress={() => toggleSelection(reminder.id)}
                  >
                    {selectedItems.includes(reminder.id) && (
                      <CheckCircle size={16} color="#FFFFFF" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.reminderContent}>
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderTitleRow}>
                      <Text style={styles.typeIcon}>{getTypeIcon(reminder.type)}</Text>
                      <Text style={styles.reminderTitle} numberOfLines={1}>
                        {reminder.title}
                      </Text>
                      {reminder.isFavorite && (
                        <Star size={14} color={colors.warning} fill={colors.warning} />
                      )}
                    </View>

                    <View style={styles.reminderMeta}>
                      <View style={styles.deletedInfo}>
                        <Clock size={12} color={colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.deletedText}>
                          Deleted {formatDeletedDate(reminder.deletedAt)}
                        </Text>
                      </View>

                      <View style={[styles.priorityBadge, { backgroundColor: getTypeColor(reminder.type) + '15' }]}>
                        <Text style={[styles.priorityText, { color: getTypeColor(reminder.type) }]}>
                          {reminder.priority}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {reminder.description && (
                    <Text style={styles.reminderDescription} numberOfLines={2}>
                      {reminder.description}
                    </Text>
                  )}

                  {reminder.assignedTo && (
                    <View style={styles.assignedTo}>
                      <User size={12} color={colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.assignedText}>{reminder.assignedTo}</Text>
                    </View>
                  )}

                  {!isSelectionMode && (
                    <View style={styles.reminderActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.restoreButton]}
                        onPress={() => handleRestore(reminder.id)}
                      >
                        <RotateCcw size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.actionButtonText}>Restore</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handlePermanentDelete(reminder.id)}
                      >
                        <Trash2 size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={styles.actionButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onSuccess={() => executeAfterAuth(() => console.log('Trash access granted'))}
        title={t('navigation.access.trashAccess')}
        message={t('add.anonymousBanner')}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 24,
    color: colors.text,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  selectionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectionButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bulkActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bulkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  restoreButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  bulkButtonText: {
    fontFamily: Fonts.text.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  anonymousNotice: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    margin: 24,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  noticeText: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts.text.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: Fonts.text.semibold,
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  remindersList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  reminderCard: {
    flexDirection: 'row',
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    marginBottom: 8,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  reminderTitle: {
    flex: 1,
    fontFamily: Fonts.text.semibold,
    fontSize: 16,
    color: colors.text,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deletedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deletedText: {
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
  reminderDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  assignedTo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignedText: {
    fontFamily: Fonts.text.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 8,
    gap: 4,
  },
  actionButtonText: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: '#FFFFFF',
  },
});

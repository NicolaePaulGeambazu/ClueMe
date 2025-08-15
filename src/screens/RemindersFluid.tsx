import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useReminderContext } from '../contexts/ReminderContext';
import { Colors } from '../constants/Colors';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Star,
  Calendar,
  List,
  Filter,
  SortAsc,
  SortDesc,
  Edit,
  Trash2,
} from 'lucide-react-native';
import {
  FluidContainer,
  FluidCard,
  FluidList,
  FluidButton,
  FluidHeader,
} from '../components/design-system';
import { filterReminders, sortReminders } from '../utils/reminderUtils';
import { formatDate, formatTimeOnly, isOverdue } from '../utils/dateUtils';
import { toastManager } from '../components/common/ToastContainer';

interface RemindersFluidProps {
  navigation: any;
  route: any;
}

type TabType = 'all' | 'today' | 'overdue' | 'completed' | 'favorites';
type SortType = 'dueDate' | 'priority' | 'name' | 'created';

const RemindersFluid: React.FC<RemindersFluidProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { reminders, isLoading, loadReminders, deleteReminder, updateReminder } = useReminderContext();
  
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.initialTab || 'all');
  const [sortBy, setSortBy] = useState<SortType>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReminders();
    } catch (error) {
      toastManager.show({
        title: 'Error',
        message: 'Failed to refresh reminders',
        type: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredAndSortedReminders = useMemo(() => {
    let filtered = reminders;

    // Apply filters based on active tab
    switch (activeTab) {
      case 'today':
        filtered = filterReminders.byToday(reminders);
        break;
      case 'overdue':
        filtered = filterReminders.byOverdue(reminders);
        break;
      case 'completed':
        filtered = filterReminders.byCompleted(reminders, true);
        break;
      case 'favorites':
        filtered = filterReminders.byFavorite(reminders);
        break;
      default:
        filtered = reminders;
    }

    // Apply sorting
    return sortReminders(filtered, sortBy, sortDirection);
  }, [reminders, activeTab, sortBy, sortDirection]);

  const handleToggleComplete = useCallback(async (reminder: any) => {
    try {
      await updateReminder(reminder.id, { completed: !reminder.completed });
      toastManager.show({
        title: 'Reminder Updated',
        message: `${reminder.title} marked as ${reminder.completed ? 'incomplete' : 'complete'}`,
        type: 'success',
      });
    } catch (error) {
      toastManager.show({
        title: 'Error',
        message: 'Failed to update reminder',
        type: 'error',
      });
    }
  }, [updateReminder]);

  const handleDeleteReminder = useCallback(async (reminder: any) => {
    try {
      await deleteReminder(reminder.id);
      toastManager.show({
        title: 'Reminder Deleted',
        message: `${reminder.title} has been deleted`,
        type: 'success',
      });
    } catch (error) {
      toastManager.show({
        title: 'Error',
        message: 'Failed to delete reminder',
        type: 'error',
      });
    }
  }, [deleteReminder]);

  const tabs = [
    { key: 'all', label: 'All', icon: List },
    { key: 'today', label: 'Today', icon: Calendar },
    { key: 'overdue', label: 'Overdue', icon: AlertCircle },
    { key: 'completed', label: 'Done', icon: CheckCircle },
    { key: 'favorites', label: 'Starred', icon: Star },
  ];

  const renderTabButton = (tab: any) => {
    const isActive = activeTab === tab.key;
    const Icon = tab.icon;
    
    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => setActiveTab(tab.key)}
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
      >
        <Icon 
          size={16} 
          color={isActive ? '#FFFFFF' : colors.textSecondary} 
        />
        <Text
          style={[
            styles.tabText,
            { color: isActive ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReminderItem = (reminder: any) => {
    const isOverdueItem = isOverdue(reminder.dueDate, reminder.dueTime);
    const priorityColor = reminder.priority === 'high' ? colors.error :
                         reminder.priority === 'medium' ? colors.warning : colors.primary;

    return (
      <FluidCard
        key={reminder.id}
        onPress={() => navigation.navigate('EditReminder', { reminderId: reminder.id })}
        borderColor={isOverdueItem ? colors.error : priorityColor}
        style={reminder.completed && styles.completedCard}
      >
        <View style={styles.reminderItem}>
          <TouchableOpacity
            onPress={() => handleToggleComplete(reminder)}
            style={styles.checkButton}
          >
            <CheckCircle
              size={24}
              color={reminder.completed ? colors.success : colors.textTertiary}
              fill={reminder.completed ? colors.success : 'transparent'}
            />
          </TouchableOpacity>

          <View style={styles.reminderContent}>
            <View style={styles.reminderHeader}>
              <Text
                style={[
                  styles.reminderTitle,
                  { color: colors.text },
                  reminder.completed && styles.completedText,
                ]}
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              
              <View style={styles.reminderActions}>
                {reminder.priority === 'high' && (
                  <AlertCircle size={16} color={colors.error} />
                )}
                {reminder.favorite && (
                  <Star size={16} color={colors.warning} fill={colors.warning} />
                )}
              </View>
            </View>

            {reminder.description && (
              <Text
                style={[
                  styles.reminderDescription,
                  { color: colors.textSecondary },
                  reminder.completed && styles.completedText,
                ]}
                numberOfLines={2}
              >
                {reminder.description}
              </Text>
            )}

            <View style={styles.reminderMeta}>
              {reminder.dueDate && (
                <View style={styles.metaItem}>
                  <Calendar size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {formatDate(reminder.dueDate)}
                  </Text>
                </View>
              )}

              {reminder.dueTime && (
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {formatTimeOnly(reminder.dueTime)}
                  </Text>
                </View>
              )}

              {reminder.assignedTo && reminder.assignedTo.length > 0 && (
                <View style={styles.metaItem}>
                  <Users size={14} color={colors.textTertiary} />
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {reminder.assignedTo.length}
                  </Text>
                </View>
              )}

              {isOverdueItem && (
                <View style={[styles.metaItem, styles.overdueIndicator]}>
                  <AlertCircle size={14} color={colors.error} />
                  <Text style={[styles.metaText, { color: colors.error }]}>
                    Overdue
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditReminder', { reminderId: reminder.id })}
              style={styles.actionButton}
            >
              <Edit size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleDeleteReminder(reminder)}
              style={styles.actionButton}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </FluidCard>
    );
  };

  const renderSortButton = () => (
    <TouchableOpacity
      onPress={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
      style={[styles.sortButton, { backgroundColor: colors.surface }]}
    >
      {sortDirection === 'asc' ? (
        <SortAsc size={20} color={colors.primary} />
      ) : (
        <SortDesc size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FluidHeader
        title="Reminders"
        onBack={() => navigation.goBack()}
        rightComponent={renderSortButton()}
        showBackButton={!!route.params?.initialTab}
      />

      {/* Tabs */}
      <FluidContainer padding="medium">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map(renderTabButton)}
        </ScrollView>
      </FluidContainer>

      {/* Reminders List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <FluidContainer padding="medium">
          {filteredAndSortedReminders.length > 0 ? (
            <FluidList spacing="small">
              {filteredAndSortedReminders.map(renderReminderItem)}
            </FluidList>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
                <List size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No reminders found
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {activeTab === 'all' 
                  ? "You don't have any reminders yet. Create your first one!"
                  : `No reminders in the ${activeTab} category.`
                }
              </Text>
              {activeTab === 'all' && (
                <FluidButton
                  title="Add Reminder"
                  onPress={() => navigation.navigate('Add')}
                  style={styles.addButton}
                />
              )}
            </View>
          )}
        </FluidContainer>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkButton: {
    padding: 4,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overdueIndicator: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  completedCard: {
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  addButton: {
    marginTop: 16,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default RemindersFluid;

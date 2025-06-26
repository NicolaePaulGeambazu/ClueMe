import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SquareCheck as CheckSquare, CreditCard, Pill, Calendar, FileText, ChevronRight, Plus, Edit, Trash2, Filter, Search, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReminders } from '../../hooks/useReminders';
import { useTaskTypes } from '../../hooks/useTaskTypes';
import { Colors } from '../../constants/Colors'
import { Fonts, FontSizes, LineHeights } from '../../constants/Fonts';
import { FALLBACK_TASK_TYPES } from '../../constants/config';

export default function CategoriesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { reminders, loadReminders } = useReminders();
  const { taskTypes, isLoading: taskTypesLoading, seedDefaultTaskTypes } = useTaskTypes();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const styles = createStyles(colors);

  // Seed default task types if none exist
  useEffect(() => {
    if (taskTypes.length === 0 && !taskTypesLoading && user?.uid) {
      console.log('🌱 No task types found, seeding defaults...');
      seedDefaultTaskTypes().catch(console.error);
    }
  }, [taskTypes.length, taskTypesLoading, user?.uid, seedDefaultTaskTypes]);

  // Use Firebase task types if available, otherwise use fallback
  const availableTaskTypes = taskTypes.length > 0 ? taskTypes : FALLBACK_TASK_TYPES;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadReminders(),
        // Add any other refresh operations here
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadReminders]);

  const getRemindersByType = (typeId: string) => {
    return reminders.filter(reminder => reminder.type === typeId);
  };

  const getTypeStats = (typeId: string) => {
    const typeReminders = getRemindersByType(typeId);
    const total = typeReminders.length;
    const completed = typeReminders.filter(r => r.completed).length;
    const overdue = typeReminders.filter(r => {
      if (!r.dueDate || r.completed) return false;
      const dueDate = new Date(r.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length;
    
    return { total, completed, overdue };
  };

  const getTypeIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckSquare': return CheckSquare;
      case 'CreditCard': return CreditCard;
      case 'Pill': return Pill;
      case 'Calendar': return Calendar;
      case 'FileText': return FileText;
      default: return CheckSquare; // fallback
    }
  };

  const handleCategoryPress = (category: any) => {
    const categoryId = 'name' in category ? category.name : category.id;
    navigation.navigate('index', { 
      filterType: categoryId,
      filterLabel: category.label 
    });
  };

  const filteredCategories = availableTaskTypes.filter(category => {
    if (searchQuery) {
      return category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
             category.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {searchQuery && (
          <View style={styles.searchContainer}>
            <Text style={styles.searchResults}>
              {filteredCategories.length} category{filteredCategories.length !== 1 ? 'ies' : 'y'} found
            </Text>
          </View>
        )}

        <View style={styles.categoriesGrid}>
          {filteredCategories.map((category) => {
            const categoryId = 'name' in category ? category.name : category.id;
            const stats = getTypeStats(categoryId);
            const IconComponent = getTypeIcon('icon' in category ? category.icon : 'CheckSquare');
            
            return (
              <TouchableOpacity
                key={categoryId}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                    <IconComponent size={24} color={category.color} strokeWidth={2} />
                  </View>
                  <TouchableOpacity style={styles.categoryMenu}>
                    <Text style={styles.menuDots}>•••</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.label}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                  
                  <View style={styles.categoryStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{stats.total}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.success }]}>{stats.completed}</Text>
                      <Text style={styles.statLabel}>Done</Text>
                    </View>
                    {stats.overdue > 0 && (
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.error }]}>{stats.overdue}</Text>
                        <Text style={styles.statLabel}>Overdue</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.categoryFooter}>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery 
                ? `No categories match "${searchQuery}"`
                : 'Categories will appear here once you create reminders'
              }
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: Fonts.display.bold,
    fontSize: 28,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    paddingVertical: 16,
  },
  searchResults: {
    fontFamily: Fonts.text.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoriesGrid: {
    gap: 16,
    paddingBottom: 20,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryMenu: {
    padding: 8,
  },
  menuDots: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  categoryContent: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  categoryStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.text.bold,
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: Fonts.text.medium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryFooter: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: Fonts.text.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontFamily: Fonts.text.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
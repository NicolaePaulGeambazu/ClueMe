import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SquareCheck as CheckSquare, CreditCard, Pill, Calendar, FileText, ChevronRight, Plus, Edit, Trash2, Filter, Search, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';

const categories = [
  {
    id: 'task',
    label: 'Tasks',
    color: '#3B82F6',
    icon: CheckSquare,
    description: 'General tasks and to-dos',
  },
  {
    id: 'bill',
    label: 'Bills',
    color: '#EF4444',
    icon: CreditCard,
    description: 'Bills and payments due',
  },
  {
    id: 'med',
    label: 'Medicine',
    color: '#10B981',
    icon: Pill,
    description: 'Medications and health reminders',
  },
  {
    id: 'event',
    label: 'Events',
    color: '#8B5CF6',
    icon: Calendar,
    description: 'Meetings and appointments',
  },
  {
    id: 'note',
    label: 'Notes',
    color: '#F59E0B',
    icon: FileText,
    description: 'Important notes and ideas',
  },
];

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalReminders, setTotalReminders] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategoryStats();
  }, []);

  const loadCategoryStats = async () => {
    try {
      // Mock data for now
      const mockCounts = {
        task: 5,
        bill: 3,
        med: 2,
        event: 4,
        note: 1
      };
      
      setCategoryCounts(mockCounts);
      setTotalReminders(15);
      setDueTodayCount(3);
    } catch (error) {
      console.error('Error loading category stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to category detail screen (could be implemented later)
    console.log('Navigate to category:', categoryId);
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalReminders}</Text>
              <Text style={styles.statLabel}>Total Reminders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{dueTodayCount}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>All Categories</Text>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const count = categoryCounts[category.id] || 0;
            const maxCount = Math.max(...Object.values(categoryCounts), 1);
            const progressPercentage = (count / maxCount) * 100;
            
            return (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={styles.categoryHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${category.color}15` }]}>
                    <IconComponent size={24} color={category.color} strokeWidth={2} />
                  </View>
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryTitleRow}>
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                      <View style={styles.countBadge}>
                        <Text style={[styles.countText, { color: category.color }]}>
                          {count}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textTertiary} strokeWidth={2} />
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          backgroundColor: category.color,
                          width: `${Math.min(progressPercentage, 100)}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionText}>View Overdue</Text>
              <Text style={styles.quickActionCount}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionText}>This Week</Text>
              <Text style={styles.quickActionCount}>{totalReminders}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoriesSection: {
    marginBottom: 32,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  categoryDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  quickActionCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
});
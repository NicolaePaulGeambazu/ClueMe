
import React, { useState, useEffect } from 'react';
import { View, RefreshControl, Animated } from 'react-native';
import { Plus, Search, Calendar, Filter } from 'lucide-react-native';
import {
  FluidScreen,
  FluidText,
  FluidButton,
  FluidContainer,
  FluidList,
  useFluidTheme,
  useFluidAnimation,
} from '../design-system';
import { FluidReminderCard } from '../components/reminders/FluidReminderCard';
import { useReminders } from '../hooks/useReminders';
import { useAuth } from '../contexts/AuthContext';

// Mock data for demonstration
const mockReminders = [
  {
    id: '1',
    title: 'Team meeting with design review',
    dueDate: 'Today',
    dueTime: '2:00 PM',
    location: 'Conference Room A',
    assignedTo: 'John Doe',
    priority: 'high' as const,
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Buy groceries for weekend',
    dueDate: 'Tomorrow',
    dueTime: '10:00 AM',
    location: 'Whole Foods',
    priority: 'medium' as const,
    isCompleted: false,
  },
  {
    id: '3',
    title: 'Call mom for birthday planning',
    dueDate: 'Friday',
    dueTime: '6:00 PM',
    priority: 'low' as const,
    isCompleted: true,
  },
  {
    id: '4',
    title: 'Submit quarterly report',
    dueDate: 'Next Monday',
    dueTime: '9:00 AM',
    assignedTo: 'Sarah Wilson',
    priority: 'high' as const,
    isCompleted: false,
  },
];

export default function FluidHomeScreen() {
  const { colors, spacing } = useFluidTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  const { 
    opacity,
    startEntranceAnimation 
  } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  useEffect(() => {
    startEntranceAnimation();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const filteredReminders = mockReminders.filter(reminder => {
    switch (filter) {
      case 'pending':
        return !reminder.isCompleted;
      case 'completed':
        return reminder.isCompleted;
      default:
        return true;
    }
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <FluidScreen
      safeArea
      padding="medium"
      background="primary"
      scrollable={false}
    >
      <Animated.View style={{ opacity, flex: 1 }}>
        {/* Header */}
        <FluidContainer style={{ marginBottom: spacing.lg }}>
          <FluidText
            variant="headlineLarge"
            weight="bold"
            style={{ marginBottom: spacing.xs }}
          >
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}!
          </FluidText>
          <FluidText
            variant="bodyLarge"
            color={colors.textSecondary}
          >
            You have {filteredReminders.filter(r => !r.isCompleted).length} pending tasks
          </FluidText>
        </FluidContainer>

        {/* Quick Actions */}
        <FluidContainer style={{ marginBottom: spacing.lg }}>
          <View style={{
            flexDirection: 'row',
            gap: spacing.md,
          }}>
            <FluidButton
              variant="primary"
              size="medium"
              icon={<Plus size={20} color={colors.textInverse} />}
              style={{ flex: 1 }}
            >
              Add Task
            </FluidButton>
            
            <FluidButton
              variant="outline"
              size="medium"
              icon={<Search size={20} color={colors.text} />}
              style={{ flex: 1 }}
            >
              Search
            </FluidButton>
          </View>
        </FluidContainer>

        {/* Filter Tabs */}
        <FluidContainer style={{ marginBottom: spacing.lg }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 12,
            padding: 4,
          }}>
            {(['all', 'pending', 'completed'] as const).map((filterOption) => (
              <FluidButton
                key={filterOption}
                variant={filter === filterOption ? 'primary' : 'ghost'}
                size="small"
                onPress={() => setFilter(filterOption)}
                style={{ flex: 1 }}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </FluidButton>
            ))}
          </View>
        </FluidContainer>

        {/* Reminders List */}
        <FluidContainer flex>
          <FluidList
            data={filteredReminders}
            staggerAnimation
            staggerDelay={100}
            itemSpacing={spacing.md}
            renderItem={({ item }) => (
              <FluidReminderCard
                title={item.title}
                dueDate={item.dueDate}
                dueTime={item.dueTime}
                location={item.location}
                assignedTo={item.assignedTo}
                priority={item.priority}
                isCompleted={item.isCompleted}
                onPress={() => {
                  // Navigate to reminder details
                  console.log('Navigate to reminder:', item.id);
                }}
                onComplete={() => {
                  // Toggle completion
                  console.log('Toggle completion for:', item.id);
                }}
              />
            )}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={() => (
              <FluidContainer center padding="large">
                <FluidText
                  variant="bodyLarge"
                  color={colors.textSecondary}
                  align="center"
                >
                  No {filter === 'all' ? '' : filter} tasks found
                </FluidText>
                <FluidText
                  variant="bodyMedium"
                  color={colors.textTertiary}
                  align="center"
                  style={{ marginTop: spacing.sm }}
                >
                  {filter === 'all' 
                    ? 'Create your first task to get started'
                    : `No ${filter} tasks at the moment`
                  }
                </FluidText>
              </FluidContainer>
            )}
          />
        </FluidContainer>
      </Animated.View>
    </FluidScreen>
  );
}

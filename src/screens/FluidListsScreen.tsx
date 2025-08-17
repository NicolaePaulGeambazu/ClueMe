
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Plus, Search, MoreVertical, List, Users } from 'lucide-react-native';
import {
  FluidScreen,
  FluidText,
  FluidButton,
  FluidContainer,
  FluidList,
  FluidCard,
  useFluidTheme,
  useFluidAnimation,
} from '../design-system';

// Mock data for demonstration
const mockLists = [
  {
    id: '1',
    name: 'Personal Tasks',
    description: 'My daily personal reminders',
    itemCount: 12,
    completedCount: 8,
    color: '#FF6B6B',
    isShared: false,
    lastUpdated: '2 hours ago',
  },
  {
    id: '2',
    name: 'Work Projects',
    description: 'Team collaboration and deadlines',
    itemCount: 25,
    completedCount: 15,
    color: '#4ECDC4',
    isShared: true,
    memberCount: 4,
    lastUpdated: '1 hour ago',
  },
  {
    id: '3',
    name: 'Home Improvement',
    description: 'Weekend projects and maintenance',
    itemCount: 8,
    completedCount: 3,
    color: '#45B7D1',
    isShared: false,
    lastUpdated: '3 days ago',
  },
  {
    id: '4',
    name: 'Family Events',
    description: 'Birthdays, anniversaries, and gatherings',
    itemCount: 6,
    completedCount: 2,
    color: '#96CEB4',
    isShared: true,
    memberCount: 6,
    lastUpdated: '1 week ago',
  },
];

interface FluidListCardProps {
  list: typeof mockLists[0];
  onPress: () => void;
  onMorePress: () => void;
}

const FluidListCard: React.FC<FluidListCardProps> = ({ list, onPress, onMorePress }) => {
  const { colors, spacing } = useFluidTheme();
  const { transformStyle } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  const progressPercentage = list.itemCount > 0 ? (list.completedCount / list.itemCount) * 100 : 0;

  return (
    <Animated.View style={transformStyle}>
      <FluidCard
        variant="elevated"
        padding="medium"
        onPress={onPress}
        interactive
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.md,
        }}>
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.xs,
            }}>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: list.color,
                marginRight: spacing.sm,
              }} />
              <FluidText variant="titleMedium" weight="semibold">
                {list.name}
              </FluidText>
              {list.isShared && (
                <Users size={16} color={colors.textSecondary} style={{ marginLeft: spacing.xs }} />
              )}
            </View>
            
            {list.description && (
              <FluidText
                variant="bodySmall"
                color={colors.textSecondary}
                style={{ marginLeft: 20 }}
              >
                {list.description}
              </FluidText>
            )}
          </View>

          <TouchableOpacity
            onPress={onMorePress}
            style={{
              padding: spacing.xs,
              marginTop: -spacing.xs,
              marginRight: -spacing.xs,
            }}
          >
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        <View style={{ marginBottom: spacing.md }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}>
            <FluidText variant="bodySmall" color={colors.textSecondary}>
              {list.completedCount} of {list.itemCount} completed
            </FluidText>
            <FluidText variant="bodySmall" weight="medium" color={list.color}>
              {Math.round(progressPercentage)}%
            </FluidText>
          </View>
          
          <View style={{
            height: 6,
            backgroundColor: colors.backgroundSecondary,
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View style={{
              height: '100%',
              width: `${progressPercentage}%`,
              backgroundColor: list.color,
              borderRadius: 3,
            }} />
          </View>
        </View>

        {/* Footer */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <FluidText variant="caption" color={colors.textTertiary}>
            Updated {list.lastUpdated}
          </FluidText>
          
          {list.isShared && list.memberCount && (
            <FluidText variant="caption" color={colors.textSecondary}>
              {list.memberCount} members
            </FluidText>
          )}
        </View>
      </FluidCard>
    </Animated.View>
  );
};

export default function FluidListsScreen() {
  const { colors, spacing } = useFluidTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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

  const filteredLists = mockLists.filter(list =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleListPress = (listId: string) => {
    console.log('Navigate to list:', listId);
    // Navigate to list detail screen
  };

  const handleMorePress = (listId: string) => {
    console.log('Show more options for list:', listId);
    // Show action sheet with edit, delete, share options
  };

  const handleCreateList = () => {
    setShowCreateModal(true);
  };

  return (
    <FluidScreen
      title="My Lists"
      subtitle="Organize your tasks into collections"
      safeArea
      padding="medium"
      background="primary"
      scrollable={false}
    >
      <Animated.View style={{ opacity, flex: 1 }}>
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
              onPress={handleCreateList}
              style={{ flex: 1 }}
            >
              New List
            </FluidButton>
            
            <FluidButton
              variant="outline"
              size="medium"
              icon={<Search size={20} color={colors.text} />}
              style={{ flex: 1 }}
            >
              Search Lists
            </FluidButton>
          </View>
        </FluidContainer>

        {/* Stats Overview */}
        <FluidContainer style={{ marginBottom: spacing.lg }}>
          <FluidCard variant="filled" padding="medium">
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
              <View style={{ alignItems: 'center' }}>
                <FluidText variant="headlineSmall" weight="bold" color={colors.primary}>
                  {mockLists.length}
                </FluidText>
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  Total Lists
                </FluidText>
              </View>
              
              <View style={{
                width: 1,
                height: 40,
                backgroundColor: colors.border,
              }} />
              
              <View style={{ alignItems: 'center' }}>
                <FluidText variant="headlineSmall" weight="bold" color={colors.success}>
                  {mockLists.reduce((sum, list) => sum + list.completedCount, 0)}
                </FluidText>
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  Completed
                </FluidText>
              </View>
              
              <View style={{
                width: 1,
                height: 40,
                backgroundColor: colors.border,
              }} />
              
              <View style={{ alignItems: 'center' }}>
                <FluidText variant="headlineSmall" weight="bold" color={colors.warning}>
                  {mockLists.reduce((sum, list) => sum + (list.itemCount - list.completedCount), 0)}
                </FluidText>
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  Pending
                </FluidText>
              </View>
            </View>
          </FluidCard>
        </FluidContainer>

        {/* Lists */}
        <FluidContainer flex>
          <FluidList
            data={filteredLists}
            staggerAnimation
            staggerDelay={100}
            itemSpacing={spacing.md}
            renderItem={({ item }) => (
              <FluidListCard
                list={item}
                onPress={() => handleListPress(item.id)}
                onMorePress={() => handleMorePress(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={() => (
              <FluidContainer center padding="large">
                <List size={48} color={colors.textTertiary} style={{ marginBottom: spacing.md }} />
                <FluidText
                  variant="titleMedium"
                  color={colors.textSecondary}
                  align="center"
                  style={{ marginBottom: spacing.sm }}
                >
                  No lists found
                </FluidText>
                <FluidText
                  variant="bodyMedium"
                  color={colors.textTertiary}
                  align="center"
                  style={{ marginBottom: spacing.lg }}
                >
                  Create your first list to organize your tasks
                </FluidText>
                <FluidButton
                  variant="primary"
                  size="medium"
                  onPress={handleCreateList}
                  icon={<Plus size={20} color={colors.textInverse} />}
                >
                  Create List
                </FluidButton>
              </FluidContainer>
            )}
          />
        </FluidContainer>
      </Animated.View>
    </FluidScreen>
  );
}

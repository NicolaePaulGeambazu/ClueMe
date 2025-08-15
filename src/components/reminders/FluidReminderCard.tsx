
import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Calendar, Clock, User, MapPin } from 'lucide-react-native';
import { 
  useFluidTheme, 
  FluidText, 
  FluidContainer,
  useFluidAnimation 
} from '../../design-system';

export interface FluidReminderCardProps {
  title: string;
  dueDate?: string;
  dueTime?: string;
  location?: string;
  assignedTo?: string;
  isCompleted?: boolean;
  priority?: 'low' | 'medium' | 'high';
  onPress?: () => void;
  onComplete?: () => void;
}

export const FluidReminderCard: React.FC<FluidReminderCardProps> = ({
  title,
  dueDate,
  dueTime,
  location,
  assignedTo,
  isCompleted = false,
  priority = 'medium',
  onPress,
  onComplete,
}) => {
  const { colors, spacing } = useFluidTheme();
  const { 
    opacity, 
    scale, 
    translateY,
    startEntranceAnimation,
    transformStyle 
  } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  React.useEffect(() => {
    startEntranceAnimation();
  }, []);

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textTertiary;
    }
  };

  const handlePress = () => {
    if (onPress) {
      // Add subtle press animation
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      onPress();
    }
  };

  return (
    <Animated.View style={transformStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <FluidContainer
          background="surface"
          rounded="large"
          padding="medium"
          shadow="sm"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: getPriorityColor(),
            opacity: isCompleted ? 0.6 : 1,
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.sm,
          }}>
            <FluidText
              variant="titleMedium"
              weight="medium"
              style={{
                flex: 1,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              }}
            >
              {title}
            </FluidText>
            
            {/* Priority indicator */}
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: getPriorityColor(),
              marginLeft: spacing.sm,
              marginTop: 4,
            }} />
          </View>

          {/* Metadata */}
          <View style={{ gap: spacing.xs }}>
            {(dueDate || dueTime) && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}>
                <Calendar size={16} color={colors.textSecondary} />
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  {dueDate} {dueTime && `at ${dueTime}`}
                </FluidText>
              </View>
            )}

            {location && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}>
                <MapPin size={16} color={colors.textSecondary} />
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  {location}
                </FluidText>
              </View>
            )}

            {assignedTo && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}>
                <User size={16} color={colors.textSecondary} />
                <FluidText variant="bodySmall" color={colors.textSecondary}>
                  {assignedTo}
                </FluidText>
              </View>
            )}
          </View>

          {/* Completion button */}
          {onComplete && (
            <TouchableOpacity
              onPress={onComplete}
              style={{
                position: 'absolute',
                top: spacing.md,
                right: spacing.md,
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isCompleted ? colors.success : colors.border,
                backgroundColor: isCompleted ? colors.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCompleted && (
                <View style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.textInverse,
                }} />
              )}
            </TouchableOpacity>
          )}
        </FluidContainer>
      </TouchableOpacity>
    </Animated.View>
  );
};

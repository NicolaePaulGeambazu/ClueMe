
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Repeat, 
  MapPin, 
  Users, 
  Bell,
  Mic,
  Camera,
  FileText,
} from 'lucide-react-native';
import {
  FluidScreen,
  FluidText,
  FluidInput,
  FluidButton,
  FluidContainer,
  FluidCard,
  useFluidTheme,
  useFluidAnimation,
} from '../../design-system';
import { FluidQuickAddModal } from './FluidQuickAddModal';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, subtitle, color, onPress }) => {
  const { colors, spacing } = useFluidTheme();
  const { scale, springTo } = useFluidAnimation({ initialValue: 1 });

  const handlePress = () => {
    springTo(0.95).start(() => {
      springTo(1).start();
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <FluidCard
        variant="elevated"
        padding="medium"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: color,
          transform: [{ scale }],
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${color}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}>
            {icon}
          </View>
          
          <View style={{ flex: 1 }}>
            <FluidText variant="titleSmall" weight="medium">
              {title}
            </FluidText>
            <FluidText variant="bodySmall" color={colors.textSecondary}>
              {subtitle}
            </FluidText>
          </View>
        </View>
      </FluidCard>
    </TouchableOpacity>
  );
};

export default function FluidAddReminderTab() {
  const { colors, spacing } = useFluidTheme();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickText, setQuickText] = useState('');
  
  const { 
    opacity,
    startEntranceAnimation 
  } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  React.useEffect(() => {
    startEntranceAnimation();
  }, []);

  const quickActions = [
    {
      icon: <Plus size={24} color={colors.primary} />,
      title: 'Quick Task',
      subtitle: 'Add a simple reminder',
      color: colors.primary,
      onPress: () => setShowQuickAdd(true),
    },
    {
      icon: <Calendar size={24} color={colors.success} />,
      title: 'Scheduled Task',
      subtitle: 'Set specific date and time',
      color: colors.success,
      onPress: () => console.log('Navigate to scheduled task'),
    },
    {
      icon: <Repeat size={24} color={colors.warning} />,
      title: 'Recurring Task',
      subtitle: 'Repeat daily, weekly, or monthly',
      color: colors.warning,
      onPress: () => console.log('Navigate to recurring task'),
    },
    {
      icon: <Users size={24} color={colors.secondary} />,
      title: 'Team Task',
      subtitle: 'Assign to family members',
      color: colors.secondary,
      onPress: () => console.log('Navigate to team task'),
    },
    {
      icon: <MapPin size={24} color={colors.info} />,
      title: 'Location Reminder',
      subtitle: 'Trigger at specific places',
      color: colors.info,
      onPress: () => console.log('Navigate to location reminder'),
    },
    {
      icon: <Bell size={24} color={colors.error} />,
      title: 'Important Task',
      subtitle: 'High priority with alerts',
      color: colors.error,
      onPress: () => console.log('Navigate to important task'),
    },
  ];

  const smartActions = [
    {
      icon: <Mic size={20} color={colors.primary} />,
      title: 'Voice Input',
      subtitle: 'Speak your reminder',
      color: colors.primary,
      onPress: () => console.log('Start voice input'),
    },
    {
      icon: <Camera size={20} color={colors.success} />,
      title: 'Photo Reminder',
      subtitle: 'Add image context',
      color: colors.success,
      onPress: () => console.log('Open camera'),
    },
    {
      icon: <FileText size={20} color={colors.warning} />,
      title: 'Template',
      subtitle: 'Use saved templates',
      color: colors.warning,
      onPress: () => console.log('Show templates'),
    },
  ];

  const handleQuickAdd = () => {
    if (quickText.trim()) {
      console.log('Quick add:', quickText);
      setQuickText('');
    }
  };

  const handleQuickAddSave = (data: any) => {
    console.log('Save quick add data:', data);
    // Handle saving the reminder
  };

  return (
    <FluidScreen
      title="Add Reminder"
      subtitle="Create new tasks and reminders"
      safeArea
      padding="medium"
      background="primary"
      scrollable
    >
      <View style={{ opacity, flex: 1 }}>
        {/* Quick Input */}
        <FluidContainer style={{ marginBottom: spacing.xl }}>
          <FluidCard variant="elevated" padding="large">
            <FluidText
              variant="titleMedium"
              weight="semibold"
              style={{ marginBottom: spacing.md }}
            >
              Quick Add
            </FluidText>
            
            <View style={{
              flexDirection: 'row',
              gap: spacing.md,
              alignItems: 'flex-end',
            }}>
              <FluidInput
                placeholder="What needs to be done?"
                value={quickText}
                onChangeText={setQuickText}
                style={{ flex: 1 }}
                multiline
                numberOfLines={2}
              />
              
              <FluidButton
                variant="primary"
                size="medium"
                onPress={handleQuickAdd}
                disabled={!quickText.trim()}
                icon={<Plus size={20} color={colors.textInverse} />}
              />
            </View>
          </FluidCard>
        </FluidContainer>

        {/* Quick Actions */}
        <FluidContainer style={{ marginBottom: spacing.xl }}>
          <FluidText
            variant="titleMedium"
            weight="semibold"
            style={{ marginBottom: spacing.md }}
          >
            Quick Actions
          </FluidText>
          
          <View style={{ gap: spacing.md }}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </View>
        </FluidContainer>

        {/* Smart Features */}
        <FluidContainer style={{ marginBottom: spacing.xl }}>
          <FluidText
            variant="titleMedium"
            weight="semibold"
            style={{ marginBottom: spacing.md }}
          >
            Smart Features
          </FluidText>
          
          <View style={{
            flexDirection: 'row',
            gap: spacing.md,
          }}>
            {smartActions.map((action, index) => (
              <View key={index} style={{ flex: 1 }}>
                <QuickAction {...action} />
              </View>
            ))}
          </View>
        </FluidContainer>

        {/* Recent Templates */}
        <FluidContainer>
          <FluidText
            variant="titleMedium"
            weight="semibold"
            style={{ marginBottom: spacing.md }}
          >
            Recent Templates
          </FluidText>
          
          <FluidCard variant="outlined" padding="large">
            <FluidText
              variant="bodyMedium"
              color={colors.textSecondary}
              align="center"
            >
              No templates yet
            </FluidText>
            <FluidText
              variant="bodySmall"
              color={colors.textTertiary}
              align="center"
              style={{ marginTop: spacing.xs }}
            >
              Create recurring tasks to build templates
            </FluidText>
          </FluidCard>
        </FluidContainer>
      </View>

      {/* Quick Add Modal */}
      <FluidQuickAddModal
        visible={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSave={handleQuickAddSave}
      />
    </FluidScreen>
  );
}


import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, User, Repeat } from 'lucide-react-native';
import {
  FluidModal,
  FluidText,
  FluidInput,
  FluidButton,
  FluidContainer,
  useFluidTheme,
} from '../../design-system';

export interface FluidQuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    dueDate?: string;
    dueTime?: string;
    location?: string;
  }) => void;
}

export const FluidQuickAddModal: React.FC<FluidQuickAddModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { colors, spacing } = useFluidTheme();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState('Now');

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      title: title.trim(),
      dueDate: selectedDate !== 'Today' ? selectedDate : undefined,
      dueTime: selectedTime !== 'Now' ? selectedTime : undefined,
      location: location.trim() || undefined,
    });
    
    // Reset form
    setTitle('');
    setLocation('');
    setSelectedDate('Today');
    setSelectedTime('Now');
    
    onClose();
  };

  const quickDateOptions = [
    'Today',
    'Tomorrow',
    'This Weekend',
    'Next Week',
  ];

  const quickTimeOptions = [
    'Now',
    'In 1 hour',
    'This evening',
    'Tomorrow morning',
  ];

  return (
    <FluidModal
      visible={visible}
      onClose={onClose}
      title="Quick Add Task"
      subtitle="Create a new task quickly"
      size="large"
    >
      <View style={{ gap: spacing.lg }}>
        {/* Title Input */}
        <FluidInput
          label="What needs to be done?"
          placeholder="Enter task title..."
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        {/* Location Input */}
        <FluidInput
          label="Location (optional)"
          placeholder="Where will this happen?"
          value={location}
          onChangeText={setLocation}
          leftIcon={<MapPin size={20} color={colors.textSecondary} />}
        />

        {/* Date Selection */}
        <FluidContainer>
          <FluidText
            variant="labelMedium"
            color={colors.textSecondary}
            style={{ marginBottom: spacing.sm }}
          >
            When?
          </FluidText>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}>
            {quickDateOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedDate(option)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 8,
                  backgroundColor: selectedDate === option 
                    ? colors.primary 
                    : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: selectedDate === option 
                    ? colors.primary 
                    : colors.border,
                }}
              >
                <FluidText
                  variant="labelMedium"
                  color={selectedDate === option ? colors.textInverse : colors.text}
                >
                  {option}
                </FluidText>
              </TouchableOpacity>
            ))}
          </View>
        </FluidContainer>

        {/* Time Selection */}
        <FluidContainer>
          <FluidText
            variant="labelMedium"
            color={colors.textSecondary}
            style={{ marginBottom: spacing.sm }}
          >
            What time?
          </FluidText>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}>
            {quickTimeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedTime(option)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 8,
                  backgroundColor: selectedTime === option 
                    ? colors.secondary 
                    : colors.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: selectedTime === option 
                    ? colors.secondary 
                    : colors.border,
                }}
              >
                <FluidText
                  variant="labelMedium"
                  color={selectedTime === option ? colors.textInverse : colors.text}
                >
                  {option}
                </FluidText>
              </TouchableOpacity>
            ))}
          </View>
        </FluidContainer>

        {/* Action Buttons */}
        <View style={{
          flexDirection: 'row',
          gap: spacing.md,
          marginTop: spacing.lg,
        }}>
          <FluidButton
            variant="outline"
            size="large"
            onPress={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </FluidButton>
          <FluidButton
            variant="primary"
            size="large"
            onPress={handleSave}
            disabled={!title.trim()}
            style={{ flex: 1 }}
          >
            Create Task
          </FluidButton>
        </View>
      </View>
    </FluidModal>
  );
};

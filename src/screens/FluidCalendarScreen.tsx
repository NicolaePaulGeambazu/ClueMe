
import React, { useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { ChevronLeft, ChevronRight, Plus, Filter, List, Grid } from 'lucide-react-native';
import {
  FluidScreen,
  FluidText,
  FluidButton,
  FluidContainer,
  FluidCard,
  useFluidTheme,
  useFluidAnimation,
} from '../design-system';

// Mock calendar data
const mockEvents = [
  {
    id: '1',
    title: 'Team meeting',
    time: '9:00 AM',
    duration: '1h',
    color: '#FF6B6B',
    type: 'meeting',
  },
  {
    id: '2',
    title: 'Grocery shopping',
    time: '2:00 PM',
    duration: '30m',
    color: '#4ECDC4',
    type: 'personal',
  },
  {
    id: '3',
    title: 'Workout session',
    time: '6:00 PM',
    duration: '45m',
    color: '#45B7D1',
    type: 'health',
  },
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentDate = new Date();
const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

// Generate calendar days for current month
const generateCalendarDays = () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  const currentDateNum = currentDate.getDate();
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    days.push({
      date: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.getMonth() === month && date.getDate() === currentDateNum,
      hasEvents: Math.random() > 0.7, // Random events for demo
    });
  }
  
  return days;
};

interface CalendarDayProps {
  day: {
    date: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasEvents: boolean;
  };
  onPress: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, onPress }) => {
  const { colors, spacing } = useFluidTheme();
  const { scale, springTo } = useFluidAnimation({ initialValue: 1 });

  const handlePress = () => {
    springTo(0.9).start(() => {
      springTo(1).start();
    });
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 20,
          backgroundColor: day.isToday ? colors.primary : 'transparent',
          opacity: day.isCurrentMonth ? 1 : 0.3,
        }}
        activeOpacity={0.7}
      >
        <FluidText
          variant="bodyMedium"
          weight={day.isToday ? 'semibold' : 'regular'}
          color={day.isToday ? colors.textInverse : colors.text}
        >
          {day.date}
        </FluidText>
        
        {day.hasEvents && (
          <View style={{
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: day.isToday ? colors.textInverse : colors.primary,
          }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface EventCardProps {
  event: typeof mockEvents[0];
  onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const { colors, spacing } = useFluidTheme();
  const { transformStyle } = useFluidAnimation({ 
    initialValue: 0,
    autoStart: true,
  });

  return (
    <Animated.View style={transformStyle}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <FluidCard
          variant="elevated"
          padding="medium"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: event.color,
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <View style={{ flex: 1 }}>
              <FluidText variant="titleSmall" weight="medium">
                {event.title}
              </FluidText>
              <FluidText
                variant="bodySmall"
                color={colors.textSecondary}
                style={{ marginTop: 2 }}
              >
                {event.time} • {event.duration}
              </FluidText>
            </View>
            
            <View style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: 12,
              backgroundColor: `${event.color}20`,
            }}>
              <FluidText
                variant="caption"
                color={event.color}
                weight="medium"
              >
                {event.type}
              </FluidText>
            </View>
          </View>
        </FluidCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FluidCalendarScreen() {
  const { colors, spacing } = useFluidTheme();
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
  
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

  const calendarDays = generateCalendarDays();

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
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ padding: spacing.sm, marginLeft: -spacing.sm }}>
                <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
              
              <FluidText variant="headlineMedium" weight="semibold">
                {currentMonth}
              </FluidText>
              
              <TouchableOpacity style={{ padding: spacing.sm }}>
                <ChevronRight size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
                style={{
                  padding: spacing.sm,
                  borderRadius: 8,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                {viewMode === 'month' ? (
                  <List size={20} color={colors.text} />
                ) : (
                  <Grid size={20} color={colors.text} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  padding: spacing.sm,
                  borderRadius: 8,
                  backgroundColor: colors.backgroundSecondary,
                }}
              >
                <Filter size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
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
              Add Event
            </FluidButton>
            
            <FluidButton
              variant="outline"
              size="medium"
              style={{ paddingHorizontal: spacing.lg }}
            >
              Today
            </FluidButton>
          </View>
        </FluidContainer>

        {viewMode === 'month' ? (
          <>
            {/* Calendar Grid */}
            <FluidContainer style={{ marginBottom: spacing.lg }}>
              <FluidCard variant="elevated" padding="medium">
                {/* Days of week header */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginBottom: spacing.md,
                }}>
                  {daysOfWeek.map((day) => (
                    <FluidText
                      key={day}
                      variant="labelMedium"
                      color={colors.textSecondary}
                      weight="medium"
                    >
                      {day}
                    </FluidText>
                  ))}
                </View>

                {/* Calendar days */}
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                }}>
                  {calendarDays.map((day, index) => (
                    <CalendarDay
                      key={index}
                      day={day}
                      onPress={() => setSelectedDate(day.date)}
                    />
                  ))}
                </View>
              </FluidCard>
            </FluidContainer>

            {/* Today's Events */}
            <FluidContainer flex>
              <FluidText
                variant="titleMedium"
                weight="semibold"
                style={{ marginBottom: spacing.md }}
              >
                Today's Events
              </FluidText>
              
              <View style={{ gap: spacing.md }}>
                {mockEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => console.log('Navigate to event:', event.id)}
                  />
                ))}
              </View>
            </FluidContainer>
          </>
        ) : (
          /* List View */
          <FluidContainer flex>
            <FluidText
              variant="titleMedium"
              weight="semibold"
              style={{ marginBottom: spacing.md }}
            >
              All Events
            </FluidText>
            
            <View style={{ gap: spacing.md }}>
              {mockEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => console.log('Navigate to event:', event.id)}
                />
              ))}
            </View>
          </FluidContainer>
        )}
      </Animated.View>
    </FluidScreen>
  );
}

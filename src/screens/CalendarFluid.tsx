
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { FluidContainer, FluidHeader } from '../components/design-system';
import { useReminders } from '../hooks/useReminders';
import { formatDateUK, formatTimeUK, formatDayDateUK } from '../utils/formatDateUK';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'reminder' | 'event';
  color: string;
  completed?: boolean;
}

const CalendarFluid: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { reminders } = useReminders();

  useEffect(() => {
    // Mock calendar events - replace with actual data
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Team Meeting',
        date: new Date(),
        type: 'reminder',
        color: '#007AFF',
      },
      {
        id: '2',
        title: 'Doctor Appointment',
        date: new Date(Date.now() + 86400000),
        type: 'reminder',
        color: '#FF3B30',
      },
      {
        id: '3',
        title: 'Grocery Shopping',
        date: new Date(Date.now() + 172800000),
        type: 'reminder',
        color: '#34C759',
      },
      {
        id: '4',
        title: 'Project Deadline',
        date: new Date(Date.now() + 259200000),
        type: 'reminder',
        color: '#FF9500',
      },
    ];
    setEvents(mockEvents);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendarDay = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={index} style={{ flex: 1, height: 44 }} />;
    }

    const dayEvents = getEventsForDate(date);
    const isCurrentDay = isToday(date);
    const isSelected = isSelectedDate(date);

    return (
      <TouchableOpacity
        key={index}
        onPress={() => setSelectedDate(date)}
        style={{
          flex: 1,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          backgroundColor: isSelected ? '#007AFF' : isCurrentDay ? '#E3F2FD' : 'transparent',
          margin: 2,
        }}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: isCurrentDay ? '600' : '400',
          color: isSelected ? '#FFFFFF' : isCurrentDay ? '#007AFF' : '#000000',
        }}>
          {date.getDate()}
        </Text>
        {dayEvents.length > 0 && (
          <View style={{
            position: 'absolute',
            bottom: 4,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: isSelected ? '#FFFFFF' : '#007AFF',
          }} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEventItem = (event: CalendarEvent) => (
    <TouchableOpacity
      key={event.id}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 4,
          height: 40,
          borderRadius: 2,
          backgroundColor: event.color,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#000000',
          marginBottom: 2,
        }}>
          {event.title}
        </Text>
        <Text style={{
          fontSize: 14,
          color: '#8E8E93',
        }}>
          {formatTimeUK(event.date)}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const days = getDaysInMonth(currentMonth);
  const selectedDateEvents = getEventsForDate(selectedDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <FluidContainer>
        <FluidHeader
          title="Calendar"
          rightAction={{
            icon: 'today',
            onPress: () => {
              const today = new Date();
              setSelectedDate(today);
              setCurrentMonth(today);
            },
          }}
        />
        
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Calendar Header */}
          <View style={{
            backgroundColor: '#FFFFFF',
            margin: 20,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <TouchableOpacity onPress={() => navigateMonth('prev')}>
                <Icon name="chevron-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <Text style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#000000',
              }}>
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => navigateMonth('next')}>
                <Icon name="chevron-forward" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {weekDays.map((day) => (
                <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#8E8E93',
                    textTransform: 'uppercase',
                  }}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View>
              {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                <View key={weekIndex} style={{ flexDirection: 'row' }}>
                  {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) =>
                    renderCalendarDay(date, weekIndex * 7 + dayIndex)
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Selected Date Events */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#000000',
              marginBottom: 4,
            }}>
              {formatDayDateUK(selectedDate)}
            </Text>
            <Text style={{
              fontSize: 15,
              color: '#8E8E93',
              marginBottom: 16,
            }}>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
            </Text>

            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(renderEventItem)
            ) : (
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 32,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <Icon name="calendar-outline" size={48} color="#C7C7CC" />
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: '#8E8E93',
                  marginTop: 12,
                  textAlign: 'center',
                }}>
                  No events scheduled
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#C7C7CC',
                  marginTop: 4,
                  textAlign: 'center',
                }}>
                  Your day is free!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </FluidContainer>
    </SafeAreaView>
  );
};

export default CalendarFluid;

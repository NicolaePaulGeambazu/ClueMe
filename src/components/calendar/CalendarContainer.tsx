import React, { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import AgendaView from './AgendaView';
import { CalendarEvent } from '../../utils/calendarUtils';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    date: new Date(),
    dateString: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'event',
    isRecurring: false,
  },
  {
    id: '2',
    title: 'Lunch with Alex',
    date: new Date(),
    dateString: new Date().toISOString().split('T')[0],
    time: '12:00',
    type: 'reminder',
    isRecurring: false,
  },
  {
    id: '3',
    title: 'Doctor Appointment',
    date: new Date(),
    dateString: new Date().toISOString().split('T')[0],
    time: '15:00',
    type: 'event',
    isRecurring: false,
  },
];

const CalendarContainer: React.FC = () => {
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', padding: 24 }}>
      <CalendarHeader
        view={view}
        setView={setView}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      {view === 'month' && <MonthView selectedDate={selectedDate} events={events} setSelectedDate={setSelectedDate} />}
      {view === 'week' && <WeekView selectedDate={selectedDate.toISOString().split('T')[0]} events={events} onDatePress={(dateString) => setSelectedDate(new Date(dateString))} onEventPress={() => {}} />}
      {view === 'day' && <DayView selectedDate={selectedDate} events={events} />}
      {view === 'agenda' && <AgendaView selectedDate={selectedDate} events={events} />}
    </div>
  );
};

export default CalendarContainer; 
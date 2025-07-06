import React, { useState } from 'react';
import CalendarHeader from './CalendarHeader';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import AgendaView from './AgendaView';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'reminder' | 'event' | 'family' | 'recurring';
  color?: string;
  allDay?: boolean;
  description?: string;
  participants?: string[];
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: new Date(),
    end: new Date(new Date().getTime() + 30 * 60 * 1000),
    type: 'event',
    color: '#4F8CFF',
  },
  {
    id: '2',
    title: 'Lunch with Alex',
    start: new Date(new Date().setHours(12, 0, 0, 0)),
    end: new Date(new Date().setHours(13, 0, 0, 0)),
    type: 'reminder',
    color: '#FFB347',
  },
  {
    id: '3',
    title: 'Doctor Appointment',
    start: new Date(new Date().setHours(15, 0, 0, 0)),
    end: new Date(new Date().setHours(16, 0, 0, 0)),
    type: 'event',
    color: '#FF6B6B',
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
      {view === 'week' && <WeekView selectedDate={selectedDate} events={events} setSelectedDate={setSelectedDate} />}
      {view === 'day' && <DayView selectedDate={selectedDate} events={events} />}
      {view === 'agenda' && <AgendaView selectedDate={selectedDate} events={events} />}
    </div>
  );
};

export default CalendarContainer; 
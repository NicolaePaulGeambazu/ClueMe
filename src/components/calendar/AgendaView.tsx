import React from 'react';
import type { CalendarEvent } from './CalendarContainer';

interface AgendaViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
}

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const AgendaView: React.FC<AgendaViewProps> = ({ selectedDate, events }) => {
  // Group events by day (for now, just show selectedDate)
  const dayEvents = events.filter(e => isSameDay(e.start, selectedDate));
  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div style={{ fontWeight: 600, fontSize: 16, margin: '16px 0 8px' }}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      {dayEvents.length === 0 && <div style={{ color: '#aaa', fontSize: 14 }}>No events for this day.</div>}
      {dayEvents.map(ev => (
        <div key={ev.id} style={{ background: ev.color || '#4F8CFF', color: '#fff', borderRadius: 10, padding: '10px 16px', marginBottom: 10, fontSize: 15, fontWeight: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div>{ev.title}</div>
          <div style={{ fontSize: 13, color: '#eaf3ff', marginTop: 2 }}>{ev.start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {ev.end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ))}
      {/* Infinite scroll placeholder */}
      <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 24 }}>[More events will load as you scroll]</div>
    </div>
  );
};

export default AgendaView; 
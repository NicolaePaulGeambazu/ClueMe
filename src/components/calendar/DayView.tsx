import React from 'react';
import type { CalendarEvent } from './CalendarContainer';

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
}

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const DayView: React.FC<DayViewProps> = ({ selectedDate, events }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();
  const isToday = isSameDay(selectedDate, today);
  const nowHour = today.getHours();

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {hours.map(h => {
          const hourEvents = events.filter(e => {
            return (
              e.start instanceof Date &&
              !isNaN(e.start.getTime()) &&
              isSameDay(e.start, selectedDate) &&
              e.start.getHours() === h
            );
          });
          return (
            <div key={h} style={{ position: 'relative', minHeight: 36, borderBottom: '1px solid #f0f0f0', background: isToday && h === nowHour ? '#eaf3ff' : undefined }}>
              <div style={{ position: 'absolute', left: 0, top: 2, color: '#bbb', fontSize: 12, width: 32, textAlign: 'right' }}>{h}:00</div>
              {hourEvents.map(ev => (
                <div key={ev.id} style={{ marginLeft: 40, background: ev.color || '#4F8CFF', color: '#fff', borderRadius: 8, fontSize: 13, padding: '4px 10px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>{ev.title}</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView; 
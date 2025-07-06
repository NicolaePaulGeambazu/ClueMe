import React from 'react';
import type { CalendarEvent } from './CalendarContainer';

interface MonthViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  setSelectedDate: (d: Date) => void;
}

const getMonthMatrix = (date: Date): Date[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix: Date[][] = [];
  let week: Date[] = [];
  let day = new Date(firstDay);
  day.setDate(day.getDate() - day.getDay()); // Start from Sunday
  while (day <= lastDay || week.length < 7) {
    week.push(new Date(day));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
    day.setDate(day.getDate() + 1);
  }
  return matrix;
};

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const MonthView: React.FC<MonthViewProps> = ({ selectedDate, events, setSelectedDate }) => {
  const matrix = getMonthMatrix(selectedDate);
  const today = new Date();

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, color: '#888', fontWeight: 500, fontSize: 14 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{textAlign:'center'}}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {matrix.flat().map((date, i) => {
          const dayEvents = events.filter(e => isSameDay(e.start, date));
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(date)}
              style={{
                minHeight: 64,
                background: isSameDay(date, today) ? '#eaf3ff' : '#fafbfc',
                borderRadius: 10,
                border: isSameDay(date, selectedDate) ? '2px solid #4F8CFF' : '1px solid #f0f0f0',
                padding: 6,
                cursor: 'pointer',
                boxShadow: isSameDay(date, today) ? '0 1px 4px rgba(79,140,255,0.08)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600, color: isSameDay(date, today) ? '#4F8CFF' : '#222', marginBottom: 2 }}>{date.getDate()}</div>
              {dayEvents.slice(0,2).map(ev => (
                <div key={ev.id} style={{ fontSize: 12, color: ev.color || '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{ev.title}</div>
              ))}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>+{dayEvents.length - 2} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView; 
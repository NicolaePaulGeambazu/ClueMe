import React from 'react';
import type { CalendarView } from './CalendarContainer';

interface CalendarHeaderProps {
  view: CalendarView;
  setView: (v: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}

const views: { label: string; value: CalendarView }[] = [
  { label: 'Month', value: 'month' },
  { label: 'Week', value: 'week' },
  { label: 'Day', value: 'day' },
  { label: 'Agenda', value: 'agenda' },
];

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ view, setView, selectedDate, setSelectedDate }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {views.map(v => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: view === v.value ? '#222' : '#f3f3f3',
              color: view === v.value ? '#fff' : '#222',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => setSelectedDate(new Date())}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#f3f3f3',
            color: '#222',
            fontWeight: 500,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Today
        </button>
        <button
          style={{
            padding: '6px 16px',
            borderRadius: '50%',
            border: 'none',
            background: '#222',
            color: '#fff',
            fontWeight: 700,
            fontSize: 22,
            width: 40,
            height: 40,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Add event"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader; 
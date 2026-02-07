import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTheme, COMMON_STYLES } from './theme';

export default function DatePicker({ value, onChange, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const dropdownRef = useRef(null);
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const totalDays = daysInMonth(viewDate);
  const startDay = firstDayOfMonth(viewDate);
  const selectedDate = new Date(value);
  const today = new Date();
  
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
  
  // Build the calendar as a 2D array (6 weeks x 7 days)
  const weeks = [];
  let currentDay = 1;
  let nextMonthDay = 1;
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (week === 0 && dayOfWeek < startDay) {
        // Previous month
        const day = prevMonthDays - startDay + dayOfWeek + 1;
        weekDays.push({ type: 'prev', day });
      } else if (currentDay > totalDays) {
        // Next month
        weekDays.push({ type: 'next', day: nextMonthDay++ });
      } else {
        // Current month
        const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), currentDay);
        const isSelected = cellDate.toDateString() === selectedDate.toDateString();
        const isToday = cellDate.toDateString() === today.toDateString();
        weekDays.push({ type: 'current', day: currentDay++, isSelected, isToday });
      }
    }
    
    weeks.push(weekDays);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${theme.button.secondary}`}
      >
        <Calendar size={18} className={theme.text.secondary} />
        <span className="text-sm font-medium">{formatDisplayDate(value)}</span>
      </button>

      {isOpen && (
        <div 
          className={`absolute left-0 top-full mt-2 p-4 rounded-xl border shadow-2xl z-50 ${COMMON_STYLES.modal(isDarkMode)}`}
          style={{ width: '320px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className={`p-2 rounded-lg ${theme.button.ghost}`}
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className={`text-sm font-semibold ${theme.text.main}`}>
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className={`p-2 rounded-lg ${theme.button.ghost}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday Headers - FORCED HORIZONTAL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }} className="mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div 
                key={day} 
                className={`text-center text-xs font-semibold py-2 ${theme.text.tertiary}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - FORCED HORIZONTAL WITH INLINE STYLE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {weeks.map((week, weekIdx) => (
              week.map((cell, dayIdx) => {
                const key = `${weekIdx}-${dayIdx}`;
                
                if (cell.type !== 'current') {
                  return (
                    <div
                      key={key}
                      className={`h-9 flex items-center justify-center text-sm ${theme.text.muted} opacity-40`}
                    >
                      {cell.day}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDateClick(cell.day)}
                    className={`h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${cell.isSelected 
                        ? theme.button.primary
                        : cell.isToday
                          ? `${theme.bg.active} ${theme.text.main}`
                          : theme.button.ghost
                      }`}
                  >
                    {cell.day}
                  </button>
                );
              })
            ))}
          </div>

          {/* Footer */}
          <div className={`flex gap-2 mt-4 pt-4 border-t ${theme.border.default}`}>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`);
                setIsOpen(false);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${theme.button.primary}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${theme.button.secondary}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTheme, COMMON_STYLES } from './theme';

export default function DatePicker({ value, onChange, isDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  
  const [selection, setSelection] = useState({ 
    from: value?.from ? new Date(value.from) : new Date(), 
    to: value?.to ? new Date(value.to) : new Date() 
  });

  const dropdownRef = useRef(null);
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    if (value?.from) {
      const fromDate = new Date(value.from);
      setSelection({
        from: fromDate,
        to: value.to ? new Date(value.to) : fromDate
      });
      setViewDate(fromDate);
    }
  }, [value]);

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

  const toDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    let newSelection = { ...selection };

    if (selection.from && selection.to && selection.from.getTime() !== selection.to.getTime()) {
       newSelection = { from: clickedDate, to: null };
    } 
    else if (!selection.from) {
       newSelection = { from: clickedDate, to: null };
    } 
    else if (selection.from && !selection.to) {
       if (clickedDate < selection.from) {
         newSelection = { from: clickedDate, to: null };
       } else {
         newSelection = { from: selection.from, to: clickedDate };
         onChange({ from: toDateStr(newSelection.from), to: toDateStr(newSelection.to) });
         setIsOpen(false);
       }
    }
    else if (selection.from && selection.to && selection.from.getTime() === selection.to.getTime()) {
        if (clickedDate < selection.from) {
            newSelection = { from: clickedDate, to: null };
        } else {
            newSelection = { from: selection.from, to: clickedDate };
            onChange({ from: toDateStr(newSelection.from), to: toDateStr(newSelection.to) });
            setIsOpen(false);
        }
    }
    setSelection(newSelection);
  };

  const changeMonth = (delta) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatDisplayDate = () => {
    if (!value?.from) return "Select Date";
    const d1 = new Date(value.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!value.to || value.from === value.to) return d1;
    const d2 = new Date(value.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${d1} - ${d2}`;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const totalDays = daysInMonth(viewDate);
  const startDay = firstDayOfMonth(viewDate);
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
  
  const weeks = [];
  let currentDay = 1;
  let nextMonthDay = 1;
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (week === 0 && dayOfWeek < startDay) {
        weekDays.push({ type: 'prev', day: prevMonthDays - startDay + dayOfWeek + 1 });
      } else if (currentDay > totalDays) {
        weekDays.push({ type: 'next', day: nextMonthDay++ });
      } else {
        const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), currentDay);
        const cellTime = cellDate.getTime();
        
        let isSelected = false;
        let isInRange = false;
        let isStart = false;
        let isEnd = false;

        if (selection.from) {
            const fromTime = selection.from.getTime();
            if (cellTime === fromTime) { isSelected = true; isStart = true; }
            if (selection.to) {
                const toTime = selection.to.getTime();
                if (cellTime === toTime) { isSelected = true; isEnd = true; }
                if (cellTime > fromTime && cellTime < toTime) isInRange = true;
            }
        }
        weekDays.push({ type: 'current', day: currentDay++, isSelected, isInRange, isStart, isEnd });
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
        <span className="text-sm font-medium">{formatDisplayDate()}</span>
      </button>

      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 p-4 rounded-xl border shadow-2xl z-50 ${COMMON_STYLES.modal(isDarkMode)}`} style={{ width: '320px' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className={`p-2 rounded-lg ${theme.button.ghost}`}><ChevronLeft size={18} /></button>
            <div className={`text-sm font-semibold ${theme.text.main}`}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</div>
            <button onClick={() => changeMonth(1)} className={`p-2 rounded-lg ${theme.button.ghost}`}><ChevronRight size={18} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }} className="mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className={`text-center text-xs font-semibold py-2 ${theme.text.tertiary}`}>{day}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '4px' }}>
            {weeks.map((week, weekIdx) => (
              week.map((cell, dayIdx) => {
                const key = `${weekIdx}-${dayIdx}`;
                if (cell.type !== 'current') {
                  return <div key={key} className={`h-9 flex items-center justify-center text-sm ${theme.text.muted} opacity-30`}>{cell.day}</div>;
                }
                
                let bgClass = theme.button.ghost;
                let textClass = theme.text.main;
                let roundedClass = 'rounded-lg';

                // ✅ FIX: Text is BLACK in Dark Mode for selected dates, WHITE in Light Mode
                const selectedTextClass = isDarkMode ? 'text-black' : 'text-white';

                if (cell.isStart) {
                    bgClass = theme.button.primary; 
                    textClass = selectedTextClass; 
                    roundedClass = 'rounded-l-lg rounded-r-none';
                    if (!selection.to || selection.from.getTime() === selection.to.getTime()) roundedClass = 'rounded-lg';
                } else if (cell.isEnd) {
                    bgClass = theme.button.primary;
                    textClass = selectedTextClass;
                    roundedClass = 'rounded-r-lg rounded-l-none';
                } else if (cell.isInRange) {
                    bgClass = isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'; 
                    roundedClass = 'rounded-none';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDateClick(cell.day)}
                    className={`h-9 flex items-center justify-center text-sm font-medium transition-all ${bgClass} ${textClass} ${roundedClass}`}
                  >
                    {cell.day}
                  </button>
                );
              })
            ))}
          </div>

          <div className={`flex gap-2 mt-4 pt-4 border-t ${theme.border.default}`}>
            <button
              onClick={() => {
                const todayStr = toDateStr(new Date());
                onChange({ from: todayStr, to: todayStr });
                setIsOpen(false);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${theme.button.primary} ${isDarkMode ? 'text-black' : 'text-white'}`}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
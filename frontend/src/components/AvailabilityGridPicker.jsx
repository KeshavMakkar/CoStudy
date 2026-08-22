import React, { useState, useRef } from 'react';
import { Clock, Calendar, Check, Sparkles } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Hours from 7:00 AM (7) to 11:00 PM (23) -> 16 time slots
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

export default function AvailabilityGridPicker({ slots = [], onChange }) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'select' or 'deselect'
  const isMouseDownRef = useRef(false);

  // Convert incoming slots (list of {day, start, end} or (day, hour)) to a Set of keys "day-hour"
  const selectedKeySet = new Set();
  slots.forEach((s) => {
    const day = s.day ?? s.day_of_week ?? 0;
    const start = Math.floor(s.start ?? s.start_hour ?? 0);
    const end = Math.ceil(s.end ?? s.end_hour ?? start + 1);
    for (let h = start; h < end; h++) {
      selectedKeySet.add(`${day}-${h}`);
    }
  });

  const toggleSlot = (day, hour, forceMode = null) => {
    const key = `${day}-${hour}`;
    const newSet = new Set(selectedKeySet);
    const mode = forceMode !== null ? forceMode : !newSet.has(key);

    if (mode) {
      newSet.add(key);
    } else {
      newSet.delete(key);
    }

    // Convert newSet back into contiguous intervals per day
    const updatedSlots = [];
    for (let d = 0; d < 7; d++) {
      const activeHours = [];
      for (let h = 0; h < 24; h++) {
        if (newSet.has(`${d}-${h}`)) {
          activeHours.push(h);
        }
      }

      if (activeHours.length > 0) {
        activeHours.sort((a, b) => a - b);
        let start = activeHours[0];
        let prev = activeHours[0];

        for (let i = 1; i < activeHours.length; i++) {
          const cur = activeHours[i];
          if (cur === prev + 1) {
            prev = cur;
          } else {
            updatedSlots.push({ day_of_week: d, start_hour: start, end_hour: prev + 1 });
            start = cur;
            prev = cur;
          }
        }
        updatedSlots.push({ day_of_week: d, start_hour: start, end_hour: prev + 1 });
      }
    }

    onChange(updatedSlots);
  };

  const handleMouseDown = (day, hour) => {
    setIsMouseDown(true);
    isMouseDownRef.current = true;
    const key = `${day}-${hour}`;
    const mode = !selectedKeySet.has(key);
    setDragMode(mode);
    toggleSlot(day, hour, mode);
  };

  const handleMouseEnter = (day, hour) => {
    if (isMouseDownRef.current && dragMode !== null) {
      toggleSlot(day, hour, dragMode);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    isMouseDownRef.current = false;
    setDragMode(null);
  };

  // Presets for student convenience
  const applyPreset = (preset) => {
    const newSet = new Set();
    if (preset === 'mwf-afternoon') {
      [0, 2, 4].forEach((d) => [13, 14, 15, 16, 17].forEach((h) => newSet.add(`${d}-${h}`)));
    } else if (preset === 'tth-morning') {
      [1, 3].forEach((d) => [9, 10, 11, 12, 13].forEach((h) => newSet.add(`${d}-${h}`)));
    } else if (preset === 'evenings') {
      [0, 1, 2, 3, 4].forEach((d) => [17, 18, 19, 20, 21].forEach((h) => newSet.add(`${d}-${h}`)));
    } else if (preset === 'weekend') {
      [5, 6].forEach((d) => [11, 12, 13, 14, 15, 16, 17].forEach((h) => newSet.add(`${d}-${h}`)));
    } else if (preset === 'all-weekday') {
      [0, 1, 2, 3, 4].forEach((d) => [10, 11, 12, 13, 14, 15, 16].forEach((h) => newSet.add(`${d}-${h}`)));
    } else if (preset === 'clear') {
      onChange([]);
      return;
    }

    const updatedSlots = [];
    for (let d = 0; d < 7; d++) {
      const activeHours = [];
      for (let h = 0; h < 24; h++) {
        if (newSet.has(`${d}-${h}`)) activeHours.push(h);
      }
      if (activeHours.length > 0) {
        let start = activeHours[0];
        let prev = activeHours[0];
        for (let i = 1; i < activeHours.length; i++) {
          const cur = activeHours[i];
          if (cur === prev + 1) {
            prev = cur;
          } else {
            updatedSlots.push({ day_of_week: d, start_hour: start, end_hour: prev + 1 });
            start = cur;
            prev = cur;
          }
        }
        updatedSlots.push({ day_of_week: d, start_hour: start, end_hour: prev + 1 });
      }
    }
    onChange(updatedSlots);
  };

  const totalSelectedHours = selectedKeySet.size;

  return (
    <div 
      className="select-none bg-slate-50 dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header & Preset controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Weekly Free Time Grid
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Click or drag across slots to mark when you are free to study</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30">
            {totalSelectedHours} Hours Selected / Week
          </span>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold mr-1">Quick Presets:</span>
        <button
          type="button"
          onClick={() => applyPreset('mwf-afternoon')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-orange-600 font-medium transition-colors"
        >
          MWF Afternoons (1-6pm)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('tth-morning')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-orange-600 font-medium transition-colors"
        >
          TTh Mornings (9am-2pm)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('evenings')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-orange-600 font-medium transition-colors"
        >
          Weeknight Evenings (5-10pm)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('weekend')}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-orange-600 font-medium transition-colors"
        >
          Weekend Study (11am-6pm)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('clear')}
          className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/40 ml-auto transition-colors font-semibold"
        >
          Clear Grid
        </button>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[540px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-1 mb-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1">Time</div>
            {DAYS.map((d) => (
              <div key={d} className="py-1 bg-slate-200/60 dark:bg-slate-800/40 rounded text-slate-700 dark:text-slate-300">
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="space-y-1">
            {HOURS.map((hour) => {
              const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;
              return (
                <div key={hour} className="grid grid-cols-8 gap-1 items-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-right pr-2 font-medium">
                    {formattedHour}
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const isSelected = selectedKeySet.has(`${dayIdx}-${hour}`);
                    return (
                      <button
                        key={`${dayIdx}-${hour}`}
                        type="button"
                        onMouseDown={() => handleMouseDown(dayIdx, hour)}
                        onMouseEnter={() => handleMouseEnter(dayIdx, hour)}
                        className={`h-6 rounded transition-all flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/30 ring-1 ring-orange-400'
                            : 'bg-white dark:bg-slate-800/60 hover:bg-orange-100 dark:hover:bg-slate-700/80 text-transparent border border-slate-200 dark:border-slate-800/50'
                        }`}
                        title={`${DAY_FULL[dayIdx]} ${formattedHour}: ${isSelected ? 'Available' : 'Unavailable'}`}
                      >
                        {isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

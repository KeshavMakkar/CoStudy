import React, { useState } from 'react';
import { Clock, Calendar, Users, Sparkles, CheckCircle2 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Focus hours from 8:00 AM (8) to 10:00 PM (22)
const DISPLAY_HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

export default function AvailabilityHeatmap({ heatmapData, members = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!heatmapData || !heatmapData.matrix) {
    return (
      <div className="p-6 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
        No availability data available for this cohort.
      </div>
    );
  }

  const matrix = heatmapData.matrix;
  const totalMembers = heatmapData.total_members || members.length || 1;
  const peakSlots = heatmapData.peak_slots || [];
  const sharedHoursCount = heatmapData.shared_free_hours_count || 0;

  // Helper for heatmap cell color intensity in warm Orange/Amber
  const getCellColor = (count) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/40 text-slate-400 dark:text-slate-700';
    const ratio = count / totalMembers;
    if (ratio >= 0.8) {
      return 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-bold shadow-md shadow-orange-500/30 border-orange-400';
    } else if (ratio >= 0.5) {
      return 'bg-orange-500/80 text-white font-bold border-orange-400/60';
    } else if (ratio >= 0.3) {
      return 'bg-amber-500/50 dark:bg-amber-600/40 text-amber-900 dark:text-amber-200 border-amber-500/40 font-semibold';
    } else {
      return 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/30';
    }
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5 shadow-xl">
      {/* Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-500 border border-orange-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Shared Availability Heatmap</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Visual intersection of weekly free time across all {totalMembers} cohort members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 dark:bg-orange-950/80 border border-orange-500/30 flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{sharedHoursCount} Optimal Overlapping Hours / Week</span>
          </div>
        </div>
      </div>

      {/* Recommended Peak Meeting Times */}
      {peakSlots.length > 0 && (
        <div className="bg-orange-50/70 dark:bg-slate-950/60 p-3.5 rounded-xl border border-orange-200/80 dark:border-slate-800/80">
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            Top Recommended Study Sync Windows:
          </span>
          <div className="flex flex-wrap gap-2">
            {peakSlots.slice(0, 4).map((slot, idx) => (
              <div 
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-orange-950/60 border border-orange-300/80 dark:border-orange-700/50 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-sm"
              >
                <span className="font-bold text-orange-600 dark:text-orange-400">{slot.day_short}</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{slot.time_label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700/40 font-bold">
                  {slot.available_count}/{totalMembers} Free
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap Matrix Table */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-1.5 mb-1.5 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 py-1 font-mono">Time</div>
            {DAYS.map((d) => (
              <div key={d} className="py-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/40">
                {d}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="space-y-1.5">
            {DISPLAY_HOURS.map((hour) => {
              const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
              return (
                <div key={hour} className="grid grid-cols-8 gap-1.5 items-center">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono text-right pr-2 font-medium">
                    {formattedHour}
                  </div>
                  {DAYS.map((_, dayIdx) => {
                    const count = matrix[dayIdx]?.[hour] || 0;
                    const isOptimal = count >= Math.max(2, totalMembers - 1);
                    return (
                      <div
                        key={`${dayIdx}-${hour}`}
                        onMouseEnter={() => setHoveredCell({ day: dayIdx, hour, count })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-7 rounded-md border flex items-center justify-center text-xs transition-all duration-150 cursor-pointer ${getCellColor(
                          count
                        )} ${isOptimal ? 'ring-2 ring-orange-400/80 shadow-sm' : ''}`}
                        title={`${DAY_FULL[dayIdx]} at ${formattedHour}: ${count}/${totalMembers} members available`}
                      >
                        {count > 0 ? (
                          <span className="text-[11px] font-bold">{count}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-800 text-[10px]">·</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="font-semibold">Heatmap Density:</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
            <span className="text-[10px]">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-orange-100 dark:bg-orange-950 border border-orange-200 dark:border-orange-900" />
            <span className="text-[10px]">1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500" />
            <span className="text-[10px]">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-orange-500 border border-orange-400" />
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">Peak Overlap</span>
          </div>
        </div>

        {hoveredCell ? (
          <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
            {DAY_FULL[hoveredCell.day]} @ {hoveredCell.hour}:00 ➔ {hoveredCell.count}/{totalMembers} Available
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Hover over any slot for schedule details</span>
        )}
      </div>
    </div>
  );
}

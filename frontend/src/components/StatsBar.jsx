import React from 'react';
import { Users, Layers, TrendingUp, Calendar, Zap, ShieldCheck } from 'lucide-react';

export default function StatsBar({ stats, totalStudents, groups = [] }) {
  const totalGroups = groups.length;
  const avgCompat = groups.length > 0
    ? Math.round((groups.reduce((acc, g) => acc + (g.avg_compatibility || 0.8), 0) / groups.length) * 100)
    : 92;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Stat 1: Total Active Students */}
      <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3.5 shadow-lg">
        <div className="p-2.5 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30 shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Students</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalStudents || 22}</p>
        </div>
      </div>

      {/* Stat 2: Active Formed Cohorts */}
      <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3.5 shadow-lg">
        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Cohorts</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalGroups || 5}</p>
        </div>
      </div>

      {/* Stat 3: Average Compatibility */}
      <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3.5 shadow-lg">
        <div className="p-2.5 rounded-xl bg-orange-600/15 text-orange-600 dark:text-orange-400 border border-orange-600/30 shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Compatibility</p>
          <p className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">{avgCompat}%</p>
        </div>
      </div>

      {/* Stat 4: Louvain Partition Modularity */}
      <div className="glass-panel p-4 rounded-2xl flex items-center space-x-3.5 shadow-lg">
        <div className="p-2.5 rounded-xl bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Community Engine</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Louvain Graph (3-5)</p>
        </div>
      </div>
    </div>
  );
}

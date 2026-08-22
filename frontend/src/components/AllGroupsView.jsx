import React from 'react';
import { Layers, Users, BookOpen, Calendar, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AllGroupsView({ groups = [], onSelectGroup, activeGroup }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-3xl text-center space-y-4 shadow-xl">
        <Layers className="w-10 h-10 text-orange-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900 dark:text-white">No Active Cohorts Formed Yet</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Click 'Run Match' above to run Louvain Community Detection across all students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500" />
            Active Formed Study Cohorts ({groups.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Partitioned into modularity-maximizing groups of 3–5 students via Louvain community detection
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map((group, idx) => {
          const members = group.members || [];
          const isSelected = activeGroup && activeGroup.id === group.id;
          const compPct = Math.round((group.avg_compatibility || 0.85) * 100);

          return (
            <div
              key={group.id || idx}
              onClick={() => onSelectGroup(group)}
              className={`glass-panel p-6 rounded-2xl cursor-pointer transition-all duration-200 space-y-4 ${
                isSelected
                  ? 'border-orange-500 ring-2 ring-orange-500/40 bg-orange-50/50 dark:bg-slate-900/90 shadow-orange-500/20 shadow-xl scale-[1.01]'
                  : 'hover:border-orange-400 dark:hover:border-slate-700 hover:shadow-xl'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 text-[10px] font-bold border border-orange-200 dark:border-orange-800/60 uppercase">
                      Cohort #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/60">
                      {compPct}% Match
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{group.name}</h3>
                </div>

                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Course Focus Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 font-semibold">
                  <BookOpen className="w-3 h-3 text-orange-500" /> Focus:
                </span>
                {(group.shared_courses || []).map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-700/40">
                    {c}
                  </span>
                ))}
              </div>

              {/* Rationale Snippet */}
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
                {group.explanation || group.explanation_data?.summary || 'Optimally clustered group with shared courses and compatible free time.'}
              </p>

              {/* Members Avatars & Info */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center -space-x-2">
                  {members.map((m) => (
                    <img
                      key={m.student_id}
                      src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                      alt={m.name}
                      title={`${m.name} (${m.major})`}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm"
                    />
                  ))}
                  <span className="text-xs text-slate-500 dark:text-slate-400 pl-3 font-semibold">
                    {members.length} Members
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{group.shared_hours || 0} Shared Free Hrs</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

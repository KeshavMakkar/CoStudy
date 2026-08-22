import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  RotateCcw, 
  Mail, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Zap,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import MatchExplanationCard from './MatchExplanationCard';
import AvailabilityHeatmap from './AvailabilityHeatmap';
import GroupDiscussionBoard from './GroupDiscussionBoard';

export default function GroupDashboard({
  group,
  activeStudent,
  onRematchStudent,
  onTriggerMatch,
  isRematching
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'heatmap', 'chat'

  if (!group) {
    return (
      <div className="glass-panel p-8 sm:p-12 rounded-3xl text-center max-w-2xl mx-auto space-y-6 border shadow-2xl my-8">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/15 text-orange-500 border border-orange-500/30 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
          <Users className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Matched Study Group Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {activeStudent?.name || 'You'} haven't been matched into an active study cohort yet. Run our Louvain Community Matching Engine to form high-compatibility peer groups!
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onTriggerMatch}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4" />
            <span>Run Matching Engine Now</span>
          </button>
        </div>
      </div>
    );
  }

  const members = group.members || [];
  const compScorePct = Math.round((group.avg_compatibility || 0.85) * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Group Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-orange-500/10 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                Formed by Louvain Detection
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                {compScorePct}% Group Compatibility
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {group.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Users className="w-4 h-4 text-orange-500" />
                {members.length} Study Partners
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-amber-500" />
                {group.shared_hours || 0} Shared Free Hours / Wk
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Focus: {(group.shared_courses || []).join(', ') || 'Aligned STEM'}
              </span>
            </div>
          </div>

          {/* Re-match Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onRematchStudent(activeStudent?.id)}
              disabled={isRematching}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 text-orange-500 ${isRematching ? 'animate-spin' : ''}`} />
              <span>{isRematching ? 'Re-matching...' : 'Request Re-Match'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center space-x-2 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'overview'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Cohort Overview & Rationale
          </button>

          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'heatmap'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Availability Heatmap
          </button>

          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'chat'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            Discussion Board
          </button>
        </div>
      </div>

      {/* Main Content Area based on sub-tab */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left 2 Cols: Natural Language Match Explanation */}
          <div className="lg:col-span-2 space-y-6">
            <MatchExplanationCard
              explanationData={group.explanation_data}
              activeStudent={activeStudent}
              group={group}
            />

            {/* Quick Preview of Availability Heatmap */}
            <AvailabilityHeatmap
              heatmapData={group.heatmap_data}
              members={members}
            />
          </div>

          {/* Right Col: Group Members Roster & Chat Preview */}
          <div className="space-y-6">
            
            {/* Members List */}
            <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  Cohort Members ({members.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Target: 3-5</span>
              </div>

              <div className="space-y-3">
                {members.map((m) => {
                  const isMe = activeStudent && m.student_id === activeStudent.id;
                  return (
                    <div
                      key={m.student_id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMe
                          ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-500/50 shadow-sm'
                          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover border border-orange-500/30 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {m.name} {isMe && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-normal">(You)</span>}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{m.year}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.major}</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(m.courses || []).map((c) => (
                              <span key={c} className="text-[9px] px-2 py-0.5 rounded-md bg-orange-100 dark:bg-slate-800 text-orange-800 dark:text-slate-300 font-semibold border border-orange-200 dark:border-slate-700/60">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Embedded Discussion Board */}
            <GroupDiscussionBoard
              groupId={group.id}
              activeStudent={activeStudent}
            />

          </div>
        </div>
      )}

      {activeSubTab === 'heatmap' && (
        <div className="animate-fade-in">
          <AvailabilityHeatmap
            heatmapData={group.heatmap_data}
            members={members}
          />
        </div>
      )}

      {activeSubTab === 'chat' && (
        <div className="max-w-3xl mx-auto animate-fade-in">
          <GroupDiscussionBoard
            groupId={group.id}
            activeStudent={activeStudent}
          />
        </div>
      )}

    </div>
  );
}

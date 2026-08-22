import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  ArrowRightLeft, 
  Award, 
  UserCheck, 
  CheckCircle2,
  TrendingUp,
  HelpCircle
} from 'lucide-react';

export default function MatchExplanationCard({ explanationData, activeStudent, group }) {
  const [viewMode, setViewMode] = useState('personalized'); // 'personalized' or 'group'

  if (!explanationData) return null;

  const {
    summary = '',
    personalized_explanation = '',
    shared_courses = [],
    shared_hours_text = '',
    peer_teaching_synergies = [],
    detailed_synergies = []
  } = explanationData;

  const activeExplanation = viewMode === 'personalized' && personalized_explanation
    ? personalized_explanation
    : summary;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-2xl space-y-5 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Why You Were Matched</h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full border border-orange-500/30">
                Algorithm Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Multidimensional Graph & Peer-Teaching Alignment</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('personalized')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'personalized'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Personalized For You
          </button>
          <button
            onClick={() => setViewMode('group')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'group'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Group Overview
          </button>
        </div>
      </div>

      {/* Natural Language Rationale Box */}
      <div className="relative p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 dark:from-orange-950/40 dark:via-slate-900 dark:to-amber-950/30 border border-orange-500/30 text-sm text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner">
        <div className="flex items-start space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 shrink-0 animate-ping" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">{activeExplanation}</p>
          </div>
        </div>
      </div>

      {/* Alignment Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pillar 1: Shared Courses */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                Curriculum Focus
              </span>
              <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400 font-extrabold">w1 = 40%</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {shared_courses.length > 0 ? (
                shared_courses.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800/60">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">Core Computing Cohort</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">High Jaccard course similarity</p>
        </div>

        {/* Pillar 2: Overlapping Schedule */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Schedule Sync
              </span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">w2 = 35%</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {explanationData.shared_free_hours_count || group?.shared_hours || 0} Hours / Week
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Harmonized recurring time slots</p>
        </div>

        {/* Pillar 3: Peer-Teaching Incentive */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <ArrowRightLeft className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                Skill Synergies
              </span>
              <span className="font-mono text-[10px] text-orange-600 dark:text-orange-400 font-extrabold">w3 = 25%</span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                {detailed_synergies.length} Asymmetric Pairs
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Bidirectional peer-mentoring</p>
        </div>
      </div>

      {/* Peer-Teaching Synergies Detail Cards */}
      {detailed_synergies.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-orange-500" />
              Active Peer-Teaching & Mentorship Synergy Map
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Rewarded in algorithm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {detailed_synergies.slice(0, 4).map((syn, idx) => {
              const isMyMentoring = activeStudent && String(syn.mentor_id) === String(activeStudent.id);
              const isMyLearning = activeStudent && String(syn.learner_id) === String(activeStudent.id);

              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isMyMentoring
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-500/50 shadow-sm'
                      : isMyLearning
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/50 shadow-sm'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{syn.course}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Topic: <strong className="text-slate-900 dark:text-white">{syn.topic}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-orange-600 dark:text-orange-400">{syn.mentor_name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 font-bold">
                        {syn.mentor_rating}/5 ★
                      </span>
                    </div>

                    <span className="text-orange-500 text-[10px] font-bold">teaches ➔</span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-600 dark:text-amber-300">{syn.learner_name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold">
                        {syn.learner_rating}/5 ★
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

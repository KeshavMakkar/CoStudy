import React, { useState } from 'react';
import { Users, Search, UserCheck, BookOpen, Clock, Award, Shield } from 'lucide-react';

export default function StudentsRosterView({ students = [], onSelectStudent, activeStudent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('All');

  const majors = ['All', ...Array.from(new Set(students.map((s) => s.major)))];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.courses || []).some((c) => (c.code || c).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMajor = selectedMajor === 'All' || s.major === selectedMajor;
    return matchesSearch && matchesMajor;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Registered Student Roster ({students.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Browse all enrolled students, their course profiles, and switch active perspective
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search name, course, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-52 sm:w-64"
            />
          </div>

          {/* Major Filter */}
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {majors.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((s) => {
          const isMe = activeStudent && String(s.id) === String(activeStudent.id);
          const courseCodes = (s.courses || []).map((c) => c.code || c);

          return (
            <div
              key={s.id}
              className={`glass-panel p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                isMe
                  ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/40 dark:bg-slate-900/90 shadow-lg shadow-orange-500/10'
                  : 'hover:border-orange-400 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Profile row */}
                <div className="flex items-start space-x-3">
                  <img
                    src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`}
                    alt={s.name}
                    className="w-12 h-12 rounded-full object-cover border border-orange-500/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{s.name}</h4>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[10px] font-bold border border-orange-200 dark:border-orange-700/60">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.major} • {s.year}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">{s.email}</p>
                  </div>
                </div>

                {/* Bio */}
                {s.bio && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60">
                    "{s.bio}"
                  </p>
                )}

                {/* Course Badges */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Enrolled Courses:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {courseCodes.map((code) => (
                      <span
                        key={code}
                        className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200 dark:border-orange-800/50"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {s.current_group_id ? (
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Matched in Cohort #{s.current_group_id}</span>
                  ) : (
                    'Not yet assigned'
                  )}
                </span>

                <button
                  onClick={() => onSelectStudent(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isMe
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-default'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-sm shadow-orange-500/20'
                  }`}
                >
                  {isMe ? 'Selected' : 'View Viewpoint'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

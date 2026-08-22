import React from 'react';
import { 
  Users, 
  Sparkles, 
  Share2, 
  Sliders, 
  RotateCcw, 
  PlusCircle, 
  Layers, 
  Zap, 
  GraduationCap, 
  Sun, 
  Moon,
  ChevronDown
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  students,
  activeStudent,
  onSelectStudent,
  onOpenOnboarding,
  onTriggerMatch,
  onOpenSettings,
  onResetSeed,
  isMatching,
  theme = 'dark',
  onToggleTheme
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0c0e14]/90 backdrop-blur-md transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left: Logo & Branding */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('my-group')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center shadow-md shadow-orange-500/20 transition-transform hover:scale-105">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  Study<span className="text-orange-500">Match</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                  Louvain AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Peer-Matched Study Group Finder</p>
            </div>
          </div>

          {/* Center: Navigation Tabs Pill (Centered) */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <nav className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveTab('my-group')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'my-group'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>My Group</span>
              </button>

              <button
                onClick={() => setActiveTab('all-groups')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all-groups'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Cohorts</span>
              </button>

              <button
                onClick={() => setActiveTab('graph')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'graph'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Network Graph</span>
              </button>

              <button
                onClick={() => setActiveTab('roster')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'roster'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Students ({students.length})</span>
              </button>
            </nav>
          </div>

          {/* Right: Controls & Actions (Properly Aligned with Uniform Heights) */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            
            {/* Active Student Switcher Dropdown */}
            <div className="relative">
              <select
                value={activeStudent?.id || ''}
                onChange={(e) => {
                  const s = students.find((item) => String(item.id) === String(e.target.value));
                  if (s) onSelectStudent(s);
                }}
                className="h-9 bg-slate-100 dark:bg-slate-800/90 text-xs text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-7 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium cursor-pointer shadow-sm appearance-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    👤 {s.name} ({s.major.split(' ')[0]})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Run Match Button */}
            <button
              onClick={onTriggerMatch}
              disabled={isMatching}
              className={`h-9 flex items-center space-x-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isMatching
                  ? 'bg-orange-700/50 text-orange-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/25 hover:scale-[1.02]'
              }`}
              title="Run Graph Louvain Matching Engine"
            >
              <Zap className={`w-3.5 h-3.5 ${isMatching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isMatching ? 'Matching...' : 'Run Match'}</span>
            </button>

            {/* New Student Onboarding Button */}
            <button
              onClick={onOpenOnboarding}
              className="h-9 flex items-center space-x-1 px-2.5 sm:px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-xs font-bold transition-all"
              title="Add New Student Profile"
            >
              <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden md:inline">Join</span>
            </button>

            {/* Algorithm Settings Modal Trigger */}
            <button
              onClick={onOpenSettings}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
              title="Tune Algorithm Weights & Thresholds"
            >
              <Sliders className="w-4 h-4 text-orange-500" />
            </button>

            {/* Reset / Re-seed Button */}
            <button
              onClick={onResetSeed}
              className="h-9 w-9 hidden sm:flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-orange-500 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
              title="Reset Demo Data (22 Students)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={onToggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

          </div>

        </div>

        {/* Mobile Sub-Navigation Tabs (Visible on screens < lg) */}
        <div className="lg:hidden py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('my-group')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'my-group'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>My Group</span>
          </button>

          <button
            onClick={() => setActiveTab('all-groups')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'all-groups'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>All Cohorts</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'graph'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3 h-3" />
            <span>Network Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'roster'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Students ({students.length})</span>
          </button>
        </div>

      </div>
    </header>
  );
}

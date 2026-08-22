import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import StatsBar from './components/StatsBar';
import GroupDashboard from './components/GroupDashboard';
import AllGroupsView from './components/AllGroupsView';
import NetworkGraphView from './components/NetworkGraphView';
import StudentsRosterView from './components/StudentsRosterView';
import OnboardingModal from './components/OnboardingModal';
import AlgorithmSettingsModal from './components/AlgorithmSettingsModal';
import { Zap, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('my-group'); // 'my-group', 'all-groups', 'graph', 'roster'
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  // Theme Management: 'dark' or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('studymatch-theme') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('studymatch-theme', nextTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    }
  }, [theme]);

  // Modals & Loaders
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Load
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, studentsData, groupsData] = await Promise.all([
        api.getCourses(),
        api.getStudents(),
        api.getGroups(),
      ]);

      setCourses(coursesData || []);
      setStudents(studentsData || []);
      
      let curGroups = groupsData || [];
      // If no groups formed yet, run matching automatically for demo
      if (curGroups.length === 0 && studentsData && studentsData.length >= 2) {
        const matchRes = await api.triggerMatching();
        curGroups = matchRes.groups || [];
      }
      setGroups(curGroups);

      // Set default active student (e.g. Maya Lin or first student)
      if (studentsData && studentsData.length > 0) {
        const defaultStudent = studentsData[0];
        setActiveStudent(defaultStudent);
        findAndSetStudentGroup(defaultStudent.id, curGroups);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      showToast('Backend is starting or syncing data...', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const findAndSetStudentGroup = (studentId, currentGroups = groups) => {
    if (!studentId || !currentGroups) return;
    const targetGroup = currentGroups.find((g) =>
      (g.members || []).some((m) => String(m.student_id) === String(studentId))
    );
    setActiveGroup(targetGroup || null);
  };

  const handleSelectStudent = (student) => {
    setActiveStudent(student);
    findAndSetStudentGroup(student.id);
    setActiveTab('my-group');
    showToast(`Switched perspective to ${student.name}`);
  };

  const handleTriggerMatch = async (params = {}) => {
    setIsMatching(true);
    try {
      const res = await api.triggerMatching(params);
      setGroups(res.groups || []);
      
      // Refresh students
      const freshStudents = await api.getStudents();
      setStudents(freshStudents);

      if (activeStudent) {
        findAndSetStudentGroup(activeStudent.id, res.groups);
      }
      showToast(`Formed ${res.total_groups_formed} study cohorts using Louvain Community Detection!`, 'success');
    } catch (err) {
      showToast(err.message || 'Matching failed', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  const handleRematchStudent = async (studentId) => {
    if (!studentId) return;
    setIsRematching(true);
    try {
      const res = await api.rematchStudent(studentId);
      const freshGroups = await api.getGroups();
      setGroups(freshGroups);
      
      const freshStudents = await api.getStudents();
      setStudents(freshStudents);

      findAndSetStudentGroup(studentId, freshGroups);
      showToast(res.message || 'Re-match completed!', 'success');
    } catch (err) {
      showToast(err.message || 'Re-match failed', 'error');
    } finally {
      setIsRematching(false);
    }
  };

  const handleStudentCreated = async (payload) => {
    const newStudent = await api.createStudent(payload);
    
    // Refresh data and re-run match to assign the new student
    const matchRes = await api.triggerMatching();
    setGroups(matchRes.groups || []);
    
    const freshStudents = await api.getStudents();
    setStudents(freshStudents);

    const s = freshStudents.find((item) => item.id === newStudent.id) || newStudent;
    setActiveStudent(s);
    findAndSetStudentGroup(s.id, matchRes.groups);
    setActiveTab('my-group');
    showToast(`Welcome ${newStudent.name}! You have been matched into a cohort.`, 'success');
  };

  const handleResetSeed = async () => {
    setIsLoading(true);
    try {
      await api.triggerSeed();
      await loadInitialData();
      showToast('Reset to 22 mock students with authentic schedules & skill ratings!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to re-seed data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${theme} min-h-screen bg-[#fdfaf6] dark:bg-[#0c0e14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-up flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold backdrop-blur-md bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white border-orange-500/50">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        students={students}
        activeStudent={activeStudent}
        onSelectStudent={handleSelectStudent}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onTriggerMatch={() => handleTriggerMatch()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSeed={handleResetSeed}
        isMatching={isMatching}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Global Platform Stats Bar */}
        <StatsBar
          totalStudents={students.length}
          groups={groups}
        />

        {/* Tab 1: My Study Group Dashboard */}
        {activeTab === 'my-group' && (
          <GroupDashboard
            group={activeGroup}
            activeStudent={activeStudent}
            onRematchStudent={handleRematchStudent}
            onTriggerMatch={() => handleTriggerMatch()}
            isRematching={isRematching}
          />
        )}

        {/* Tab 2: All Formed Cohorts */}
        {activeTab === 'all-groups' && (
          <AllGroupsView
            groups={groups}
            onSelectGroup={(g) => {
              setActiveGroup(g);
              setActiveTab('my-group');
            }}
            activeGroup={activeGroup}
          />
        )}

        {/* Tab 3: Interactive NetworkX & Louvain Community Graph */}
        {activeTab === 'graph' && (
          <NetworkGraphView
            onSelectStudent={(node) => {
              const s = students.find((item) => String(item.id) === String(node.id));
              if (s) handleSelectStudent(s);
            }}
            activeStudent={activeStudent}
            theme={theme}
          />
        )}

        {/* Tab 4: Student Roster */}
        {activeTab === 'roster' && (
          <StudentsRosterView
            students={students}
            onSelectStudent={handleSelectStudent}
            activeStudent={activeStudent}
          />
        )}

      </main>

      {/* Onboarding Profile Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        courses={courses}
        onStudentCreated={handleStudentCreated}
      />

      {/* Algorithm Config Modal */}
      <AlgorithmSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApplySettings={handleTriggerMatch}
        isMatching={isMatching}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold">StudyMatch — Peer-Matched Study Group Finder with Louvain Community Detection</span>
          <span className="text-slate-400 dark:text-slate-500">FastAPI • SQLAlchemy • NetworkX • Python-Louvain • React • Tailwind</span>
        </div>
      </footer>
    </div>
  );
}

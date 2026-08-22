import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  Clock, 
  Star, 
  User, 
  Sparkles,
  Info
} from 'lucide-react';
import AvailabilityGridPicker from './AvailabilityGridPicker';

const RATING_LABELS = {
  1: { text: '1 - Needs Guidance', color: 'text-amber-500', desc: 'Struggling with fundamentals' },
  2: { text: '2 - Developing', color: 'text-amber-600', desc: 'Can follow along, need practice' },
  3: { text: '3 - Competent', color: 'text-orange-500', desc: 'Solid working understanding' },
  4: { text: '4 - Strong', color: 'text-orange-600', desc: 'Can explain concepts to peers' },
  5: { text: '5 - Expert / Mentor', color: 'text-amber-600 font-black', desc: 'Mastered material, ready to teach' },
};

export default function OnboardingModal({ isOpen, onClose, courses = [], onStudentCreated }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    major: 'Computer Science',
    year: 'Sophomore',
    bio: '',
    preferred_group_size: 4,
    avatar: ''
  });

  const [selectedCourseCodes, setSelectedCourseCodes] = useState(['CS106B']);
  const [availabilitySlots, setAvailabilitySlots] = useState([
    { day_of_week: 0, start_hour: 14, end_hour: 18 },
    { day_of_week: 2, start_hour: 14, end_hour: 18 },
  ]);
  const [topicRatings, setTopicRatings] = useState({
    'CS106B:Recursion': 4,
    'CS106B:Binary Trees': 3,
    'CS106B:Graph Theory': 2,
    'CS106B:Dynamic Programming': 1,
  });

  if (!isOpen) return null;

  const toggleCourse = (code) => {
    let updated;
    if (selectedCourseCodes.includes(code)) {
      if (selectedCourseCodes.length === 1) {
        setErrorMsg('Please select at least one course.');
        return;
      }
      updated = selectedCourseCodes.filter((c) => c !== code);
    } else {
      updated = [...selectedCourseCodes, code];
    }
    setSelectedCourseCodes(updated);
    setErrorMsg('');

    // Ensure topic ratings exist for all topics in newly selected courses
    const newRatings = { ...topicRatings };
    updated.forEach((cCode) => {
      const courseObj = courses.find((c) => c.code === cCode);
      if (courseObj && courseObj.topics) {
        courseObj.topics.forEach((t) => {
          const key = `${cCode}:${t}`;
          if (newRatings[key] === undefined) {
            newRatings[key] = 3; // default neutral
          }
        });
      }
    });
    setTopicRatings(newRatings);
  };

  const handleTopicRatingChange = (courseCode, topicName, value) => {
    setTopicRatings((prev) => ({
      ...prev,
      [`${courseCode}:${topicName}`]: parseInt(value, 10),
    }));
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!profile.name.trim() || !profile.email.trim()) {
        setErrorMsg('Please enter both your name and college email.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedCourseCodes.length === 0) {
        setErrorMsg('Please select at least one course.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (availabilitySlots.length === 0) {
        setErrorMsg('Please select at least a few hours in your weekly schedule.');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formattedRatings = [];
      Object.entries(topicRatings).forEach(([key, rating]) => {
        const [cCode, tName] = key.split(':');
        if (selectedCourseCodes.includes(cCode)) {
          formattedRatings.push({
            course_code: cCode,
            topic_name: tName,
            rating: rating,
          });
        }
      });

      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim().toLowerCase(),
        major: profile.major,
        year: profile.year,
        avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`,
        bio: profile.bio,
        preferred_group_size: profile.preferred_group_size,
        course_codes: selectedCourseCodes,
        availability: availabilitySlots,
        topic_ratings: formattedRatings,
      };

      await onStudentCreated(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create student profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Join StudyMatch</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Step {step} of 4: {
                step === 1 ? 'Profile Info' : 
                step === 2 ? 'Enrolled Courses' : 
                step === 3 ? 'Weekly Free Hours' : 'Self-Rated Topic Strengths'
              }</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-700 dark:text-red-200 flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Profile Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Jordan Hayes"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">College Email *</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="jordan.hayes@stanford.edu"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Major / Department</label>
                  <select
                    value={profile.major}
                    onChange={(e) => setProfile({ ...profile, major: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Physics">Physics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Symbolic Systems">Symbolic Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Academic Year</label>
                  <select
                    value={profile.year}
                    onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Study Habits & Goals (Bio)</label>
                <textarea
                  rows="2"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="e.g., Looking for structured weekly review sessions, love whiteboarding and active recall."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Course Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Select Courses You Are Enrolled In</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose all current classes where you want peer study partners</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courses.map((c) => {
                  const isSelected = selectedCourseCodes.includes(c.code);
                  return (
                    <div
                      key={c.code}
                      onClick={() => toggleCourse(c.code)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 shadow-md shadow-orange-500/10'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-orange-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 ${
                        isSelected ? 'bg-orange-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{c.code}</span>
                          <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-semibold">{c.department}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">{c.name}</p>
                        {c.topics && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.topics.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Weekly Free Time Grid */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <AvailabilityGridPicker
                slots={availabilitySlots}
                onChange={setAvailabilitySlots}
              />
            </div>
          )}

          {/* STEP 4: Topic Strengths / Weaknesses */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-3.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/60 rounded-2xl text-xs text-orange-800 dark:text-orange-200">
                💡 <strong>Peer-Teaching Incentive:</strong> Be honest! Rate your true comfort level (1 = Need Help, 5 = Ready to Teach). StudyMatch matches you with peers who complement your strengths so you can mentor each other!
              </div>

              {selectedCourseCodes.map((cCode) => {
                const cObj = courses.find((c) => c.code === cCode);
                const topics = cObj?.topics || [];
                return (
                  <div key={cCode} className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      {cCode} — {cObj?.name || 'Course Topics'}
                    </h5>

                    <div className="space-y-3 pt-1">
                      {topics.map((t) => {
                        const key = `${cCode}:${t}`;
                        const curRating = topicRatings[key] || 3;
                        const labelInfo = RATING_LABELS[curRating];

                        return (
                          <div key={t} className="bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t}</span>
                              <span className={`text-xs font-bold ${labelInfo.color}`}>
                                {labelInfo.text}
                              </span>
                            </div>
                            
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={curRating}
                              onChange={(e) => handleTopicRatingChange(cCode, t, e.target.value)}
                              className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                            />

                            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                              <span>1: Need Help</span>
                              <span>3: Competent</span>
                              <span>5: Expert Mentor</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-md shadow-orange-500/25 transition-all"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating & Matching...' : 'Complete Profile'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

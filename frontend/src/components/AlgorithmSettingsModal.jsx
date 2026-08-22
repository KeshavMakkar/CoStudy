import React, { useState } from 'react';
import { X, Sliders, Sparkles, Check, RotateCcw, Info } from 'lucide-react';

export default function AlgorithmSettingsModal({ isOpen, onClose, onApplySettings, isMatching }) {
  const [weights, setWeights] = useState({
    w_course: 0.40,
    w_availability: 0.35,
    w_skill: 0.25,
  });

  const [minThreshold, setMinThreshold] = useState(0.15);
  const [targetMinSize, setTargetMinSize] = useState(3);
  const [targetMaxSize, setTargetMaxSize] = useState(5);

  if (!isOpen) return null;

  const totalWeight = weights.w_course + weights.w_availability + weights.w_skill;

  const handleResetDefaults = () => {
    setWeights({
      w_course: 0.40,
      w_availability: 0.35,
      w_skill: 0.25,
    });
    setMinThreshold(0.15);
    setTargetMinSize(3);
    setTargetMaxSize(5);
  };

  const handleApply = (e) => {
    e.preventDefault();
    onApplySettings({
      weights,
      min_threshold: minThreshold,
      target_min_size: targetMinSize,
      target_max_size: targetMaxSize,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-orange-500/15 text-orange-500 border border-orange-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Algorithm & Weights Config</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tune scoring formula & Louvain community parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Formula Callout */}
          <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-xs text-orange-800 dark:text-orange-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-orange-950 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Composite Compatibility Formula:
            </div>
            <p className="font-mono text-[11px] text-orange-700 dark:text-orange-300">
              Score(u, v) = (w1 × CourseJaccard) + (w2 × AvailabilityOverlap) + (w3 × SkillComplementarity)
            </p>
          </div>

          {/* Weight Sliders */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Weight Distribution (Normalized Sum: 1.0)
            </h4>

            {/* w1: Course Overlap */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">w1: Course Overlap (Jaccard)</span>
                <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400">
                  {Math.round((weights.w_course / totalWeight) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={weights.w_course}
                onChange={(e) => setWeights({ ...weights, w_course: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* w2: Availability Overlap */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">w2: Availability Interval Overlap</span>
                <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                  {Math.round((weights.w_availability / totalWeight) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={weights.w_availability}
                onChange={(e) => setWeights({ ...weights, w_availability: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>

            {/* w3: Complementary Skills */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">w3: Complementary Skill / Peer-Teaching</span>
                <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400">
                  {Math.round((weights.w_skill / totalWeight) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={weights.w_skill}
                onChange={(e) => setWeights({ ...weights, w_skill: parseFloat(e.target.value) })}
                className="w-full accent-orange-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Graph & Community Parameters */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Community Detection & Graph Cutoffs
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Min Edge Threshold
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.05"
                    max="0.80"
                    step="0.05"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(parseFloat(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Group Bounds
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{targetMinSize} to {targetMaxSize} members</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              disabled={isMatching}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-md shadow-orange-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Re-Run Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

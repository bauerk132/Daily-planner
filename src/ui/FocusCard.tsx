import React, { useState, useEffect } from 'react';
import { NextAction } from '../models/types.ts';
import { CheckCircle, SkipForward, RotateCcw, Play, Pause, Coffee, Target } from 'lucide-react';

interface FocusCardProps {
  nextAction: NextAction;
  onComplete: () => void;
  onSkip: () => void;
  onReplan: () => void;
  isFocusModeTab?: boolean;
}

export const FocusCard: React.FC<FocusCardProps> = ({
  nextAction,
  onComplete,
  onSkip,
  onReplan,
  isFocusModeTab = false
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(nextAction.duration_minutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    setSecondsRemaining(nextAction.duration_minutes * 60);
    setIsRunning(false);
  }, [nextAction.title, nextAction.duration_minutes]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining <= 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompletedState = nextAction.duration_minutes === 0;

  return (
    <div 
      id="focus-card"
      className={`border rounded-xl bg-white shadow-xs transition-all ${
        isFocusModeTab 
          ? 'max-w-2xl mx-auto p-8 border-stone-300' 
          : 'p-5 border-stone-200'
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            {isFocusModeTab ? 'Deep Focus Mode' : 'Current Active Focus'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <Coffee className="w-3.5 h-3.5 text-stone-400" />
          <span>Next break in: ~{nextAction.next_break_in_minutes || 30}m</span>
        </div>
      </div>

      <div className="my-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-stone-100 text-stone-800 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-semibold text-stone-900 tracking-tight ${isFocusModeTab ? 'text-2xl' : 'text-lg'}`}>
              {nextAction.title}
            </h3>
            <p className="text-xs text-stone-500 mt-1 font-mono">
              Duration Target: {nextAction.duration_minutes} minutes
            </p>
          </div>
        </div>

        {/* Definition of Done */}
        <div className="mt-4 p-3 rounded-lg bg-stone-50 border border-stone-200/80">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Definition of Done
          </span>
          <p className="text-xs text-stone-800 leading-relaxed font-medium">
            {nextAction.definition_of_done || 'Complete this block with singular focus.'}
          </p>
        </div>

        {/* Timer Control */}
        {!isCompletedState && (
          <div className="mt-5 flex items-center justify-between p-4 rounded-xl bg-stone-900 text-white">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 block">
                Session Timer
              </span>
              <span className="text-3xl font-mono font-bold tracking-tight">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
            <button
              id="focus-timer-toggle-btn"
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-medium px-4 py-2 rounded-lg transition-colors border border-stone-700 cursor-pointer"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
        <button
          id="focus-complete-btn"
          onClick={onComplete}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Mark Complete</span>
        </button>

        <button
          id="focus-skip-btn"
          onClick={onSkip}
          className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip</span>
        </button>

        <button
          id="focus-replan-btn"
          onClick={onReplan}
          className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Replan</span>
        </button>
      </div>
    </div>
  );
};

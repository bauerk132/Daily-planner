import React, { useState } from 'react';
import { Task } from '../models/types.ts';
import { Moon, CheckCircle, ArrowRight, Calendar, Sparkles } from 'lucide-react';

interface EveningReviewViewProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  onPrepareTomorrow: (tomorrowPriorities: string[]) => void;
}

export const EveningReviewView: React.FC<EveningReviewViewProps> = ({
  tasks,
  onCompleteTask,
  onPrepareTomorrow
}) => {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  const [reflection, setReflection] = useState<string>('Made solid progress on high-leverage obligations today.');
  const [tomorrowFocus, setTomorrowFocus] = useState<string>('Review practice exam mistakes and follow up with assistance office.');
  const [prepared, setPrepared] = useState<boolean>(false);

  const handleFinishReview = () => {
    setPrepared(true);
    onPrepareTomorrow([tomorrowFocus]);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border border-stone-200 rounded-xl bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-stone-900">Evening Review & Tomorrow Setup</h2>
            <p className="text-xs text-stone-500">
              Close out today with clarity. Unfinished work moves forward naturally without judgment.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Section 1: What was completed? */}
          <div>
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider block mb-2">
              1. What was completed today ({completedTasks.length})
            </span>
            {completedTasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {completedTasks.map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center gap-2 text-emerald-900 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-lg">
                No items marked completed yet. That is okay—some days are about foundation and exploration.
              </p>
            )}
          </div>

          {/* Section 2: What moves forward? */}
          <div>
            <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider block mb-2">
              2. What naturally carries over to tomorrow ({pendingTasks.length})
            </span>
            <div className="space-y-1.5">
              {pendingTasks.map(t => (
                <div key={t.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between">
                  <span className="text-stone-800 font-medium">{t.title}</span>
                  <span className="text-stone-500 font-mono text-[11px]">{t.estimated_duration}m • {t.priority}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Tomorrow's Top Anchor */}
          <div>
            <label className="text-xs font-semibold text-stone-800 uppercase tracking-wider block mb-1.5">
              3. What is the single most important focus for tomorrow morning?
            </label>
            <input
              type="text"
              value={tomorrowFocus}
              onChange={(e) => setTomorrowFocus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium text-stone-900"
            />
          </div>

          {/* Section 4: Reflection */}
          <div>
            <label className="text-xs font-semibold text-stone-800 uppercase tracking-wider block mb-1.5">
              4. Daily Reflection Note
            </label>
            <textarea
              rows={2}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full text-xs p-3 rounded-lg bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 text-stone-800"
            />
          </div>

          {/* Button */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">Rest well. Tomorrow will start with a fresh calm plan.</span>
            <button
              onClick={handleFinishReview}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{prepared ? 'Tomorrow Prepared ✓' : 'Lock in Tomorrow Schedule'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { MorningBriefing } from '../models/types.ts';
import { Sun, Calendar, CheckSquare, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface MorningBriefingCardProps {
  briefing: MorningBriefing;
  onSelectAction?: (actionTitle: string) => void;
}

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  briefing,
  onSelectAction
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Morning Briefing</h2>
            <p className="text-[11px] text-stone-500">{briefing.greeting}</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse briefing' : 'Expand briefing'}
          className="text-stone-400 hover:text-stone-600 p-1 rounded-md hover:bg-stone-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 text-xs">
          {/* Top 3 Priorities */}
          <div>
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
              Today's Top 3 Priorities
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {briefing.top_3_priorities.map((p, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-stone-900 text-white font-mono text-[10px] shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-stone-800 line-clamp-2 leading-tight">
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule & Calendar Digest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-stone-700 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Calendar & Commitments</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {briefing.calendar_summary}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-stone-700 font-semibold mb-1">
                <CheckSquare className="w-3.5 h-3.5 text-stone-500" />
                <span>Task Overview & Deadlines</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {briefing.task_summary}
              </p>
            </div>
          </div>

          {/* Likely Conflicts Warning (if any) */}
          {briefing.likely_conflicts.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Potential Conflict Detected</span>
              </div>
              {briefing.likely_conflicts.map(c => (
                <div key={c.id} className="text-[11px] leading-relaxed">
                  {c.description} {c.suggested_resolution && <span className="font-medium">Recommendation: {c.suggested_resolution}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Recommended First Action */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                Recommended First Move
              </span>
              <span className="font-semibold text-xs text-emerald-900">
                {briefing.recommended_first_action.title} ({briefing.recommended_first_action.duration_minutes}m)
              </span>
            </div>
            {onSelectAction && (
              <button
                onClick={() => onSelectAction(briefing.recommended_first_action.title)}
                className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
              >
                <span>Start Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

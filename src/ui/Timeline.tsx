import React from 'react';
import { DailyPlanBlock, BlockType } from '../models/types.ts';
import { Clock, Calendar, CheckCircle, Coffee, Navigation, Check } from 'lucide-react';

interface TimelineProps {
  schedule: DailyPlanBlock[];
  currentTime: string;
  onCompleteBlock?: (block: DailyPlanBlock) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  schedule,
  currentTime,
  onCompleteBlock
}) => {
  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
      case 'task':
        return <CheckCircle className="w-3.5 h-3.5 text-stone-700" />;
      case 'break':
        return <Coffee className="w-3.5 h-3.5 text-amber-600" />;
      case 'travel':
      case 'buffer':
        return <Navigation className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  const getBlockStyle = (block: DailyPlanBlock) => {
    if (block.status === 'completed') {
      return 'bg-stone-50 border-stone-200 opacity-60 text-stone-500';
    }

    switch (block.type) {
      case 'appointment':
        return 'bg-blue-50/50 border-blue-200 text-stone-900 ring-1 ring-blue-100';
      case 'break':
        return 'bg-amber-50/40 border-amber-200 text-stone-800 border-dashed';
      case 'travel':
      case 'buffer':
        return 'bg-indigo-50/40 border-indigo-200 text-stone-800 border-dashed';
      case 'task':
      default:
        return block.status === 'current'
          ? 'bg-white border-stone-900 ring-2 ring-stone-900/10 shadow-xs'
          : 'bg-white border-stone-200 hover:border-stone-300';
    }
  };

  return (
    <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-600" />
          <h2 className="text-sm font-semibold text-stone-900">Today's Schedule & Time Blocks</h2>
        </div>
        <span className="text-xs text-stone-500 font-mono">
          {schedule.length} scheduled intervals
        </span>
      </div>

      {schedule.length === 0 ? (
        <div className="text-center py-10 text-stone-500 text-xs">
          No scheduled blocks. Click "Replan Remainder" or ask in chat to generate your schedule.
        </div>
      ) : (
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
          {schedule.map((block) => {
            const isCurrent = block.status === 'current';
            const isCompleted = block.status === 'completed';

            return (
              <div key={block.id} className="relative group">
                {/* Node pin on vertical line */}
                <div 
                  className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'bg-stone-400 border-stone-200'
                      : isCurrent
                      ? 'bg-stone-900 border-stone-900 ring-4 ring-stone-200'
                      : block.type === 'appointment'
                      ? 'bg-blue-600 border-white ring-2 ring-blue-200'
                      : 'bg-white border-stone-400'
                  }`}
                />

                {/* Block Card */}
                <div className={`p-3 rounded-lg border transition-all ${getBlockStyle(block)}`}>
                  <div className="flex items-start justify-between gap-3">
                    
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {getBlockIcon(block.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-stone-900">
                            {block.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-900 text-white uppercase tracking-wider">
                              Current
                            </span>
                          )}
                          {block.type === 'appointment' && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                              Fixed Commitment
                            </span>
                          )}
                        </div>

                        {block.notes && (
                          <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                            {block.notes}
                          </p>
                        )}
                        {block.definition_of_done && (
                          <p className="text-[11px] text-stone-600 mt-1 font-mono">
                            Done: {block.definition_of_done}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Time pill & Complete toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/80">
                        {block.start} – {block.end}
                      </span>
                      {block.task_id && onCompleteBlock && !isCompleted && (
                        <button
                          onClick={() => onCompleteBlock(block)}
                          className="p-1 rounded text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Mark task completed"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

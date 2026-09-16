import React, { useState } from 'react';
import { ProjectBreakdown } from '../models/types.ts';
import { Layers, ArrowRight, Clock, CheckCircle2, Sparkles } from 'lucide-react';

interface ProjectBreakdownViewProps {
  onAddTasksToBacklog?: (tasks: Array<{ title: string; estimated_duration: number }>) => void;
}

export const ProjectBreakdownView: React.FC<ProjectBreakdownViewProps> = ({
  onAddTasksToBacklog
}) => {
  const [projectInput, setProjectInput] = useState<string>('Comprehensive Job Search & Portfolio Revision');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [breakdown, setBreakdown] = useState<ProjectBreakdown | null>({
    project_title: 'Comprehensive Job Search & Portfolio Revision',
    total_estimated_hours: 4.5,
    milestones: [
      {
        id: 'm1',
        title: 'Phase 1: Asset Auditing & Resume Polish',
        subtasks: [
          { id: 'st1', title: 'Audit current resume against top 5 target job postings', estimated_minutes: 40, dependencies: [], order: 1 },
          { id: 'st2', title: 'Update project metrics with quantifiable impact figures', estimated_minutes: 35, dependencies: ['st1'], order: 2 }
        ]
      },
      {
        id: 'm2',
        title: 'Phase 2: Portfolio Case Studies',
        subtasks: [
          { id: 'st3', title: 'Write up technical architecture for flagship project', estimated_minutes: 50, dependencies: ['st2'], order: 3 },
          { id: 'st4', title: 'Test live demo links and mobile responsive views', estimated_minutes: 25, dependencies: ['st3'], order: 4 }
        ]
      },
      {
        id: 'm3',
        title: 'Phase 3: High-Yield Applications',
        subtasks: [
          { id: 'st5', title: 'Submit 3 customized applications with tailored cover notes', estimated_minutes: 60, dependencies: ['st4'], order: 5 }
        ]
      }
    ],
    suggested_first_step: 'Spend 20 minutes pulling up the top 3 target job descriptions and highlighting repeated keywords.'
  });

  const handleBreakdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectInput.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/project-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setBreakdown(data);
      }
    } catch (err) {
      console.error('Breakdown error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToQueue = () => {
    if (!breakdown || !onAddTasksToBacklog) return;
    const tasksToAdd: Array<{ title: string; estimated_duration: number }> = [];
    breakdown.milestones.forEach(m => {
      m.subtasks.forEach(st => {
        tasksToAdd.push({
          title: `${m.title}: ${st.title}`,
          estimated_duration: st.estimated_minutes
        });
      });
    });
    onAddTasksToBacklog(tasksToAdd);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search / Generate Box */}
      <div className="border border-stone-200 rounded-xl bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-stone-800" />
          <h2 className="text-base font-semibold text-stone-900">Project Deconstruction Engine</h2>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Convert large, intimidating projects into sequential milestones, actionable subtasks, and a concrete immediate first step.
        </p>

        <form onSubmit={handleBreakdownSubmit} className="flex gap-2">
          <input
            type="text"
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value)}
            placeholder="e.g. Move to a new apartment, Study for Biology final, or Update Portfolio"
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white font-medium"
          />
          <button
            type="submit"
            disabled={isLoading || !projectInput.trim()}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Deconstructing...' : 'Break Down'}</span>
          </button>
        </form>
      </div>

      {/* Breakdown Display */}
      {breakdown && (
        <div className="border border-stone-200 rounded-xl bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 flex-wrap gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Structured Roadmap
              </span>
              <h3 className="text-lg font-semibold text-stone-900">{breakdown.project_title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700 border border-stone-200">
                Total Effort: ~{breakdown.total_estimated_hours} hrs
              </span>
              {onAddTasksToBacklog && (
                <button
                  onClick={handleSendToQueue}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Import Subtasks to Backlog
                </button>
              )}
            </div>
          </div>

          {/* Immediate First Step Callout */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block mb-1">
              Suggested First Action (Low Friction)
            </span>
            <p className="text-xs font-medium text-emerald-950 leading-relaxed">
              {breakdown.suggested_first_step}
            </p>
          </div>

          {/* Milestones and Subtasks */}
          <div className="space-y-4">
            {breakdown.milestones.map((milestone, idx) => (
              <div key={milestone.id} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-md bg-stone-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <h4 className="text-xs font-semibold text-stone-900">{milestone.title}</h4>
                </div>

                <div className="space-y-2 pl-7">
                  {milestone.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-lg bg-white border border-stone-200/90 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-stone-800 font-medium">{st.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500 font-mono text-[11px] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{st.estimated_minutes}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

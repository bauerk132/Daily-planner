import React, { useState, useMemo } from 'react';
import { Task, DailyPlanBlock, TaskPriority } from '../models/types.ts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart,
  Line
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  CalendarCheck, 
  ShieldAlert, 
  Zap,
  Activity
} from 'lucide-react';

interface DailyAnalyticsProps {
  tasks: Task[];
  schedule: DailyPlanBlock[];
  currentTime: string;
}

const PRIORITY_CONFIG: Record<TaskPriority | 'fixed', { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'Urgent', color: '#e11d48', bg: 'bg-rose-50', border: 'border-rose-200' },
  important: { label: 'Important', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200' },
  flexible: { label: 'Flexible', color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200' },
  optional: { label: 'Optional', color: '#78716c', bg: 'bg-stone-100', border: 'border-stone-200' },
  fixed: { label: 'Fixed Event', color: '#4f46e5', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

export const DailyAnalytics: React.FC<DailyAnalyticsProps> = ({
  tasks,
  schedule,
  currentTime
}) => {
  const [activeMetricView, setActiveMetricView] = useState<'distribution' | 'progress'>('distribution');

  // 1. Task Completion Metrics
  const {
    totalTasks,
    completedTasks,
    completionPercentage,
    completedMinutes,
    totalEstimatedMinutes,
    remainingMinutes,
    minutesPercentage,
    completionDonutData,
    priorityCompletionBreakdown,
    taskProgressChartData
  } = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    const completedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimated_duration || 0), 0);
    const totalEstimatedMinutes = tasks.reduce((acc, t) => acc + (t.estimated_duration || 0), 0);
    const remainingMinutes = Math.max(0, totalEstimatedMinutes - completedMinutes);
    const minutesPercentage = totalEstimatedMinutes > 0
      ? Math.round((completedMinutes / totalEstimatedMinutes) * 100)
      : 0;

    const priorityCompletionBreakdown = (['urgent', 'important', 'flexible', 'optional'] as TaskPriority[]).map(prio => {
      const tasksInPrio = tasks.filter(t => t.priority === prio);
      const completedInPrio = tasksInPrio.filter(t => t.status === 'completed');
      const totalMins = tasksInPrio.reduce((acc, t) => acc + (t.estimated_duration || 0), 0);
      const doneMins = completedInPrio.reduce((acc, t) => acc + (t.estimated_duration || 0), 0);
      return {
        priority: prio,
        name: PRIORITY_CONFIG[prio].label,
        totalCount: tasksInPrio.length,
        completedCount: completedInPrio.length,
        pendingCount: tasksInPrio.length - completedInPrio.length,
        percent: tasksInPrio.length > 0 ? Math.round((completedInPrio.length / tasksInPrio.length) * 100) : 0,
        totalMinutes: totalMins,
        completedMinutes: doneMins,
        remainingMinutes: Math.max(0, totalMins - doneMins),
        color: PRIORITY_CONFIG[prio].color
      };
    }).filter(p => p.totalCount > 0);

    const taskProgressChartData = priorityCompletionBreakdown.map(p => ({
      name: p.name,
      'Completed (mins)': p.completedMinutes,
      'Remaining (mins)': p.remainingMinutes,
      completedCount: p.completedCount,
      totalCount: p.totalCount
    }));

    const completionDonutData = [
      { name: 'Completed', value: completedTasks.length, fill: '#10b981' },
      { name: 'Pending', value: Math.max(0, totalTasks - completedTasks.length), fill: '#e5e7eb' },
    ];

    return {
      totalTasks,
      completedTasks,
      completionPercentage,
      completedMinutes,
      totalEstimatedMinutes,
      remainingMinutes,
      minutesPercentage,
      completionDonutData,
      priorityCompletionBreakdown,
      taskProgressChartData
    };
  }, [tasks]);

  // 2. Scheduled Time Distribution across Priority Levels (calculated from schedule blocks)
  const { totalScheduledMinutes, priorityDistributionData } = useMemo(() => {
    const getBlockDuration = (start: string, end: string): number => {
      const [sH, sM] = start.split(':').map(Number);
      const [eH, eM] = end.split(':').map(Number);
      return (eH * 60 + eM) - (sH * 60 + sM);
    };

    const priorityTimeMap: Record<string, { minutes: number; blockCount: number }> = {
      urgent: { minutes: 0, blockCount: 0 },
      important: { minutes: 0, blockCount: 0 },
      flexible: { minutes: 0, blockCount: 0 },
      optional: { minutes: 0, blockCount: 0 },
      fixed: { minutes: 0, blockCount: 0 },
    };

    schedule.forEach(block => {
      const duration = Math.max(0, getBlockDuration(block.start, block.end));
      const prioKey = block.priority in priorityTimeMap ? block.priority : 'optional';
      priorityTimeMap[prioKey].minutes += duration;
      priorityTimeMap[prioKey].blockCount += 1;
    });

    const totalScheduledMinutes = Object.values(priorityTimeMap).reduce((acc, val) => acc + val.minutes, 0);

    const priorityDistributionData = [
      {
        priority: 'urgent' as const,
        name: 'Urgent',
        minutes: priorityTimeMap.urgent.minutes,
        hours: Number((priorityTimeMap.urgent.minutes / 60).toFixed(1)),
        blocks: priorityTimeMap.urgent.blockCount,
        color: PRIORITY_CONFIG.urgent.color,
        fill: PRIORITY_CONFIG.urgent.color
      },
      {
        priority: 'important' as const,
        name: 'Important',
        minutes: priorityTimeMap.important.minutes,
        hours: Number((priorityTimeMap.important.minutes / 60).toFixed(1)),
        blocks: priorityTimeMap.important.blockCount,
        color: PRIORITY_CONFIG.important.color,
        fill: PRIORITY_CONFIG.important.color
      },
      {
        priority: 'flexible' as const,
        name: 'Flexible',
        minutes: priorityTimeMap.flexible.minutes,
        hours: Number((priorityTimeMap.flexible.minutes / 60).toFixed(1)),
        blocks: priorityTimeMap.flexible.blockCount,
        color: PRIORITY_CONFIG.flexible.color,
        fill: PRIORITY_CONFIG.flexible.color
      },
      {
        priority: 'optional' as const,
        name: 'Optional',
        minutes: priorityTimeMap.optional.minutes,
        hours: Number((priorityTimeMap.optional.minutes / 60).toFixed(1)),
        blocks: priorityTimeMap.optional.blockCount,
        color: PRIORITY_CONFIG.optional.color,
        fill: PRIORITY_CONFIG.optional.color
      },
      {
        priority: 'fixed' as const,
        name: 'Fixed Appts',
        minutes: priorityTimeMap.fixed.minutes,
        hours: Number((priorityTimeMap.fixed.minutes / 60).toFixed(1)),
        blocks: priorityTimeMap.fixed.blockCount,
        color: PRIORITY_CONFIG.fixed.color,
        fill: PRIORITY_CONFIG.fixed.color
      }
    ].filter(d => d.minutes > 0 || d.blocks > 0);

    return { totalScheduledMinutes, priorityDistributionData };
  }, [schedule]);

  return (
    <div id="daily-analytics-widget" className="border border-stone-200 rounded-xl bg-white p-5 shadow-xs transition-all space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Execution & Time Distribution</h2>
            <p className="text-[11px] text-stone-500">
              Live pacing against obligations and daylight allocations
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
          <button
            id="view-toggle-distribution"
            onClick={() => setActiveMetricView('distribution')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
              activeMetricView === 'distribution' 
                ? 'bg-white text-stone-900 font-semibold shadow-xs' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <PieChartIcon className="w-3 h-3" />
            <span>Priority Time</span>
          </button>
          <button
            id="view-toggle-progress"
            onClick={() => setActiveMetricView('progress')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] font-medium ${
              activeMetricView === 'progress' 
                ? 'bg-white text-stone-900 font-semibold shadow-xs' 
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Task Progress</span>
          </button>
        </div>
      </div>

      {/* Top 3 High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Tasks Completion */}
        <div className="p-3.5 rounded-xl bg-stone-50/90 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
              Tasks Completed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-stone-900">{completedTasks.length}</span>
              <span className="text-xs text-stone-500 font-mono">/ {totalTasks} total</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 block mt-0.5">
              {completionPercentage}% tasks finished
            </span>
          </div>
          <div className="w-11 h-11 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionDonutData}
                  innerRadius={15}
                  outerRadius={20}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {completionDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 2: Focus Time Executed */}
        <div className="p-3.5 rounded-xl bg-stone-50/90 border border-stone-200">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
            Focus Time Logged
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-stone-900">{completedMinutes}m</span>
            <span className="text-xs text-stone-500 font-mono">/ {totalEstimatedMinutes}m</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, minutesPercentage)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Scheduled Daylight Allocation */}
        <div className="p-3.5 rounded-xl bg-stone-50/90 border border-stone-200">
          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
            Scheduled Blocks
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-stone-900">
              {(totalScheduledMinutes / 60).toFixed(1)} hrs
            </span>
            <span className="text-xs text-stone-500 font-mono">({schedule.length} blocks)</span>
          </div>
          <span className="text-[11px] text-stone-600 font-medium block mt-0.5 truncate">
            Current time: <span className="font-mono font-semibold text-stone-900">{currentTime}</span>
          </span>
        </div>
      </div>

      {/* Main Interactive Visualizations */}
      {activeMetricView === 'distribution' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Scheduled Time Distribution by Priority Level
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              Total {totalScheduledMinutes} mins planned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Horizontal Bar Chart (7 cols) */}
            <div className="md:col-span-7 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={priorityDistributionData}
                  margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    unit="m" 
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    stroke="#d6d3d1"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#292524', fontWeight: 500 }}
                    width={82}
                    stroke="#d6d3d1"
                  />
                  <Tooltip 
                    formatter={(val: number) => [`${val} mins (${(val / 60).toFixed(1)} hrs)`, 'Allocated Time']}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '8px', 
                      border: '1px solid #e7e5e4', 
                      fontSize: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="minutes" 
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  >
                    {priorityDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart with Breakdown Chips (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-2 border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-4">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistributionData}
                      dataKey="minutes"
                      nameKey="name"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {priorityDistributionData.map((entry, idx) => (
                        <Cell key={`prio-donut-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [`${val}m`, 'Duration']}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '8px', 
                        border: '1px solid #e7e5e4', 
                        fontSize: '11px' 
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority Chips */}
              <div className="space-y-1.5 text-xs">
                {priorityDistributionData.map((item) => {
                  const share = totalScheduledMinutes > 0 
                    ? Math.round((item.minutes / totalScheduledMinutes) * 100) 
                    : 0;
                  return (
                    <div key={item.priority} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="font-medium text-stone-800">{item.name}</span>
                      </div>
                      <div className="font-mono text-stone-500">
                        <span className="font-semibold text-stone-900">{item.minutes}m</span>
                        <span className="text-stone-400 ml-1">({share}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Progress View: Stacked Completion by Priority */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Task Workload Progress by Priority (Completed vs Remaining Minutes)
            </span>
            <span className="text-[11px] text-stone-500 font-mono">
              {remainingMinutes}m pending
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taskProgressChartData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#292524', fontWeight: 500 }}
                  stroke="#d6d3d1"
                />
                <YAxis 
                  unit="m" 
                  tick={{ fontSize: 11, fill: '#78716c' }}
                  stroke="#d6d3d1"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px', 
                    border: '1px solid #e7e5e4', 
                    fontSize: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="Completed (mins)" 
                  stackId="a" 
                  fill="#10b981" 
                  radius={[0, 0, 0, 0]}
                  barSize={32}
                />
                <Bar 
                  dataKey="Remaining (mins)" 
                  stackId="a" 
                  fill="#e7e5e4" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Status Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {priorityCompletionBreakdown.map((item) => (
              <div 
                key={item.priority}
                className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800">{item.name}</span>
                  <span className="text-[10px] font-mono font-bold text-stone-600 bg-stone-200/80 px-1 rounded">
                    {item.completedCount}/{item.totalCount}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono mb-1">
                    <span>Progress</span>
                    <span>{item.percent}%</span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-1 rounded-full bg-emerald-600"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

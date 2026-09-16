import React, { useState } from 'react';
import { Task, TaskPriority, TaskCategory, RecurrenceRule, RecurrenceFrequency } from '../models/types.ts';
import { CheckSquare, Plus, Clock, AlertCircle, Shield, Briefcase, GraduationCap, FileText, Repeat, Calendar } from 'lucide-react';

interface TaskBacklogProps {
  tasks: Task[];
  deferredTasks: Array<{ task_id: string; title: string; reason: string }>;
  onCompleteTask: (taskId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
}

export const TaskBacklog: React.FC<TaskBacklogProps> = ({
  tasks,
  deferredTasks,
  onCompleteTask,
  onAddTask
}) => {
  const [filter, setFilter] = useState<'pending' | 'recurring' | 'completed' | 'all'>('pending');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newPriority, setNewPriority] = useState<TaskPriority>('important');
  const [newCategory, setNewCategory] = useState<TaskCategory>('admin');
  const [newRecurrence, setNewRecurrence] = useState<'none' | RecurrenceFrequency>('none');
  const [newDueDate, setNewDueDate] = useState<string>('');

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'recurring') return Boolean(t.recurrence_rule || t.recurring_parent_id || t.labels?.includes('recurring'));
    return true;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Urgent</span>;
      case 'important':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Important</span>;
      case 'flexible':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Flexible</span>;
      case 'optional':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">Optional</span>;
    }
  };

  const getCategoryIcon = (category?: TaskCategory) => {
    switch (category) {
      case 'safety_housing_admin':
        return <Shield className="w-3 h-3 text-rose-600" title="Housing / Safety / Admin" />;
      case 'academic':
        return <GraduationCap className="w-3 h-3 text-purple-600" title="Academic / Exam" />;
      case 'work_career':
        return <Briefcase className="w-3 h-3 text-emerald-600" title="Work / Career" />;
      default:
        return <FileText className="w-3 h-3 text-stone-500" title="General Task" />;
    }
  };

  const getRecurrenceBadge = (task: Task) => {
    if (!task.recurrence_rule && !task.recurring_parent_id && !task.labels?.includes('recurring')) {
      return null;
    }

    const freq: string = typeof task.recurrence_rule === 'string'
      ? task.recurrence_rule
      : task.recurrence_rule?.frequency || 'recurring';

    const labelMap: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      weekdays: 'Weekdays',
      monthly: 'Monthly',
      recurring: 'Recurring'
    };

    const isAutoInstantiated = Boolean(task.recurring_parent_id || task.labels?.includes('recurring_instance'));

    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
        title={isAutoInstantiated ? "Auto-instantiated from recurring rule when due date arrived" : "Recurring Task"}
      >
        <Repeat className="w-2.5 h-2.5 text-indigo-600" />
        <span>{labelMap[freq] || 'Recurring'}</span>
        {isAutoInstantiated && (
          <span className="text-[9px] text-indigo-500 font-normal">auto</span>
        )}
      </span>
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const taskLabels = [newCategory];
    if (newRecurrence !== 'none') {
      taskLabels.push('recurring');
    }

    onAddTask({
      title: newTitle.trim(),
      estimated_duration: Number(newDuration) || 30,
      priority: newPriority,
      category: newCategory,
      due_date: newDueDate || todayStr,
      labels: taskLabels,
      energy_required: newPriority === 'urgent' ? 'high' : 'medium',
      recurrence_rule: newRecurrence !== 'none' ? newRecurrence : undefined
    });
    setNewTitle('');
    setNewDueDate('');
    setNewRecurrence('none');
    setIsAdding(false);
  };

  const recurringCount = tasks.filter(t => t.recurrence_rule || t.recurring_parent_id || t.labels?.includes('recurring')).length;

  return (
    <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-stone-600" />
          <h2 className="text-sm font-semibold text-stone-900">Task Backlog & Queue</h2>
          {recurringCount > 0 && (
            <span 
              className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1 hidden sm:inline-flex"
              title="Recurring tasks automatically instantiate in this backlog when their due date arrives"
            >
              <Repeat className="w-2.5 h-2.5 text-indigo-500" />
              <span>{recurringCount} recurring</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="my-3 p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
          <input
            type="text"
            placeholder="e.g. Call assistance office or Daily morning routine"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded bg-white border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 font-medium"
            autoFocus
          />
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1">
              <span className="text-stone-500">Duration:</span>
              <input
                type="number"
                min="5"
                step="5"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-16 px-1.5 py-1 bg-white border border-stone-300 rounded font-mono text-xs"
              />
              <span className="text-stone-500">m</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-stone-500">Priority:</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="px-2 py-1 bg-white border border-stone-300 rounded text-xs"
              >
                <option value="urgent">Urgent</option>
                <option value="important">Important</option>
                <option value="flexible">Flexible</option>
                <option value="optional">Optional</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-stone-500">Category:</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="px-2 py-1 bg-white border border-stone-300 rounded text-xs"
              >
                <option value="safety_housing_admin">Housing / Safety / Admin</option>
                <option value="academic">Academic / Exam</option>
                <option value="work_career">Work / Job Search</option>
                <option value="admin">Administrative</option>
                <option value="personal">Personal / Optional</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-stone-500 flex items-center gap-0.5">
                <Repeat className="w-3 h-3 text-stone-400" />
                Recurrence:
              </span>
              <select
                value={newRecurrence}
                onChange={(e) => setNewRecurrence(e.target.value as any)}
                className="px-2 py-1 bg-white border border-stone-300 rounded text-xs font-medium text-stone-800"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-stone-500">Due:</span>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="px-2 py-1 bg-white border border-stone-300 rounded text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="ml-auto bg-stone-900 text-white text-xs font-semibold px-3 py-1 rounded hover:bg-stone-800 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 my-3 text-xs flex-wrap">
        {(['pending', 'recurring', 'completed', 'all'] as const).map((tab) => {
          const count = tasks.filter(t => {
            if (tab === 'all') return true;
            if (tab === 'completed') return t.status === 'completed';
            if (tab === 'recurring') return Boolean(t.recurrence_rule || t.recurring_parent_id || t.labels?.includes('recurring'));
            return t.status !== 'completed';
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`capitalize px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === tab ? 'bg-stone-200 text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab === 'recurring' && <Repeat className="w-3 h-3 text-stone-600" />}
              <span>{tab}</span>
              <span className="text-[10px] font-mono text-stone-400">({count})</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-6 text-center text-stone-400 text-xs italic">
            No {filter === 'all' ? '' : filter} tasks in the backlog.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'completed';
            return (
              <div
                key={t.id}
                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  isDone ? 'bg-stone-50/70 border-stone-200 opacity-60' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onCompleteTask(t.id)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 w-4 h-4 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getCategoryIcon(t.category)}
                      <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {t.title}
                      </span>
                      {getPriorityBadge(t.priority)}
                      {getRecurrenceBadge(t)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {t.deadline && (
                        <span className="text-[10px] text-rose-600 font-mono block">
                          Deadline: {t.deadline}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-stone-400" />
                          <span>Due: {t.due_date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs text-stone-500 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{t.estimated_duration}m</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deferred / Rescheduled Tasks Card */}
      {deferredTasks.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-stone-700 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Rescheduled to Preserve Focus ({deferredTasks.length})</span>
          </div>
          <p className="text-[11px] text-stone-500 mb-2">
            These tasks were deferred without penalty because today's schedule is responsibly full.
          </p>
          <div className="space-y-1">
            {deferredTasks.map((dt) => (
              <div key={dt.task_id} className="text-[11px] text-stone-600 flex items-start gap-1.5">
                <span className="text-stone-400">•</span>
                <span className="font-medium text-stone-800">{dt.title}:</span>
                <span className="text-stone-500">{dt.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

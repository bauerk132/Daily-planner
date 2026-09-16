/**
 * LifeOps Daily Planner - Web Application Interface
 */

import React, { useState, useEffect } from 'react';
import { Header } from './ui/Header.tsx';
import { FocusCard } from './ui/FocusCard.tsx';
import { Timeline } from './ui/Timeline.tsx';
import { MorningBriefingCard } from './ui/MorningBriefingCard.tsx';
import { TaskBacklog } from './ui/TaskBacklog.tsx';
import { ChatPanel } from './ui/ChatPanel.tsx';
import { ProjectBreakdownView } from './ui/ProjectBreakdownView.tsx';
import { EveningReviewView } from './ui/EveningReviewView.tsx';
import { TestRunnerView } from './ui/TestRunnerView.tsx';
import { DailyAnalytics } from './ui/DailyAnalytics.tsx';
import { 
  StructuredPlan, 
  MorningBriefing, 
  Task, 
  CalendarEvent, 
  ChatMessage, 
  DailyPlanBlock 
} from './models/types.ts';
import { TestCaseResult, runAllAgentTests } from './tests/agent_tests.ts';
import { Sparkles, Calendar, CheckSquare, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('today');
  const [plan, setPlan] = useState<StructuredPlan | null>(null);
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [simulatedTime, setSimulatedTime] = useState<string>('09:00');
  const [userEnergy, setUserEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);

  // Initial data fetch
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/plan');
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
          setBriefing(data.briefing);
          setTasks(data.tasks);
          setEvents(data.events);
          setSimulatedTime(data.simulatedTime || '09:00');
          setUserEnergy(data.userEnergy || 'medium');
          setChatHistory(data.chatHistory || []);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    }
    loadData();

    // Also run initial test suite results
    runAllAgentTests().then(results => setTestResults(results)).catch(() => {});
  }, []);

  // Time change
  const handleTimeChange = async (newTime: string) => {
    setSimulatedTime(newTime);
    setIsReplanning(true);
    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime: newTime, userEnergy })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (err) {
      console.error('Replan failed:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  // Energy change
  const handleEnergyChange = async (newEnergy: 'low' | 'medium' | 'high') => {
    setUserEnergy(newEnergy);
    setIsReplanning(true);
    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime: simulatedTime, userEnergy: newEnergy })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (err) {
      console.error('Energy update failed:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  // 1-Click Replan
  const handleReplan = async () => {
    setIsReplanning(true);
    try {
      const res = await fetch('/api/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTime: simulatedTime, userEnergy })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (err) {
      console.error('Replan failed:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  // Conversational chat
  const handleSendMessage = async (text: string) => {
    setIsChatLoading(true);
    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, data.message]);
        if (data.plan) {
          setPlan(data.plan);
        }
        // Refresh tasks as well in case checked off
        const tRes = await fetch('/api/tasks');
        if (tRes.ok) {
          const tData = await tRes.json();
          setTasks(tData);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Complete current focus task
  const handleCompleteFocus = () => {
    if (plan?.next_action.task_id) {
      handleCompleteTask(plan.next_action.task_id);
    } else {
      handleReplan();
    }
  };

  // Skip focus task
  const handleSkipFocus = () => {
    handleReplan();
  };

  // Add new task
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'status'>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(prev => [...prev, data.task]);
        setPlan(data.plan);
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center mx-auto animate-pulse">
            LO
          </div>
          <p className="text-xs text-stone-600 font-medium">Booting LifeOps Daily Planner Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      <Header
        simulatedTime={simulatedTime}
        onTimeChange={handleTimeChange}
        userEnergy={userEnergy}
        onEnergyChange={handleEnergyChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReplan={handleReplan}
        isReplanning={isReplanning}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: TODAY VIEW */}
        {activeTab === 'today' && plan && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Center: Briefing, Focus Card, Timeline, Backlog (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {briefing && (
                <MorningBriefingCard 
                  briefing={briefing} 
                  onSelectAction={() => setActiveTab('focus')}
                />
              )}

              <FocusCard
                nextAction={plan.next_action}
                onComplete={handleCompleteFocus}
                onSkip={handleSkipFocus}
                onReplan={handleReplan}
              />

              <Timeline
                schedule={plan.schedule}
                currentTime={simulatedTime}
                onCompleteBlock={(block) => block.task_id && handleCompleteTask(block.task_id)}
              />

              <DailyAnalytics
                tasks={tasks}
                schedule={plan.schedule}
                currentTime={simulatedTime}
              />

              <TaskBacklog
                tasks={tasks}
                deferredTasks={plan.deferred_tasks}
                onCompleteTask={handleCompleteTask}
                onAddTask={handleAddTask}
              />
            </div>

            {/* Right: Conversational Chat Panel (5 cols) */}
            <div className="lg:col-span-5 sticky top-24">
              <ChatPanel
                messages={chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
              />
            </div>
          </div>
        )}

        {/* TAB 2: FOCUS MODE */}
        {activeTab === 'focus' && plan && (
          <div className="py-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">Focus Chamber</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                No backlog, no pending obligations. Just the current action in front of you.
              </p>
            </div>
            <FocusCard
              nextAction={plan.next_action}
              onComplete={handleCompleteFocus}
              onSkip={handleSkipFocus}
              onReplan={handleReplan}
              isFocusModeTab={true}
            />
          </div>
        )}

        {/* TAB 3: MORNING BRIEFING */}
        {activeTab === 'briefing' && briefing && (
          <div className="max-w-3xl mx-auto py-4">
            <MorningBriefingCard briefing={briefing} />
          </div>
        )}

        {/* TAB 4: PROJECT BREAKDOWN */}
        {activeTab === 'project' && (
          <div className="py-4">
            <ProjectBreakdownView 
              onAddTasksToBacklog={(newTasks) => {
                newTasks.forEach(t => handleAddTask({
                  title: t.title,
                  estimated_duration: t.estimated_duration,
                  priority: 'important',
                  category: 'project',
                  labels: ['project_deconstructed']
                }));
                setActiveTab('today');
              }}
            />
          </div>
        )}

        {/* TAB 5: EVENING REVIEW */}
        {activeTab === 'evening' && (
          <div className="py-4">
            <EveningReviewView
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              onPrepareTomorrow={(tomorrowPriorities) => {
                handleSendMessage(`I'm wrapping up my day. Tomorrow's top priority is: ${tomorrowPriorities.join(', ')}.`);
                setActiveTab('today');
              }}
            />
          </div>
        )}

        {/* TAB 6: AUTOMATED TESTS */}
        {activeTab === 'tests' && (
          <div className="py-4">
            <TestRunnerView initialResults={testResults} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        <p>LifeOps Daily Planner • Sub-Agent Interface for LifeOps Multi-Agent Ecosystem</p>
      </footer>
    </div>
  );
}

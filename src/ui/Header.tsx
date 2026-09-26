import React from 'react';
import { Clock, Zap, Play, RotateCcw, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  simulatedTime: string;
  onTimeChange: (time: string) => void;
  userEnergy: 'low' | 'medium' | 'high';
  onEnergyChange: (energy: 'low' | 'medium' | 'high') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReplan: () => void;
  isReplanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  simulatedTime,
  onTimeChange,
  userEnergy,
  onEnergyChange,
  activeTab,
  onTabChange,
  onReplan,
  isReplanning
}) => {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-stone-50 flex items-center justify-center font-bold tracking-tight text-sm shadow-sm">
              LO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 tracking-tight text-base">LifeOps Daily Planner</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Sub-Agent Ready
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">Personal operations & adaptive time-blocking</p>
            </div>
          </div>

          {/* Controls: Time & Energy & Replan */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick time jump controls */}
            <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 text-xs border border-stone-200">
              <Clock className="w-3.5 h-3.5 text-stone-500 ml-1" aria-hidden="true" />
              <input
                type="time"
                value={simulatedTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="bg-white px-2 py-0.5 rounded text-stone-800 font-mono text-xs border border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                title="Current time in LifeOps"
                aria-label="Current simulated time"
              />
              <div className="hidden md:flex items-center gap-1" role="group" aria-label="Quick time jump">
                <button
                  onClick={() => onTimeChange('09:00')}
                  aria-pressed={simulatedTime === '09:00'}
                  className={`px-1.5 py-0.5 rounded text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${simulatedTime === '09:00' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:bg-stone-200'}`}
                >
                  9 AM
                </button>
                <button
                  onClick={() => onTimeChange('12:00')}
                  aria-pressed={simulatedTime === '12:00'}
                  className={`px-1.5 py-0.5 rounded text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${simulatedTime === '12:00' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:bg-stone-200'}`}
                >
                  12 PM
                </button>
                <button
                  onClick={() => onTimeChange('16:00')}
                  aria-pressed={simulatedTime === '16:00'}
                  className={`px-1.5 py-0.5 rounded text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${simulatedTime === '16:00' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600 hover:bg-stone-200'}`}
                >
                  4 PM
                </button>
              </div>
            </div>

            {/* Energy selector */}
            <div className="hidden sm:flex items-center gap-1 bg-stone-100 rounded-lg p-1 border border-stone-200" role="group" aria-label="Energy level">
              <Zap className="w-3.5 h-3.5 text-amber-500 ml-1" aria-hidden="true" />
              {(['low', 'medium', 'high'] as const).map((energy) => (
                <button
                  key={energy}
                  onClick={() => onEnergyChange(energy)}
                  aria-pressed={userEnergy === energy}
                  className={`capitalize px-2 py-0.5 rounded text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 ${
                    userEnergy === energy 
                      ? 'bg-white text-stone-900 font-semibold shadow-2xs' 
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  {energy}
                </button>
              ))}
            </div>

            {/* Replan Button */}
            <button
              id="replan-btn-header"
              onClick={onReplan}
              disabled={isReplanning}
              aria-label={isReplanning ? "Replanning..." : "Replan Remainder"}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReplanning ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Replan Remainder</span>
              <span className="sm:hidden">Replan</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-4 border-t border-stone-100 py-1.5 overflow-x-auto text-xs font-medium text-stone-600 scrollbar-none" role="tablist" aria-label="Main Navigation">
          {[
            { id: 'today', label: 'Today View' },
            { id: 'focus', label: 'Focus Mode' },
            { id: 'briefing', label: 'Morning Briefing' },
            { id: 'project', label: 'Project Breakdown' },
            { id: 'evening', label: 'Evening Review' },
            { id: 'tests', label: 'Automated Tests (10/10)' }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-1 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white font-medium'
                  : 'hover:bg-stone-100 text-stone-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

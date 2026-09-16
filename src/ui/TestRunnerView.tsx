import React, { useState } from 'react';
import { TestCaseResult } from '../tests/agent_tests.ts';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck, Cpu } from 'lucide-react';

interface TestRunnerViewProps {
  initialResults?: TestCaseResult[];
}

export const TestRunnerView: React.FC<TestRunnerViewProps> = ({ initialResults }) => {
  const [results, setResults] = useState<TestCaseResult[]>(initialResults || []);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/tests');
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = results.filter(r => r.passed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="border border-stone-200 rounded-xl bg-white p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-stone-800" />
            <h2 className="text-base font-semibold text-stone-900">LifeOps Automated Test Suite</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Verification for all 10 agent reasoning, constraint-handling, and edge case scenarios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {results.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-xs font-mono font-semibold border border-stone-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{passedCount}/{results.length} Passing</span>
            </div>
          )}
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running 10 Tests...' : 'Run All Tests'}</span>
          </button>
        </div>
      </div>

      {/* Test List Table */}
      <div className="border border-stone-200 rounded-xl bg-white overflow-hidden shadow-xs">
        <div className="divide-y divide-stone-100">
          {results.map((test) => (
            <div key={test.id} className="p-4 hover:bg-stone-50/70 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {test.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-500">#{test.id}</span>
                      <h4 className="text-xs font-semibold text-stone-900">{test.name}</h4>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {test.message}
                    </p>
                    {test.details && (
                      <div className="mt-2 text-[11px] font-mono text-stone-500 bg-stone-50 p-2 rounded border border-stone-200/80 overflow-x-auto">
                        {JSON.stringify(test.details)}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                    test.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {test.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Filter, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SimulationLog } from '../types';

interface LogsConsoleProps {
  logs: SimulationLog[];
}

export const LogsConsole: React.FC<LogsConsoleProps> = ({ logs }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === 'ALL') return true;
    return log.level.toUpperCase() === levelFilter.toUpperCase();
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col h-[650px] text-xs">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Simulation Kernel Log Console
            </h3>
            <p className="text-[11px] text-slate-500">
              Live stdout and logging events from LLM agent reasoning & market matching
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Level Filter */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {['ALL', 'INFO', 'WARNING', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition ${
                  levelFilter === lvl
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none font-medium">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>

      {/* Log Output Stream - Clean Light Theme */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-slate-50/90 text-slate-800 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
            <p className="font-semibold text-slate-600 text-xs">No system logs recorded for current run</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Launch a simulation to stream live prompt reasoning, agent orders, and market ticks.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const lvl = log.level.toUpperCase();
            const badgeStyle =
              lvl === 'ERROR'
                ? 'bg-rose-100 text-rose-700 border-rose-200'
                : lvl === 'WARNING' || lvl === 'WARN'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : lvl === 'INFO'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-slate-200 text-slate-600 border-slate-300';

            const textColor =
              lvl === 'ERROR'
                ? 'text-rose-700 font-medium'
                : lvl === 'WARNING' || lvl === 'WARN'
                ? 'text-amber-800'
                : 'text-slate-700';

            return (
              <div
                key={log.id}
                className="leading-relaxed hover:bg-white px-2 py-1 rounded-md border border-transparent hover:border-slate-200 flex items-start space-x-2.5 transition"
              >
                <span className="text-slate-400 select-none text-[10px] whitespace-nowrap pt-0.5">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}
                </span>
                <span
                  className={`font-bold text-[9px] uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${badgeStyle}`}
                >
                  {lvl}
                </span>
                <span className={`${textColor} break-all flex-1`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Showing {filteredLogs.length} of {logs.length} logged events</span>
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time Stream Connected</span>
        </span>
      </div>
    </div>
  );
};

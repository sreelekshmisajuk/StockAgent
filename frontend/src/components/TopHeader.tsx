import React from 'react';
import { Play, Pause, Square, Plus } from 'lucide-react';
import { SimulationRun } from '../types';

interface TopHeaderProps {
  activeTab: string;
  activeSim: SimulationRun | null;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onOpenNewSimModal: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  activeSim,
  onStart,
  onPause,
  onResume,
  onStop,
  onOpenNewSimModal,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard & Market Overview';
      case 'agents': return 'AI Investor Personas & Portfolios';
      case 'events': return 'External Events & News';
      case 'simulation': return 'Live Simulation Cockpit & Execution';
      case 'reports': return 'Research Findings & Report Exports';
      default: return 'StockAgent Overview';
    }
  };

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'RUNNING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Live</span>;
      case 'PAUSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Paused</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">Ready</span>;
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title */}
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-semibold text-slate-900 tracking-tight">
          {getTabTitle(activeTab)}
        </h1>
        {activeSim && statusBadge(activeSim.status)}
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2.5">
        {activeSim && activeSim.status === 'PENDING' && (
          <button
            onClick={() => onStart(activeSim.id)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start</span>
          </button>
        )}

        {activeSim && activeSim.status === 'RUNNING' && (
          <>
            <button
              onClick={() => onPause(activeSim.id)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
            <button
              onClick={() => onStop(activeSim.id)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          </>
        )}

        {activeSim && activeSim.status === 'PAUSED' && (
          <>
            <button
              onClick={() => onResume(activeSim.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
            <button
              onClick={() => onStop(activeSim.id)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          </>
        )}

        <button
          onClick={onOpenNewSimModal}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Simulation</span>
        </button>
      </div>
    </header>
  );
};

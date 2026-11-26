import React from 'react';
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Activity,
  BarChart3,
  Plus,
} from 'lucide-react';
import { SimulationRun } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  simulations: SimulationRun[];
  activeSim: SimulationRun | null;
  onSelectSim: (id: string) => void;
  backendConnected: boolean;
  wsConnected: boolean;
  onOpenNewSimModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  simulations,
  activeSim,
  onSelectSim,
  backendConnected,
  wsConnected,
  onOpenNewSimModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agents', label: 'AI Investors', icon: Users },
    { id: 'events', label: 'External Events', icon: Newspaper },
    { id: 'simulation', label: 'Live Simulation', icon: Activity },
    { id: 'reports', label: 'Research & Reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            SA
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm tracking-tight block leading-tight">
              StockAgent
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Market Simulation</span>
          </div>
        </div>
      </div>

      {/* Simulation Selector */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-1 text-[11px]">
          <span className="text-slate-400 font-medium">Active Experiment</span>
          <button
            onClick={onOpenNewSimModal}
            className="text-blue-600 font-semibold hover:underline flex items-center space-x-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>
        <select
          aria-label="Select simulation"
          value={activeSim?.id || ''}
          onChange={(e) => onSelectSim(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm truncate"
        >
          {simulations.length === 0 ? (
            <option value="">No simulation loaded</option>
          ) : (
            simulations.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.name} ({sim.status})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection Indicator Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
        <span>System Status</span>
        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="font-medium text-slate-600">{backendConnected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>
    </aside>
  );
};

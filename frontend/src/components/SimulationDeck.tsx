import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  FastForward,
  Settings2,
  Sliders,
  DollarSign,
  Calendar,
  Users,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { SimulationRun, SimulationCreate, CustomEventCreate } from '../types';

interface SimulationDeckProps {
  activeSim: SimulationRun | null;
  onStart: (id: string) => Promise<void>;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onCreate: (config: SimulationCreate) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const AVAILABLE_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'A', 'B'];

export const SimulationDeck: React.FC<SimulationDeckProps> = ({
  activeSim,
  onStart,
  onPause,
  onResume,
  onStop,
  onCreate,
  isModalOpen,
  setIsModalOpen,
}) => {
  const [form, setForm] = useState<SimulationCreate>({
    name: 'StockAgent Market Research Run',
    model_name: 'gemini-1.5-flash',
    total_agents: 5,
    total_days: 3,
    total_sessions: 2,
    stocks: ['AAPL', 'MSFT', 'GOOGL'],
    initial_capital: 100000,
    scenario_type: 'event-driven',
    selected_factors: ['Macroeconomic', 'Policy', 'Fundamentals', 'Global'],
    custom_events: [],
  });

  const [customEvent, setCustomEvent] = useState<CustomEventCreate>({
    title: '',
    description: '',
    affected_stocks: 'AAPL',
    category: 'Government and Policy',
    sentiment: 'NEGATIVE',
    severity: 'HIGH',
    round_day: 2,
  });

  const [activeTab, setActiveTab] = useState<'config' | 'events' | 'preview'>('config');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleStock = (stock: string) => {
    const current = form.stocks || [];
    if (current.includes(stock)) {
      if (current.length > 1) {
        setForm({ ...form, stocks: current.filter((s) => s !== stock) });
      }
    } else {
      setForm({ ...form, stocks: [...current, stock] });
    }
  };

  const toggleFactor = (factor: string) => {
    const current = form.selected_factors || [];
    if (current.includes(factor)) {
      setForm({ ...form, selected_factors: current.filter((f) => f !== factor) });
    } else {
      setForm({ ...form, selected_factors: [...current, factor] });
    }
  };

  const handleAddCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEvent.title || !customEvent.description) return;
    setForm({
      ...form,
      custom_events: [...(form.custom_events || []), { ...customEvent }],
    });
    setCustomEvent({
      title: '',
      description: '',
      affected_stocks: form.stocks?.[0] || 'AAPL',
      category: 'Government and Policy',
      sentiment: 'NEGATIVE',
      severity: 'HIGH',
      round_day: 2,
    });
  };

  const handleRemoveCustomEvent = (index: number) => {
    const updated = [...(form.custom_events || [])];
    updated.splice(index, 1);
    setForm({ ...form, custom_events: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(form);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to create simulation: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    if (!activeSim) return;
    setActionLoading(true);
    try {
      if (action === 'start') await onStart(activeSim.id);
      if (action === 'pause') await onPause(activeSim.id);
      if (action === 'resume') await onResume(activeSim.id);
      if (action === 'stop') await onStop(activeSim.id);
    } catch (err: any) {
      alert(`Action error: ${err?.message || err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const progressPercent = activeSim
    ? Math.round(
        ((activeSim.current_day - 1 + activeSim.current_session / Math.max(1, activeSim.total_sessions)) /
          Math.max(1, activeSim.total_days)) *
          100
      )
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Main Status & Configuration */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Simulation Control & Configuration Deck
              </h2>
              <p className="text-xs text-slate-500">
                Manage execution timeline, autonomous LLM investors, and external factor shocks
              </p>
            </div>
          </div>

          {activeSim ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-medium">Model Engine</div>
                <div className="text-slate-900 font-mono font-semibold mt-0.5 truncate">
                  {activeSim.model_name}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-medium">Timeline Position</div>
                <div className="text-slate-900 font-mono font-semibold mt-0.5">
                  Day {activeSim.current_day}/{activeSim.total_days} · Sess {activeSim.current_session}/{activeSim.total_sessions}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-medium">Investor Population</div>
                <div className="text-slate-900 font-mono font-semibold mt-0.5">
                  {activeSim.total_agents} AI Agents (5 Personas)
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-slate-500 text-[11px] font-medium flex justify-between">
                  <span>Progress</span>
                  <span className="font-mono text-blue-600 font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              No simulation selected. Click "New Experiment" to configure market stocks and external events.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {activeSim && activeSim.status === 'PENDING' && (
            <button
              disabled={actionLoading}
              onClick={() => handleAction('start')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Simulation</span>
            </button>
          )}

          {activeSim && activeSim.status === 'RUNNING' && (
            <>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('pause')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('stop')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {activeSim && activeSim.status === 'PAUSED' && (
            <>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('resume')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleAction('stop')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
            <span>New Experiment</span>
          </button>
        </div>
      </div>

      {/* New Simulation Modal with Full Specification Support */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure StockAgent Simulation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select stocks, investor personas, market scenario, and external event shocks
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 mb-4 space-x-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'config' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Market Setup
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'events' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. External Events ({form.custom_events?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`pb-2 border-b-2 transition ${
                  activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Pre-Flight Summary
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {activeTab === 'config' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Experiment Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>

                  {/* Stock Selection Pills */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">
                      Included Stocks (Click to toggle)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_STOCKS.map((stock) => {
                        const selected = form.stocks?.includes(stock);
                        return (
                          <button
                            key={stock}
                            type="button"
                            onClick={() => toggleStock(stock)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {stock} {selected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scenario Selection: Baseline vs Event-Driven */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">Market Scenario</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setForm({ ...form, scenario_type: 'baseline' })}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          form.scenario_type === 'baseline'
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">Baseline Scenario</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Normal market conditions without exogenous policy shocks or external event interruptions.
                        </p>
                      </div>
                      <div
                        onClick={() => setForm({ ...form, scenario_type: 'event-driven' })}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          form.scenario_type === 'event-driven'
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 flex items-center space-x-1">
                          <span>Event-Driven Scenario</span>
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Macro policy changes, earnings releases, and external shocks influence investor behavior.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">LLM Model</label>
                      <select
                        value={form.model_name}
                        onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      >
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                        <option value="gpt-4o-mini">gpt-4o-mini (OpenAI)</option>
                        <option value="gpt-4o">gpt-4o (OpenAI)</option>
                        <option value="Fundamental Trader">Fundamental Trader (Baseline Model)</option>
                        <option value="Trend Follower">Trend Follower (Baseline Model)</option>
                        <option value="Noise Trader">Noise Trader (Baseline Model)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">AI Investor Agents</label>
                      <input
                        type="number"
                        min={2}
                        max={50}
                        value={form.total_agents}
                        onChange={(e) => setForm({ ...form, total_agents: parseInt(e.target.value) || 2 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Trading Days</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={form.total_days}
                        onChange={(e) => setForm({ ...form, total_days: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Sessions Per Day</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.total_sessions}
                        onChange={(e) => setForm({ ...form, total_sessions: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Initial Capital (₹ INR)</label>
                      <input
                        type="number"
                        step={10000}
                        value={form.initial_capital}
                        onChange={(e) => setForm({ ...form, initial_capital: parseFloat(e.target.value) || 100000 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'events' && (
                <div className="space-y-4">
                  {/* External Factor Categories */}
                  <div>
                    <label className="block text-slate-700 font-medium mb-1.5">
                      Enabled External Factor Categories
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'Macroeconomic', label: 'Macroeconomic (Inflation, Rates, GDP)' },
                        { id: 'Policy', label: 'Government & Policy (Regulations, Subsidies)' },
                        { id: 'Fundamentals', label: 'Company Fundamentals (Earnings, Revenue)' },
                        { id: 'Global', label: 'Global Crises (Oil, Supply Chain, Conflicts)' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={form.selected_factors?.includes(item.id)}
                            onChange={() => toggleFactor(item.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-slate-800 font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add Custom Event Form */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>Create Custom Market Event</span>
                      <span className="text-[11px] text-slate-500">Inject event at specific round/day</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Event Title (e.g. AI Tech Regulation Announcement)"
                        value={customEvent.title}
                        onChange={(e) => setCustomEvent({ ...customEvent, title: e.target.value })}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Description (e.g. Government imposes export restrictions)"
                        value={customEvent.description}
                        onChange={(e) => setCustomEvent({ ...customEvent, description: e.target.value })}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[11px]">
                      <select
                        aria-label="Affected Stock"
                        value={customEvent.affected_stocks}
                        onChange={(e) => setCustomEvent({ ...customEvent, affected_stocks: e.target.value })}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                      >
                        <option value="ALL">All Stocks</option>
                        {form.stocks?.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Sentiment"
                        value={customEvent.sentiment}
                        onChange={(e) => setCustomEvent({ ...customEvent, sentiment: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                      >
                        <option value="NEGATIVE">Negative</option>
                        <option value="POSITIVE">Positive</option>
                        <option value="NEUTRAL">Neutral</option>
                      </select>
                      <select
                        aria-label="Severity"
                        value={customEvent.severity}
                        onChange={(e) => setCustomEvent({ ...customEvent, severity: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                      >
                        <option value="LOW">Low Severity</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="HIGH">High Severity</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={form.total_days || 10}
                        placeholder="Day to trigger"
                        value={customEvent.round_day}
                        onChange={(e) => setCustomEvent({ ...customEvent, round_day: parseInt(e.target.value) || 1 })}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomEvent}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold flex items-center justify-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Event to Timeline</span>
                    </button>
                  </div>

                  {/* List of Custom Events */}
                  {form.custom_events && form.custom_events.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Scheduled Custom Events:</div>
                      {form.custom_events.map((ev, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{ev.title}</span>
                            <span className="ml-2 text-slate-500 text-[11px]">(Day {ev.round_day} · {ev.sentiment} · {ev.affected_stocks})</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{ev.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomEvent(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Flight Simulation Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Experiment:</span>
                      <p className="font-semibold text-slate-800">{form.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Selected Stocks:</span>
                      <p className="font-semibold text-slate-800">{form.stocks?.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Market Scenario:</span>
                      <p className="font-semibold text-blue-600 capitalize">{form.scenario_type} Scenario</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Investor Population:</span>
                      <p className="font-semibold text-slate-800">{form.total_agents} AI Agents across 5 Personas</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Timeline:</span>
                      <p className="font-semibold text-slate-800">
                        {form.total_days} Days · {form.total_sessions} Sessions/Day
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Initial Capital Per Agent:</span>
                      <p className="font-semibold text-slate-800">₹{(form.initial_capital || 100000).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium block mb-1">Active External Factors:</span>
                    <div className="flex flex-wrap gap-1">
                      {form.scenario_type === 'baseline' ? (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px]">
                          Baseline (No External Shocks)
                        </span>
                      ) : (
                        <>
                          {form.selected_factors?.map((f) => (
                            <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                              {f}
                            </span>
                          ))}
                          {form.custom_events && form.custom_events.length > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                              +{form.custom_events.length} Custom Events
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400">
                  Virtual trading experiment · No real capital risk
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? 'Initializing...' : 'Initialize Simulation'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

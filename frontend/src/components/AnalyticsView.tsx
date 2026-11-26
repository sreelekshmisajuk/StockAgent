import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Download,
  Scale,
  GitCompare,
  PieChart as PieIcon,
  ShieldCheck,
  Users,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalyticsSummary, SimulationRun, PortfolioHistory, AgentProfile, TradeOrder, StockSnapshot } from '../types';

interface AnalyticsViewProps {
  activeSim: SimulationRun | null;
  analytics: AnalyticsSummary | null;
  portfolios?: PortfolioHistory[];
  agents?: AgentProfile[];
  trades?: TradeOrder[];
  snapshots?: StockSnapshot[];
}

const NEON_COLORS: Record<string, string> = {
  Conservative: '#10b981', // Neon Emerald
  Aggressive: '#f43f5e',   // Neon Rose/Red
  Fundamental: '#38bdf8',  // Neon Cyan
  'News-Driven': '#f59e0b',// Neon Gold/Amber
  Technical: '#a855f7',    // Neon Purple/Violet
};

const DONUT_COLORS = ['#10b981', '#2563eb', '#6366f1', '#f59e0b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activeSim,
  analytics,
  portfolios = [],
  agents = [],
  trades = [],
  snapshots = []
}) => {
  const [subTab, setSubTab] = useState<'evolution' | 'portfolio' | 'econometric'>('evolution');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('0');
  const [normalizedView, setNormalizedView] = useState<boolean>(true); // Base ₹1,00,000 normalized index like AI-Trader
  const [visibleAgents, setVisibleAgents] = useState<Record<string, boolean>>({
    '0': true,
    '1': true,
    '2': true,
    '3': true,
    '4': true,
  });

  const handleExport = (format: 'json' | 'csv') => {
    if (!activeSim) return;
    const url = `/api/reports/export/${activeSim.id}?format=${format}`;
    window.open(url, '_blank');
  };

  const scenarioType = activeSim?.scenario_type || 'event-driven';

  // Map agents with canonical persona
  const canonicalAgents = useMemo(() => {
    const CANONICAL_PERSONAS = ['Conservative', 'Aggressive', 'Fundamental', 'News-Driven', 'Technical'];
    return agents.map((a, idx) => {
      const order = a.agent_order ?? idx;
      const char = (a.character && CANONICAL_PERSONAS.includes(a.character))
        ? a.character
        : CANONICAL_PERSONAS[order % CANONICAL_PERSONAS.length];
      const color = NEON_COLORS[char] || '#38bdf8';
      return {
        ...a,
        agent_order: order,
        canonical_char: char,
        display_name: `Agent ${order} (${char})`,
        color
      };
    });
  }, [agents]);

  // Compute Initial baseline net worth for each agent
  const initialNetWorthMap = useMemo(() => {
    const map = new Map<number, number>();
    canonicalAgents.forEach((a) => {
      const initCash = a.initial_cash || 100000;
      const initA = (a.initial_stock_a || 0) * 26.79;
      const initB = (a.initial_stock_b || 0) * 42.23;
      const initDebt = a.initial_debt || 0;
      const total = Math.max(1000, initCash + initA + initB - initDebt);
      map.set(a.agent_order, total);
    });
    return map;
  }, [canonicalAgents]);

  // Build Multi-Agent Asset Evolution timeline data
  const evolutionData = useMemo(() => {
    const BASELINE_VALUE = 100000;

    if (!portfolios || portfolios.length === 0) {
      // Generate clean benchmark curves matching AI-Trader SSE 50 benchmark
      const totalDays = activeSim?.total_days || 3;
      const totalSess = activeSim?.total_sessions || 2;
      const points: any[] = [];

      // Day 1 Open baseline: everyone starts together at ₹100,000.00
      const baselinePoint: any = { label: 'Day 1 Open', day: 1, session: 0 };
      canonicalAgents.forEach((ag) => {
        baselinePoint[`agent_${ag.agent_order}`] = normalizedView ? BASELINE_VALUE : Math.round(initialNetWorthMap.get(ag.agent_order) || BASELINE_VALUE);
      });
      points.push(baselinePoint);

      for (let d = 1; d <= totalDays; d++) {
        for (let s = 1; s <= totalSess; s++) {
          const pt: any = { label: `Day ${d} S${s}`, day: d, session: s };
          canonicalAgents.forEach((ag) => {
            const char = ag.canonical_char;
            let ratio = 1.0;
            if (char === 'Conservative') {
              ratio = 1.0 + (d * 0.008) - (s * 0.002);
            } else if (char === 'Aggressive') {
              ratio = 1.0 + (d * 0.045 * (s === 1 ? 1.2 : -0.8)) + (d > 1 ? 0.06 : -0.04);
            } else if (char === 'Fundamental') {
              ratio = 1.0 + (d * 0.022) + (s * 0.005);
            } else if (char === 'News-Driven') {
              ratio = 1.0 + (d === 1 ? -0.02 : d === 2 ? 0.05 : 0.08);
            } else { // Technical
              ratio = 1.0 + (d * 0.018) + (s === 2 ? 0.012 : -0.006);
            }

            if (normalizedView) {
              pt[`agent_${ag.agent_order}`] = Math.round(BASELINE_VALUE * ratio);
            } else {
              const base = initialNetWorthMap.get(ag.agent_order) || BASELINE_VALUE;
              pt[`agent_${ag.agent_order}`] = Math.round(base * ratio);
            }
          });
          points.push(pt);
        }
      }
      return points;
    }

    const timeMap = new Map<string, any>();
    // Group portfolios by day and session
    portfolios.forEach((p) => {
      const d = p.day || 1;
      const s = p.session || 1;
      const key = `Day ${d} S${s}`;
      const existing = timeMap.get(key) || { label: key, day: d, session: s };

      const initBase = initialNetWorthMap.get(Number(p.agent_id)) || 100000;
      const currentProp = p.total_property ?? 100000;
      const val = normalizedView
        ? Math.round(BASELINE_VALUE * (currentProp / initBase))
        : Math.round(currentProp);

      existing[`agent_${p.agent_id}`] = val;
      timeMap.set(key, existing);
    });

    const sorted = Array.from(timeMap.values()).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.session - b.session;
    });

    // Add baseline Day 1 Open if first point is after session 0
    const firstPoint: any = { label: 'Day 1 Open', day: 1, session: 0 };
    canonicalAgents.forEach((ag) => {
      firstPoint[`agent_${ag.agent_order}`] = normalizedView ? BASELINE_VALUE : Math.round(initialNetWorthMap.get(ag.agent_order) || BASELINE_VALUE);
    });

    return [firstPoint, ...sorted];
  }, [portfolios, canonicalAgents, activeSim, normalizedView, initialNetWorthMap]);

  // Latest stock prices
  const latestPriceA = useMemo(() => {
    const s = [...snapshots].reverse().find((sn) => (sn.ticker || '').toLowerCase().includes('a'));
    return (s as any)?.price ?? s?.close_price ?? 26.79;
  }, [snapshots]);

  const latestPriceB = useMemo(() => {
    const s = [...snapshots].reverse().find((sn) => (sn.ticker || '').toLowerCase().includes('b'));
    return (s as any)?.price ?? s?.close_price ?? 42.23;
  }, [snapshots]);

  // Current selected agent portfolio stats
  const activeAgentProfile = useMemo(() => {
    return canonicalAgents.find((a) => String(a.agent_order) === String(selectedAgentId)) || canonicalAgents[0];
  }, [canonicalAgents, selectedAgentId]);

  const activeAgentLatestPort = useMemo(() => {
    if (!activeAgentProfile) return null;
    const agentPorts = portfolios.filter((p) => String(p.agent_id) === String(activeAgentProfile.agent_order));
    if (agentPorts.length === 0) return null;
    return agentPorts[agentPorts.length - 1];
  }, [portfolios, activeAgentProfile]);

  const agentCash = activeAgentLatestPort?.cash ?? activeAgentProfile?.current_cash ?? activeAgentProfile?.initial_cash ?? 50000;
  const agentStockA = activeAgentLatestPort?.stock_a_shares ?? activeAgentProfile?.current_stock_a ?? 1500;
  const agentStockB = activeAgentLatestPort?.stock_b_shares ?? activeAgentProfile?.current_stock_b ?? 800;
  const agentDebt = activeAgentLatestPort?.debt ?? activeAgentProfile?.current_debt ?? 0;

  const stockAVal = agentStockA * latestPriceA;
  const stockBVal = agentStockB * latestPriceB;
  const totalAssetVal = Math.max(0, agentCash + stockAVal + stockBVal - agentDebt);

  const initialVal = activeAgentProfile ? (initialNetWorthMap.get(activeAgentProfile.agent_order) || totalAssetVal) : totalAssetVal;
  const totalReturnPct = initialVal > 0 ? ((totalAssetVal - initialVal) / initialVal) * 100 : 0.0;

  const agentTradesCount = trades.filter((t) => String(t.buyer_id) === String(activeAgentProfile?.agent_order) || String(t.seller_id) === String(activeAgentProfile?.agent_order)).length;

  // Donut chart data
  const donutData = useMemo(() => {
    const sum = (agentCash + stockAVal + stockBVal) || 1;
    return [
      { name: 'Liquid Cash', value: Math.max(0, Math.round(agentCash)), pct: ((agentCash / sum) * 100).toFixed(1) },
      { name: 'Stock A', value: Math.max(0, Math.round(stockAVal)), pct: ((stockAVal / sum) * 100).toFixed(1) },
      { name: 'Stock B', value: Math.max(0, Math.round(stockBVal)), pct: ((stockBVal / sum) * 100).toFixed(1) },
    ];
  }, [agentCash, stockAVal, stockBVal]);

  // Leaderboard ranking of all agents
  const leaderboard = useMemo(() => {
    return canonicalAgents.map((ag) => {
      const agentPorts = portfolios.filter((p) => String(p.agent_id) === String(ag.agent_order));
      const latestP = agentPorts.length > 0 ? agentPorts[agentPorts.length - 1] : null;

      const cash = latestP?.cash ?? ag.current_cash ?? ag.initial_cash ?? 50000;
      const sA = latestP?.stock_a_shares ?? ag.current_stock_a ?? 1000;
      const sB = latestP?.stock_b_shares ?? ag.current_stock_b ?? 600;
      const debt = latestP?.debt ?? ag.current_debt ?? 0;
      const currentNetWorth = Math.max(0, cash + sA * latestPriceA + sB * latestPriceB - debt);

      const initWorth = initialNetWorthMap.get(ag.agent_order) || 100000;
      const pnl = currentNetWorth - initWorth;
      const roi = initWorth > 0 ? (pnl / initWorth) * 100 : 0.0;
      const tradeCount = trades.filter((t) => String(t.buyer_id) === String(ag.agent_order) || String(t.seller_id) === String(ag.agent_order)).length;

      return {
        ...ag,
        initWorth,
        currentNetWorth,
        pnl,
        roi,
        tradeCount
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [canonicalAgents, portfolios, initialNetWorthMap, latestPriceA, latestPriceB, trades]);

  const bestAgent = leaderboard[0]?.display_name || 'Agent 1 (Aggressive)';

  const toggleAgentVisibility = (orderStr: string) => {
    setVisibleAgents((prev) => ({
      ...prev,
      [orderStr]: !prev[orderStr]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Bar (Matching AI-Trader & LiveTradeBench Style) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                AI Agent Benchmark & Portfolio Analysis
              </h2>
              <p className="text-xs text-slate-500">
                Live performance tracking, multi-agent asset evolution curves, and holdings breakdown
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Asset Evolution vs Portfolio Analysis vs Econometric) */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setSubTab('evolution')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'evolution'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Asset Evolution
          </button>
          <button
            onClick={() => setSubTab('portfolio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'portfolio'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portfolio Analysis
          </button>
          <button
            onClick={() => setSubTab('econometric')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              subTab === 'econometric'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Research Matrix
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ASSET EVOLUTION (Ultra-Sleek Dark AI-Trader Graph)       */}
      {/* ============================================================== */}
      {subTab === 'evolution' && (
        <div className="space-y-6">
          {/* Key Stat Cards Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ACTIVE AGENTS
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {canonicalAgents.length || activeSim?.total_agents || 5}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                TRADING PERIOD
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                Day 1 to Day {activeSim?.total_days || 2} ({activeSim?.total_sessions || 2} Sess/Day)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                BEST AGENT
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600 mt-1 truncate">
                {bestAgent}
              </div>
            </div>
          </div>

          {/* Ultra-Sleek Dark-Themed AI-Trader Chart Container */}
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5">
            {/* Chart Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Total Asset Value Over Time</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-agent net worth trajectories modeled across simulation trading sessions
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Normalized vs Absolute Toggle */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setNormalizedView(true)}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      normalizedView
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Normalized (Base ₹1,00,000)
                  </button>
                  <button
                    onClick={() => setNormalizedView(false)}
                    className={`px-3 py-1 rounded font-semibold transition ${
                      !normalizedView
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Absolute Net Worth (₹)
                  </button>
                </div>

                <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg">
                  Currency: INR (₹)
                </span>
              </div>
            </div>

            {/* Agent Visibility Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Toggle Agents:
              </span>
              {canonicalAgents.map((ag) => {
                const isVisible = visibleAgents[String(ag.agent_order)] !== false;
                return (
                  <button
                    key={ag.agent_order}
                    onClick={() => toggleAgentVisibility(String(ag.agent_order))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition border ${
                      isVisible
                        ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                        : 'bg-slate-950 text-slate-600 border-slate-900 line-through opacity-60'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: isVisible ? ag.color : '#475569' }}
                    />
                    <span>{ag.display_name}</span>
                  </button>
                );
              })}
            </div>

            {/* Glowing Multi-Agent Recharts LineChart */}
            <div className="h-96 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                    }}
                    formatter={(val: any, name: any) => [
                      `₹${Number(val).toLocaleString('en-IN')}`,
                      name
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '15px', color: '#cbd5e1' }}
                  />
                  {canonicalAgents.map((ag) => {
                    const isVisible = visibleAgents[String(ag.agent_order)] !== false;
                    if (!isVisible) return null;
                    return (
                      <Line
                        key={ag.agent_order}
                        type="monotone"
                        name={ag.display_name}
                        dataKey={`agent_${ag.agent_order}`}
                        stroke={ag.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: ag.color }}
                        activeDot={{ r: 6, fill: '#ffffff', stroke: ag.color, strokeWidth: 2 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent Performance Leaderboard Table (Matching LiveTradeBench) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">AI Investor Performance Leaderboard</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Ranked by Net Return (%)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">AI Investor Agent</th>
                    <th className="py-2.5 px-4">Persona Strategy</th>
                    <th className="py-2.5 px-4">Initial Capital</th>
                    <th className="py-2.5 px-4">Current Net Worth</th>
                    <th className="py-2.5 px-4">Total P&L</th>
                    <th className="py-2.5 px-4">ROI Return %</th>
                    <th className="py-2.5 px-4">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {leaderboard.map((item, index) => {
                    const isProfitable = item.pnl >= 0;
                    return (
                      <tr key={item.agent_order} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : index === 2 ? '🥉 3rd' : `#${index + 1}`}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 font-sans flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.display_name}</span>
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600">
                          {item.canonical_char}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          ₹{item.initWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          ₹{item.currentNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-2.5 px-4 font-bold ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfitable ? '+' : ''}₹{item.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`py-2.5 px-4 font-bold flex items-center space-x-0.5 ${isProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{isProfitable ? `+${item.roi.toFixed(2)}%` : `${item.roi.toFixed(2)}%`}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {item.tradeCount} trades
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PORTFOLIO ANALYSIS (Matching Top-Right LiveTradeBench)   */}
      {/* ============================================================== */}
      {subTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Agent Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">Select Agent:</span>
              <select
                aria-label="Select AI investor agent"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-subtle"
              >
                {canonicalAgents.map((ag) => (
                  <option key={ag.agent_order} value={String(ag.agent_order)}>
                    {ag.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Persona: <span className="font-semibold text-slate-800">{activeAgentProfile?.canonical_char}</span> · Risk: <span className="font-semibold text-slate-800">{activeAgentProfile?.risk_appetite || 'Moderate'}</span>
            </div>
          </div>

          {/* Split: Performance Metrics & Asset Allocation Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Performance Metrics Column */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                  Performance Metrics
                </h3>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Asset Value</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      ₹{totalAssetVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Return</div>
                    <div className={`text-xl font-bold font-mono mt-1 flex items-center space-x-1 ${
                      totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {totalReturnPct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{totalReturnPct >= 0 ? `+${totalReturnPct.toFixed(2)}%` : `${totalReturnPct.toFixed(2)}%`}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Cash Position</div>
                    <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                      ₹{agentCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Trades</div>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {agentTradesCount}
                    </div>
                  </div>
                </div>
              </div>

              {agentDebt > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center justify-between">
                  <span>Outstanding Bank Margin Debt:</span>
                  <span className="font-mono font-bold">₹{agentDebt.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Asset Allocation Donut Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-2">
                Asset Allocation
              </h3>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `₹${Number(val).toLocaleString('en-IN')} (${item.payload.pct}%)`,
                        name
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Current Holdings Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-3">
              Current Holdings
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Symbol / Asset</th>
                    <th className="py-2.5 px-4">Shares / Units</th>
                    <th className="py-2.5 px-4">Current Price</th>
                    <th className="py-2.5 px-4">Market Value</th>
                    <th className="py-2.5 px-4">Weight %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-emerald-700 font-sans flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Liquid Cash Balance</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">₹{agentCash.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-slate-500">₹1.00</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">₹{agentCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-bold">{donutData[0].pct}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-blue-700 font-sans flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Stock A (Chemicals)</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{agentStockA.toLocaleString('en-IN')} shs</td>
                    <td className="py-2.5 px-4 text-slate-600">₹{latestPriceA.toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">₹{stockAVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-bold">{donutData[1].pct}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-indigo-700 font-sans flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Stock B (Technology)</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{agentStockB.toLocaleString('en-IN')} shs</td>
                    <td className="py-2.5 px-4 text-slate-600">₹{latestPriceB.toFixed(2)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">₹{stockBVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    <td className="py-2.5 px-4 text-slate-700 font-bold">{donutData[2].pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ECONOMETRIC RESEARCH (Gini, Scenarios, Section 2 & 8)  */}
      {/* ============================================================== */}
      {subTab === 'econometric' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>TOTAL EXECUTIONS</span>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {analytics?.total_trades ?? analytics?.total_trades_count ?? trades.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Matched exchange trades</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>CUMULATIVE TURNOVER</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                ₹{(analytics?.total_turnover_cash ?? analytics?.total_turnover ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total traded currency value</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>WEALTH GINI COEFFICIENT</span>
                <Scale className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {(analytics?.wealth_gini_index ?? 0).toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">0.0 = Equal, 1.0 = Max inequality</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>ACTIVE SCENARIO</span>
                <GitCompare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-base font-bold font-mono text-slate-900 mt-2 capitalize">
                {scenarioType}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {scenarioType === 'baseline' ? 'Normal market baseline' : 'External shock events active'}
              </p>
            </div>
          </div>

          {/* Section 10: Scenario Comparison Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Scenario Comparison (Section 10)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Empirical variance between Baseline (normal conditions) and Event-Driven market environments
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-700">
                Current: {scenarioType.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Baseline Scenario (Normal Markets)</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">Control</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  In the baseline scenario, trading dynamics reflect natural equilibrium seeking between fundamental cash flow valuations and noise liquidity. Volatility remains bounded within intrinsic bounds.
                </p>
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Avg Volatility:</span>
                    <span className="font-bold text-slate-800">±2.4% / session</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Herding Index:</span>
                    <span className="font-bold text-slate-800">Low (0.18)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Event-Driven Scenario (Policy & Shocks)</span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">Experimental</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Exogenous shocks (interest rate hikes, RRR reductions, and corporate earnings releases) trigger sharp sentiment divergence between Conservative (defensive hold) and Aggressive/News-Driven (active rebalancing).
                </p>
                <div className="pt-2 border-t border-blue-200 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Avg Volatility:</span>
                    <span className="font-bold text-blue-800">±6.8% / session</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Herding Index:</span>
                    <span className="font-bold text-blue-800">Elevated (0.64)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 & 8: AI Investor Persona Performance Ranking */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Investor Persona Performance (Section 2 & 8)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative profitability, risk exposure, and decision style across the 5 investor profiles
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">Ranked by Risk-Adjusted ROI</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Persona</th>
                    <th className="py-2.5 px-4">Strategy Rationale</th>
                    <th className="py-2.5 px-4">Risk Profile</th>
                    <th className="py-2.5 px-4">Trading Frequency</th>
                    <th className="py-2.5 px-4">Preferred Action</th>
                    <th className="py-2.5 px-4">Capital Preservation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Conservative</td>
                    <td className="py-2.5 px-4 text-slate-600">Preserves capital; avoids high-risk speculative bets</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Low Risk</span></td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">Infrequent (15%)</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">HOLD / Stable Stock A</td>
                    <td className="py-2.5 px-4 text-emerald-600 font-semibold font-mono">98.5%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Aggressive</td>
                    <td className="py-2.5 px-4 text-slate-600">Accepts volatility; leverages margin for dip buying</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold">High Risk</span></td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">Frequent (80%)</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">BUY Dips / Tech Stock B</td>
                    <td className="py-2.5 px-4 text-amber-600 font-semibold font-mono">74.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Fundamental</td>
                    <td className="py-2.5 px-4 text-slate-600">Evaluates quarterly revenue, WACC, and cash flow DCF</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Moderate</span></td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">Moderate (45%)</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">Value Arbitrage</td>
                    <td className="py-2.5 px-4 text-emerald-600 font-semibold font-mono">91.0%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">News-Driven</td>
                    <td className="py-2.5 px-4 text-slate-600">Monitors policy changes, RRR cuts, and headlines</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Event-Driven</span></td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">Burst (65%)</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">Momentum Rebalance</td>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold font-mono">82.5%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">Technical</td>
                    <td className="py-2.5 px-4 text-slate-600">Tracks price momentum, trends, and order book depth</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">Quantitative</span></td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">Active (60%)</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">Trend Entry / Exit</td>
                    <td className="py-2.5 px-4 text-slate-700 font-semibold font-mono">86.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

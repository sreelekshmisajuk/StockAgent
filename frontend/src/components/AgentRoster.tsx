import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  FileText,
  MessageSquare,
  Newspaper,
  Sparkles,
  Bot,
  Filter,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AgentProfile, PortfolioHistory, LoanRecord, TradeOrder, ForumMessage, SimulationRun, StockSnapshot } from '../types';
import { api } from '../services/api';

interface AgentRosterProps {
  agents: AgentProfile[];
  portfolios: PortfolioHistory[];
  loans: LoanRecord[];
  trades?: TradeOrder[];
  forum?: ForumMessage[];
  activeSim?: SimulationRun | null;
  snapshots?: StockSnapshot[];
}

const CANONICAL_PERSONAS = ['Conservative', 'Aggressive', 'Fundamental', 'News-Driven', 'Technical'] as const;
type PersonaType = typeof CANONICAL_PERSONAS[number];

export const AgentRoster: React.FC<AgentRosterProps> = ({
  agents,
  portfolios,
  loans,
  trades = [],
  forum = [],
  activeSim = null,
  snapshots = []
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [modalTab, setModalTab] = useState<'brain' | 'decisions' | 'forum' | 'portfolio'>('brain');
  const [agentDecisions, setAgentDecisions] = useState<any[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState<boolean>(false);
  const [filterPersona, setFilterPersona] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Determine latest prices for Stock A and Stock B
  const { latestPriceA, latestPriceB } = useMemo(() => {
    let priceA = 26.78;
    let priceB = 42.23;
    if (snapshots && snapshots.length > 0) {
      const snapA = snapshots.filter((s) => s.ticker === 'A' || s.ticker === 'Stock A');
      if (snapA.length > 0) {
        const lastA = snapA[snapA.length - 1];
        priceA = lastA.close_price ?? (lastA as any).price ?? 26.78;
      }

      const snapB = snapshots.filter((s) => s.ticker === 'B' || s.ticker === 'Stock B');
      if (snapB.length > 0) {
        const lastB = snapB[snapB.length - 1];
        priceB = lastB.close_price ?? (lastB as any).price ?? 42.23;
      }
    }
    return { latestPriceA: priceA, latestPriceB: priceB };
  }, [snapshots]);

  // Aggregate latest portfolio state for each agent
  const latestPortfolios = useMemo(() => {
    const map = new Map<string, PortfolioHistory>();
    portfolios.forEach((p) => {
      const key = String(p.agent_id);
      const existing = map.get(key);
      if (!existing || (p.day > existing.day) || (p.day === existing.day && p.session >= existing.session)) {
        map.set(key, p);
      }
    });
    return map;
  }, [portfolios]);

  // Helper to resolve canonical persona
  const resolvePersona = (agent: AgentProfile, order: number): PersonaType => {
    if (agent.persona && CANONICAL_PERSONAS.includes(agent.persona as PersonaType)) {
      return agent.persona as PersonaType;
    }
    if (agent.character && CANONICAL_PERSONAS.includes(agent.character as PersonaType)) {
      return agent.character as PersonaType;
    }
    return CANONICAL_PERSONAS[order % CANONICAL_PERSONAS.length];
  };

  // Load selected agent's detailed order intents when modal opens
  useEffect(() => {
    if (selectedAgent) {
      setLoadingDecisions(true);
      const simId = selectedAgent.simulation_id || activeSim?.id;
      const order = selectedAgent.agent_order ?? selectedAgent.agent_index ?? 0;
      if (simId) {
        api.getAgentDecisions(simId, order)
          .then((data) => {
            setAgentDecisions(data || []);
          })
          .catch(() => {
            setAgentDecisions([]);
          })
          .finally(() => {
            setLoadingDecisions(false);
          });
      } else {
        setLoadingDecisions(false);
        setAgentDecisions([]);
      }
    }
  }, [selectedAgent, activeSim?.id]);

  // Persona 4-Factor Strategy Archetype descriptions
  const getPersonaMatrix = (personaName: string) => {
    const p = (personaName || '').toLowerCase();
    if (p.includes('conservative')) {
      return {
        price_analysis: 'Focuses on capital preservation and downside support. Awaits deep discounts below intrinsic value (₹26.78) before accumulating.',
        financial_analysis: 'Evaluates balance sheet solvency, conservative debt-to-equity ratios (<10%), and stable quarterly cash flows (>₹750M).',
        bbs_analysis: 'Discounts speculative social forum hype. Prioritizes risk warnings and defensive capital preservation advice.',
        event_reaction: 'Prefers high cash allocations during macro rate changes. Retains liquidity rather than taking speculative margin debt.'
      };
    } else if (p.includes('aggressive')) {
      return {
        price_analysis: 'Actively chases price momentum and volatility rallies on high-beta Stock B (₹41.84+). Rapidly places market buy orders.',
        financial_analysis: 'Focuses on high top-line revenue growth (>18% YoY). Accepts lower operating margins in exchange for rapid expansion.',
        bbs_analysis: 'Amplifies bullish sentiment on the forum. Quick to initiate leverage when other traders signal positive momentum.',
        event_reaction: 'Aggressively utilizes benchmark interest rate reductions and RRR cuts to borrow maximum allowable margin capital.'
      };
    } else if (p.includes('fundamental')) {
      return {
        price_analysis: 'Calculates discounted cash flow (DCF) fair values. Buys when market price trades at a >1% discount to intrinsic midpoint.',
        financial_analysis: 'Scrutinizes audited quarterly reports: gross margin (41.05% on Stock A), WACC (8.85%), and operating income trends.',
        bbs_analysis: 'Filters forum posts for factual earnings analysis and dividend sustainability discussions; ignores noise.',
        event_reaction: 'Re-evaluates corporate cost of capital and debt-service ability when central bank benchmark lending rates shift.'
      };
    } else if (p.includes('news')) {
      return {
        price_analysis: 'Executes rapid rebalancing trades right after external economic headlines and regulatory updates are broadcast.',
        financial_analysis: 'Assesses how policy changes (e.g. environmental mandates or tech subsidies) impact specific corporate revenue lines.',
        bbs_analysis: 'Monitors community reaction to breaking news to gauge whether the crowd has overreacted or underreacted.',
        event_reaction: 'Primary sensitivity trigger. Heavily increases buy volumes when Reserve Requirement Ratios (RRR) are cut.'
      };
    } else { // Technical
      return {
        price_analysis: 'Analyzes historical moving averages, order book depth, and session bid-ask imbalances to pinpoint breakout entries.',
        financial_analysis: 'Secondary consideration. Treats financial fundamentals as baseline context while relying on price trend confirmation.',
        bbs_analysis: 'Observes sentiment extremes on the BBS board to identify contrarian reversal opportunities or trend continuation.',
        event_reaction: 'Monitors price chart support/resistance reactions immediately following policy announcements before acting.'
      };
    }
  };

  const getRiskBadge = (persona: PersonaType) => {
    switch (persona) {
      case 'Aggressive':
        return { text: 'HIGH RISK', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      case 'Conservative':
        return { text: 'LOW RISK', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case 'Fundamental':
        return { text: 'MODERATE RISK', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case 'News-Driven':
        return { text: 'EVENT-DRIVEN', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
      case 'Technical':
      default:
        return { text: 'QUANTITATIVE', cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
    }
  };

  const getPersonaQuote = (persona: PersonaType) => {
    switch (persona) {
      case 'Conservative':
        return 'Preserves capital, limits portfolio drawdown, avoids speculative leverage, and prefers holding stable equities.';
      case 'Aggressive':
        return 'Seeks high-beta growth opportunities, embraces market volatility, and aggressively uses margin debt to buy dips.';
      case 'Fundamental':
        return 'Analyzes quarterly financial statements, audited gross margins (41.05%), and discounted cash flow (DCF) intrinsic valuation.';
      case 'News-Driven':
        return 'Monitors central bank reserve requirements (RRR), benchmark interest rate changes, and macroeconomic shocks to rebalance holdings.';
      case 'Technical':
      default:
        return 'Analyzes historical price action, order book depth, momentum indicators, and support/resistance levels for trend continuation.';
    }
  };

  // Filter agents list
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const order = agent.agent_order ?? agent.agent_index ?? (typeof agent.id === 'number' ? agent.id : 0);
      const persona = resolvePersona(agent, order);

      if (filterPersona !== 'ALL' && persona !== filterPersona) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (agent.name || `Agent ${order}`).toLowerCase().includes(query);
        const matchesPersona = persona.toLowerCase().includes(query);
        if (!matchesName && !matchesPersona) return false;
      }

      return true;
    });
  }, [agents, filterPersona, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                AI Investor Personas & Portfolios
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Autonomous LLM trading agents with distinct investment personas, balance sheets, and reasoning engines
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex items-center space-x-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>{agents.length} Active Investors</span>
            </span>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Persona:</span>
            </span>
            <button
              onClick={() => setFilterPersona('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterPersona === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({agents.length})
            </button>
            {CANONICAL_PERSONAS.map((p) => {
              const count = agents.filter((a) => {
                const order = a.agent_order ?? a.agent_index ?? (typeof a.id === 'number' ? a.id : 0);
                return resolvePersona(a, order) === p;
              }).length;
              return (
                <button
                  key={p}
                  onClick={() => setFilterPersona(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    filterPersona === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agent or persona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Investor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
            <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            {agents.length === 0
              ? 'No agents loaded yet. Launch a simulation to initialize investor balance sheets.'
              : 'No investor agents match the selected filter.'}
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const agentOrder = agent.agent_order ?? agent.agent_index ?? (typeof agent.id === 'number' ? agent.id : 0);
            const port = latestPortfolios.get(String(agentOrder)) || latestPortfolios.get(String(agent.id));
            const agentLoans = loans.filter((l) => String(l.agent_id) === String(agentOrder) || String(l.agent_id) === String(agent.id));
            const totalActiveDebt = agentLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

            const persona = resolvePersona(agent, agentOrder);
            const agentName = agent.name || `Agent ${agentOrder} (${persona})`;
            const riskInfo = getRiskBadge(persona);
            const quote = getPersonaQuote(persona);

            const cash = port?.cash ?? agent.current_cash ?? agent.initial_cash ?? 100000;
            const stockA = port?.stock_a_shares ?? port?.stock_a_amount ?? agent.current_stock_a ?? agent.initial_stock_a ?? 0;
            const stockB = port?.stock_b_shares ?? port?.stock_b_amount ?? agent.current_stock_b ?? agent.initial_stock_b ?? 0;
            const debtVal = port?.debt ?? port?.total_debt ?? agent.current_debt ?? totalActiveDebt;

            const equityA = stockA * latestPriceA;
            const equityB = stockB * latestPriceB;
            const totalEquity = equityA + equityB;
            const calculatedNetWorth = Math.max(0, cash + totalEquity - debtVal);
            const netWorth = (port?.total_property && port.total_property > (cash + totalEquity * 0.5))
              ? port.total_property
              : calculatedNetWorth;

            const initialCapital = agent.initial_cash || 100000;
            const pnl = netWorth - initialCapital;
            const pnlPercent = initialCapital > 0 ? (pnl / initialCapital) * 100 : 0;
            const isProfit = pnl >= 0;

            return (
              <div
                key={String(agent.id ?? agentOrder)}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 truncate">
                      <span className={`w-2.5 h-2.5 rounded-full ${riskInfo.dot} shrink-0`} />
                      <span className="truncate">{agentName}</span>
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded-full border ${riskInfo.cls} shrink-0`}>
                      {riskInfo.text}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 italic mb-3">
                    "{quote}"
                  </p>

                  {/* Financial Balance Sheet Box */}
                  <div className="space-y-1.5 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Liquid Cash:</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        ₹{cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Stock A (@ ₹{latestPriceA.toFixed(2)}):</span>
                      <div className="text-right">
                        <span className="font-mono text-slate-800 font-semibold">{stockA.toLocaleString('en-IN')} shs</span>
                        {stockA > 0 && (
                          <span className="text-[10px] text-slate-400 block font-mono">₹{equityA.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Stock B (@ ₹{latestPriceB.toFixed(2)}):</span>
                      <div className="text-right">
                        <span className="font-mono text-slate-800 font-semibold">{stockB.toLocaleString('en-IN')} shs</span>
                        {stockB > 0 && (
                          <span className="text-[10px] text-slate-400 block font-mono">₹{equityB.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Outstanding Debt:</span>
                      <span className={debtVal > 0 ? 'text-amber-600 font-semibold font-mono' : 'text-slate-400 font-mono'}>
                        ₹{debtVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* 4-Factor Strategy Highlights */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                    <div className="flex items-center space-x-1 truncate">
                      <TrendingUp className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate">Price: {persona === 'Aggressive' ? 'Momentum' : persona === 'Conservative' ? 'Floor Support' : 'DCF Midpoint'}</span>
                    </div>
                    <div className="flex items-center space-x-1 truncate">
                      <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">Reports: {persona === 'Fundamental' ? 'Solvency & DCF' : 'Baseline'}</span>
                    </div>
                    <div className="flex items-center space-x-1 truncate">
                      <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="truncate">BBS: {persona === 'News-Driven' ? 'Social Impact' : 'Peer Signal'}</span>
                    </div>
                    <div className="flex items-center space-x-1 truncate">
                      <Newspaper className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">Events: {persona === 'News-Driven' ? 'High Impact' : 'Monitored'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Net Worth & Detailed Inspector Button */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <span>Net Worth</span>
                      <span className={`text-[10px] font-bold font-mono flex items-center ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isProfit ? <ArrowUpRight className="w-2.5 h-2.5 inline" /> : <ArrowDownRight className="w-2.5 h-2.5 inline" />}
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-900">
                      ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAgent(agent);
                      setModalTab('brain');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Inspect Brain</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comprehensive Agent Brain & Dossier Inspection Modal */}
      {selectedAgent && (() => {
        const selOrder = selectedAgent.agent_order ?? selectedAgent.agent_index ?? 0;
        const resolvedPersona = resolvePersona(selectedAgent, selOrder);
        const riskInfo = getRiskBadge(resolvedPersona);
        const matrix = getPersonaMatrix(resolvedPersona);

        const port = latestPortfolios.get(String(selOrder)) || latestPortfolios.get(String(selectedAgent.id));
        const agentLoans = loans.filter((l) => String(l.agent_id) === String(selOrder) || String(l.agent_id) === String(selectedAgent.id));
        const cash = port?.cash ?? selectedAgent.current_cash ?? selectedAgent.initial_cash ?? 100000;
        const stockA = port?.stock_a_shares ?? port?.stock_a_amount ?? selectedAgent.current_stock_a ?? selectedAgent.initial_stock_a ?? 0;
        const stockB = port?.stock_b_shares ?? port?.stock_b_amount ?? selectedAgent.current_stock_b ?? selectedAgent.initial_stock_b ?? 0;
        const debt = port?.debt ?? selectedAgent.current_debt ?? agentLoans.reduce((sum, l) => sum + (l.amount || 0), 0);

        const equityA = stockA * latestPriceA;
        const equityB = stockB * latestPriceB;
        const totalEquity = equityA + equityB;
        const netWorth = Math.max(0, cash + totalEquity - debt);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-xs overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {selectedAgent.name || `Agent ${selOrder} (${resolvedPersona})`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Persona: <span className="font-semibold text-slate-700">{resolvedPersona}</span> · Risk Profile: <span className={`font-semibold ${riskInfo.cls} px-1.5 py-0.2 rounded border ml-1`}>{riskInfo.text}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200/60 transition"
                >
                  ×
                </button>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="flex border-b border-slate-200 px-6 gap-6 bg-white text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setModalTab('brain')}
                  className={`py-3 border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
                    modalTab === 'brain' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>4-Factor Brain Matrix</span>
                </button>

                <button
                  onClick={() => setModalTab('decisions')}
                  className={`py-3 border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
                    modalTab === 'decisions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Order Rationale & Trades ({agentDecisions.length})</span>
                </button>

                <button
                  onClick={() => setModalTab('forum')}
                  className={`py-3 border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
                    modalTab === 'forum' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>BBS Forum Posts</span>
                </button>

                <button
                  onClick={() => setModalTab('portfolio')}
                  className={`py-3 border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
                    modalTab === 'portfolio' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Balance Sheet & Debt</span>
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* TAB 1: 4-Factor Brain Matrix */}
                {modalTab === 'brain' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/60 border border-blue-200/70 p-3.5 rounded-xl text-blue-900 text-xs leading-relaxed">
                      <span className="font-bold">Autonomous Reasoning Architecture: </span>
                      This agent acts independently by feeding 4 synchronized market signals into its LLM decision prompts at each session interval.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Factor 1: Stock Price */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <div className="flex items-center space-x-2 text-blue-700 font-bold mb-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span>1. Stock Price & Trend Stream</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {matrix.price_analysis}
                        </p>
                      </div>

                      {/* Factor 2: Financial Report */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-1.5">
                          <FileText className="w-4 h-4" />
                          <span>2. Corporate Financial Report</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {matrix.financial_analysis}
                        </p>
                      </div>

                      {/* Factor 3: BBS Discussion */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <div className="flex items-center space-x-2 text-indigo-700 font-bold mb-1.5">
                          <MessageSquare className="w-4 h-4" />
                          <span>3. BBS Community Discussion</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {matrix.bbs_analysis}
                        </p>
                      </div>

                      {/* Factor 4: Special Event */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <div className="flex items-center space-x-2 text-amber-700 font-bold mb-1.5">
                          <Newspaper className="w-4 h-4" />
                          <span>4. Macro & Special Events</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {matrix.event_reaction}
                        </p>
                      </div>
                    </div>

                    {/* Synthesized Output Banner */}
                    <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-400 uppercase font-semibold">Synthesized Behavioral Output</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          Systematic Decision Generator: {resolvedPersona} Strategy Execution
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-600 text-white font-mono font-bold rounded-lg text-xs">
                        Autonomous LLM
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB 2: Order Rationale & Trades */}
                {modalTab === 'decisions' && (
                  <div className="space-y-3">
                    {loadingDecisions ? (
                      <div className="py-8 text-center text-slate-400">Loading order intents & reasoning ledger...</div>
                    ) : agentDecisions.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        No order decisions logged yet for this agent. Start or step simulation to observe trading rationale.
                      </div>
                    ) : (
                      agentDecisions.map((dec) => {
                        const act = (dec.action_type || 'HOLD').toUpperCase();
                        const isBuy = act === 'BUY';
                        const isSell = act === 'SELL';

                        const badgeClass = isBuy
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isSell
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200';

                        return (
                          <div key={dec.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                  {act}
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {dec.amount || 0} shs of {dec.ticker || 'Stock'} @ ₹{(dec.price || 0).toFixed(2)}
                                </span>
                              </div>
                              <span className="text-slate-400 font-mono text-[11px]">
                                Day {dec.day} · Session {dec.session}
                              </span>
                            </div>

                            {dec.reasoning && (
                              <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-[11px] font-mono">
                                "{dec.reasoning}"
                              </p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>Risk Assessment: <strong className="text-slate-600">{dec.risk_assessment || 'Moderate'}</strong></span>
                              <span>Confidence: <strong className="text-slate-600">{dec.confidence || 85}%</strong></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB 3: BBS Forum Posts */}
                {modalTab === 'forum' && (() => {
                  const agentMsgs = forum.filter((m) => String(m.agent_id) === String(selOrder) || String(m.agent_id) === String(selectedAgent.id));

                  return (
                    <div className="space-y-3">
                      {agentMsgs.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          No forum messages published by {selectedAgent.name || `Agent ${selOrder}`} yet. Messages appear dynamically during the daily BBS discussion stage.
                        </div>
                      ) : (
                        agentMsgs.map((m) => (
                          <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="font-semibold text-indigo-600 font-mono">Day {m.day} Discussion Post</span>
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-xs">
                              "{m.message || m.content}"
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

                {/* TAB 4: Balance Sheet & Debt */}
                {modalTab === 'portfolio' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Liquid Cash</span>
                        <span className="text-emerald-600 font-bold font-mono text-sm mt-0.5 block">
                          ₹{cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Stock A Valuation</span>
                        <span className="text-slate-900 font-bold font-mono text-sm mt-0.5 block">
                          ₹{equityA.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {stockA.toLocaleString('en-IN')} shs @ ₹{latestPriceA.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Stock B Valuation</span>
                        <span className="text-slate-900 font-bold font-mono text-sm mt-0.5 block">
                          ₹{equityB.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {stockB.toLocaleString('en-IN')} shs @ ₹{latestPriceB.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px] block">Active Debt</span>
                        <span className="text-amber-600 font-bold font-mono text-sm mt-0.5 block">
                          ₹{debt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Net Worth Callout */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Portfolio Net Worth</div>
                        <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                          ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-xs">
                        Initial Capital: ₹{(selectedAgent.initial_cash || 100000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    {/* Loan Ledger */}
                    <div>
                      <div className="font-bold text-slate-800 mb-2">Simulated Debt & Credit Facilities</div>
                      {agentLoans.length === 0 ? (
                        <p className="text-slate-400 text-xs italic">No active bank borrowings or loans taken.</p>
                      ) : (
                        <div className="space-y-2">
                          {agentLoans.map((l) => (
                            <div key={l.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-slate-800">Tier {l.loan_type ?? 1} Credit Facility</span>
                                <span className="text-slate-400 text-[10px] ml-2">Day {l.day_borrowed ?? l.day} borrowed</span>
                              </div>
                              <div className="font-mono font-bold text-slate-900">
                                ₹{(l.amount || 0).toLocaleString('en-IN')} ({( (l.interest_rate ?? 0.02) * 100).toFixed(1)}% p.a.)
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

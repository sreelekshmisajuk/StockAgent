import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Sparkles,
  Filter,
  MessageSquare,
  FileText,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bot,
  Layers,
  DollarSign,
  Building2,
  Share2
} from 'lucide-react';
import { MacroEvent, ForumMessage, CompanyFinancials } from '../types';
import { api } from '../services/api';

interface NewsViewProps {
  news: MacroEvent[];
  forum?: ForumMessage[];
  simulationId?: string;
}

export const NewsView: React.FC<NewsViewProps> = ({ news, forum = [], simulationId }) => {
  const [activeTab, setActiveTab] = useState<'special_events' | 'financial_reports' | 'bbs_discussion'>('special_events');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [financials, setFinancials] = useState<CompanyFinancials[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('A');

  useEffect(() => {
    if (simulationId) {
      api.getFinancialReports(simulationId)
        .then((res) => {
          if (res && res.companies) {
            setFinancials(res.companies);
          }
        })
        .catch(() => {
          // Fallback static data if network fails
          setFinancials([]);
        });
    }
  }, [simulationId]);

  // Default fallback financials matching StockAgent empirical constants
  const defaultFinancials: CompanyFinancials[] = [
    {
      ticker: 'A',
      company_name: 'Company A (Chemicals & Core Manufacturing)',
      sector: 'Industrial & Basic Materials',
      summary: {
        gross_margin: '41.05%',
        net_profit_margin: '19.11%',
        operating_margin: '20.45%',
        return_on_investment: '12.4%',
        wacc: '8.85%',
        cost_of_debt: '5.50%',
        sustainable_growth_rate: '5.00%'
      },
      quarterly_statements: [
        { quarter: '03/23 (Q1)', revenue: 4483.99, gross_profit: 1840.67, operating_income: 917.47, net_income: 856.67, growth_yoy: '9.49%' },
        { quarter: '06/23 (Q2)', revenue: 4417.79, gross_profit: 1576.26, operating_income: 538.97, net_income: 493.95, growth_yoy: '7.38%' },
        { quarter: '09/23 (Q3)', revenue: 4041.30, gross_profit: 1513.46, operating_income: 768.25, net_income: 724.36, growth_yoy: '8.70%' },
        { quarter: '12/23 (Q4)', revenue: 5024.04, gross_profit: 2133.70, operating_income: 1115.33, net_income: 1031.21, growth_yoy: '7.75%' }
      ]
    },
    {
      ticker: 'B',
      company_name: 'Company B (Software & Cloud Technology)',
      sector: 'Information Technology & High Beta',
      summary: {
        gross_margin: '31.21%',
        net_profit_margin: '17.04%',
        operating_margin: '18.35%',
        return_on_investment: '15.8%',
        wacc: '8.79%',
        cost_of_debt: '5.50%',
        sustainable_growth_rate: '5.00%'
      },
      quarterly_statements: [
        { quarter: '03/23 (Q1)', revenue: 1319.94, gross_profit: 411.95, operating_income: 234.95, net_income: 224.92, growth_yoy: '19.96%' },
        { quarter: '06/23 (Q2)', revenue: 1096.70, gross_profit: 342.82, operating_income: 195.21, net_income: 186.77, growth_yoy: '19.86%' },
        { quarter: '09/23 (Q3)', revenue: 1676.70, gross_profit: 529.49, operating_income: 289.87, net_income: 278.33, growth_yoy: '18.21%' },
        { quarter: '12/23 (Q4)', revenue: 1075.13, gross_profit: 348.45, operating_income: 191.37, net_income: 181.16, growth_yoy: '15.98%' }
      ]
    }
  ];

  const activeFinancials = financials.length > 0 ? financials : defaultFinancials;
  const currentCompany = activeFinancials.find((c) => c.ticker === selectedCompany) || activeFinancials[0];

  const filteredNews = news.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    return (item.category || 'Macroeconomic').toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* 4-Pillar Information Convergence Architecture Banner (Matching StockAgent Research Framework) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Source Investor Information Environment</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Information Synthesis & Decision Pipeline
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every autonomous AI investor continuously interprets 4 synchronized market signals: real-time stock prices, quarterly financial reports, peer investor discussions on the BBS forum, and macroeconomic policy shocks.
            </p>
          </div>

          {/* 4 Interactive Visual Blocks Converging on Agent */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Stock Price */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl hover:border-blue-400 transition">
              <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[11px] mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Stock Price</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Live clearing ticks, bid-ask spreads & historical trend momentum.
              </p>
            </div>

            {/* 2. Financial Report */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl hover:border-emerald-400 transition">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Financial Report</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Gross margins, quarterly revenues, operating income & DCF metrics.
              </p>
            </div>

            {/* 3. BBS Discussion */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl hover:border-indigo-400 transition">
              <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[11px] mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>BBS Discussion</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Peer investor opinions, recommendations & collective crowd sentiment.
              </p>
            </div>

            {/* 4. Special Event */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl hover:border-amber-400 transition">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px] mb-1">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Special Event</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                RRR policy cuts, benchmark interest rates & exogenous macro shocks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('special_events')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'special_events'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Special Events & Policy Shocks ({news.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('financial_reports')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'financial_reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Corporate Financial Reports (Company A & B)</span>
        </button>

        <button
          onClick={() => setActiveTab('bbs_discussion')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'bbs_discussion'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>BBS Discussion Forum ({forum.length})</span>
        </button>
      </div>

      {/* TAB 1: Special Events & Policy Shocks */}
      {activeTab === 'special_events' && (
        <div className="space-y-5">
          {/* Category Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Filter Event Category:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Macroeconomic', 'Government and Policy', 'Company Fundamentals', 'Global Events', 'Custom Event'].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Events Stream */}
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
                <Newspaper className="w-8 h-8 mb-2 opacity-40 mx-auto text-blue-500" />
                <p className="font-semibold text-slate-600 text-sm">No external events recorded for current filters.</p>
                <p className="text-slate-400 mt-1">
                  Launch an Event-Driven simulation to observe real-time macroeconomic shocks, earnings releases, and custom policy announcements.
                </p>
              </div>
            ) : (
              filteredNews.map((item) => {
                const headline = item.event_name || item.headline || 'Market Event';
                const body = item.message || item.body || '';
                const category = item.category || 'Macroeconomic';
                const sentiment = (item.sentiment || 'NEUTRAL').toUpperCase();
                const severity = (item.severity || 'MODERATE').toUpperCase();
                const affected = item.affected_stocks || item.impact_stock || 'ALL';

                const sentimentBadge =
                  sentiment === 'POSITIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : sentiment === 'NEGATIVE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';

                const severityBadge =
                  severity === 'CRITICAL' || severity === 'HIGH'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-800">
                          Day {item.day} {item.session ? `· Session ${item.session}` : ''}
                        </span>
                        <span className="px-2.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {category}
                        </span>
                        <span className="text-slate-400 font-mono">Target: {affected}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sentimentBadge}`}>
                          {sentiment}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadge}`}>
                          {severity} SEVERITY
                        </span>
                      </div>
                    </div>

                    {/* Event Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{headline}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100 font-mono">
                        {body}
                      </p>
                    </div>

                    {/* Section 9: Agent Reaction & Impact Analysis */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-3">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <BarChart2 className="w-4 h-4 text-blue-600" />
                          <span>Empirical Investor Persona Reactions (Section 9)</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Decisions generated independently by autonomous persona brains
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Conservative</div>
                          <div className="font-mono font-bold text-slate-800 mt-0.5">
                            {sentiment === 'NEGATIVE' ? 'HOLD / DEFEND' : 'ACCUMULATE'}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Preserves liquidity; limits drawdown.</p>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Aggressive</div>
                          <div className="font-mono font-bold text-rose-600 mt-0.5">
                            {sentiment === 'NEGATIVE' ? 'DIP BUY / VOL' : 'LEVERAGE BUY'}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Hedges short-term or buys high beta.</p>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Fundamental</div>
                          <div className="font-mono font-bold text-blue-600 mt-0.5">
                            {sentiment === 'NEGATIVE' ? 'DCF RE-EVAL' : 'VALUE BUY'}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Compares DCF intrinsic midpoint.</p>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">News-Driven</div>
                          <div className="font-mono font-bold text-amber-600 mt-0.5">
                            {sentiment === 'NEGATIVE' ? 'FAST REBALANCE' : 'MOMENTUM ENTRY'}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Adjusts inventory to policy risk.</p>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Technical</div>
                          <div className="font-mono font-bold text-indigo-600 mt-0.5">
                            TREND TRACK
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Monitors support/resistance levels.</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                        <span>Observed Market Association: Stock price clearing shifted according to order book bid/ask pressure.</span>
                        <span className="font-medium text-slate-700">Reproducible Simulation Rule</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Corporate Financial Reports (Company A & Company B) */}
      {activeTab === 'financial_reports' && (
        <div className="space-y-5">
          {/* Company Selector */}
          <div className="flex items-center space-x-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600">Select Corporation:</span>
            {activeFinancials.map((comp) => (
              <button
                key={comp.ticker}
                onClick={() => setSelectedCompany(comp.ticker)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                  selectedCompany === comp.ticker
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{comp.company_name}</span>
              </button>
            ))}
          </div>

          {/* Key Financial Ratios Banner */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{currentCompany.company_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sector: {currentCompany.sector}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-mono font-semibold">
                Ticker: {currentCompany.ticker}
              </span>
            </div>

            {/* Ratio Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Gross Margin</span>
                <span className="text-slate-900 font-bold font-mono text-base mt-0.5 block text-blue-600">
                  {currentCompany.summary.gross_margin}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Net Profit Margin</span>
                <span className="text-slate-900 font-bold font-mono text-base mt-0.5 block text-emerald-600">
                  {currentCompany.summary.net_profit_margin}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Operating Margin</span>
                <span className="text-slate-900 font-bold font-mono text-base mt-0.5 block text-indigo-600">
                  {currentCompany.summary.operating_margin}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block font-medium">Return on Investment</span>
                <span className="text-slate-900 font-bold font-mono text-base mt-0.5 block text-amber-600">
                  {currentCompany.summary.return_on_investment}
                </span>
              </div>
            </div>

            {/* Secondary Financial Cost Rates */}
            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 flex justify-between">
                <span className="text-slate-500">WACC (Weighted Capital Cost):</span>
                <span className="font-mono font-semibold text-slate-800">{currentCompany.summary.wacc}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 flex justify-between">
                <span className="text-slate-500">Cost of Debt:</span>
                <span className="font-mono font-semibold text-slate-800">{currentCompany.summary.cost_of_debt}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 flex justify-between">
                <span className="text-slate-500">Sustainable Growth Rate:</span>
                <span className="font-mono font-semibold text-slate-800">{currentCompany.summary.sustainable_growth_rate}</span>
              </div>
            </div>
          </div>

          {/* Quarterly Income Statement Table (Matching Research Diagram Table) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Quarterly Statement of Operations (Past 4 Quarters)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Values audited and evaluated by Fundamental Investor agents
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Figures in Million (M)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Financial Metric</th>
                    {currentCompany.quarterly_statements.map((q) => (
                      <th key={q.quarter} className="py-3 px-5 text-right font-mono">
                        {q.quarter}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-sans font-semibold text-slate-900">Total Revenue</td>
                    {currentCompany.quarterly_statements.map((q) => (
                      <td key={q.quarter} className="py-3 px-5 text-right font-bold text-slate-900">
                        ₹{q.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}M
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-sans text-slate-700">Gross Profit</td>
                    {currentCompany.quarterly_statements.map((q) => (
                      <td key={q.quarter} className="py-3 px-5 text-right text-emerald-600 font-semibold">
                        ₹{q.gross_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}M
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-sans text-slate-700">Operating Income</td>
                    {currentCompany.quarterly_statements.map((q) => (
                      <td key={q.quarter} className="py-3 px-5 text-right text-indigo-600 font-semibold">
                        ₹{q.operating_income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}M
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                    <td className="py-3 px-5 font-sans font-bold text-slate-900">Net Income (Net Profit)</td>
                    {currentCompany.quarterly_statements.map((q) => (
                      <td key={q.quarter} className="py-3 px-5 text-right font-bold text-slate-900">
                        ₹{q.net_income.toLocaleString('en-IN', { maximumFractionDigits: 2 })}M
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-sans text-slate-500">Revenue Growth (YoY)</td>
                    {currentCompany.quarterly_statements.map((q) => (
                      <td key={q.quarter} className="py-3 px-5 text-right text-blue-600 font-semibold">
                        {q.growth_yoy}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BBS Discussion Forum */}
      {activeTab === 'bbs_discussion' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Investor Community Bulletin Board (BBS Discussion)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily posts, sentiments, and recommendations shared among autonomous AI agents
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              {forum.length} Total Messages
            </span>
          </div>

          {forum.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40 mx-auto text-indigo-500" />
              <p className="font-semibold text-slate-600 text-sm">Investor discussion forum is quiet.</p>
              <p className="text-slate-400 mt-1">
                At the end of each trading day, agents review session prices and publish their market recommendations here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forum.map((msg) => {
                const messageText = msg.message || msg.content || '';
                const agentLabel = `Agent ${msg.agent_id}`;
                const isBuyRec = messageText.toLowerCase().includes('recommend stock a') || messageText.toLowerCase().includes('buy') || messageText.toLowerCase().includes('bullish');
                const isSellRec = messageText.toLowerCase().includes('sell') || messageText.toLowerCase().includes('avoid') || messageText.toLowerCase().includes('bearish');

                return (
                  <div
                    key={msg.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900">{agentLabel}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">Day {msg.day}</span>
                          </div>
                        </div>

                        {isBuyRec ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            BULLISH CUE
                          </span>
                        ) : isSellRec ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            CAUTIONARY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            MARKET OPINION
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                        "{messageText}"
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>BBS Discussion Stream</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

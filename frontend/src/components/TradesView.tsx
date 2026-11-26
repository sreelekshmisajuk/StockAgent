import React, { useState } from 'react';
import { ListOrdered, Filter, Search, ChevronDown, ChevronUp, ShieldCheck, Zap } from 'lucide-react';
import { TradeOrder } from '../types';

interface TradesViewProps {
  trades: TradeOrder[];
}

export const TradesView: React.FC<TradesViewProps> = ({ trades }) => {
  const [tickerFilter, setTickerFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'HOLD'>('ALL');
  const [searchAgent, setSearchAgent] = useState<string>('');
  const [expandedTradeId, setExpandedTradeId] = useState<number | null>(null);

  // Extract unique tickers dynamically
  const uniqueTickers = Array.from(new Set(trades.map((t) => t.ticker.toUpperCase())));

  const filteredTrades = trades.filter((t) => {
    if (tickerFilter !== 'ALL' && (t.ticker || '').toUpperCase() !== tickerFilter) return false;
    if (typeFilter !== 'ALL') {
      const orderAction = (t.order_type || 'MATCH').toUpperCase();
      if (typeFilter === 'BUY' && (t.buyer_id === undefined || t.buyer_id === null)) return false;
      if (typeFilter === 'SELL' && (t.seller_id === undefined || t.seller_id === null)) return false;
    }
    if (searchAgent.trim()) {
      const q = searchAgent.toLowerCase();
      const b = String(t.buyer_id ?? '').toLowerCase();
      const s = String(t.seller_id ?? '').toLowerCase();
      const tk = String(t.ticker ?? '').toLowerCase();
      if (!b.includes(q) && !s.includes(q) && !tk.includes(q)) return false;
    }
    return true;
  });

  const totalVolume = filteredTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalTurnover = filteredTrades.reduce((sum, t) => sum + (t.turnover || (t.price * t.amount)), 0);

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Logged Decisions & Trades</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{filteredTrades.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Executed Share Volume</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalVolume.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Trading Turnover</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            ₹{totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Average Execution Price</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{filteredTrades.length > 0 ? (totalTurnover / Math.max(1, totalVolume)).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ticker Filter */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setTickerFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${tickerFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600'
                }`}
            >
              All Tickers
            </button>
            {uniqueTickers.map((tick) => (
              <button
                key={tick}
                onClick={() => setTickerFilter(tick)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${tickerFilter === tick ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600'
                  }`}
              >
                {tick}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {['ALL', 'BUY', 'SELL'].map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp as any)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${typeFilter === tp ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                  }`}
              >
                {tp === 'ALL' ? 'All Actions' : tp}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by agent order ID..."
            value={searchAgent}
            onChange={(e) => setSearchAgent(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
          />
        </div>
      </div>

      {/* Trades Table with Structured AI Decision Display */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Trading Ledger & Autonomous AI Rationale</h3>
          <span className="text-xs text-slate-500">{filteredTrades.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Timeline</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Ticker</th>
                <th className="py-2.5 px-4">Shares</th>
                <th className="py-2.5 px-4">Price</th>
                <th className="py-2.5 px-4">Turnover</th>
                <th className="py-2.5 px-4">Buyer / Seller</th>
                <th className="py-2.5 px-4">Risk & Confidence</th>
                <th className="py-2.5 px-4 text-right">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                    No executed trades match current filters.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const isBuy = trade.order_type === 'BUY';
                  const isExpanded = expandedTradeId === trade.id;
                  const turnoverVal = trade.turnover || trade.price * trade.amount;
                  const riskLevel = trade.risk_assessment || 'Medium';
                  const conf = trade.confidence || 85;

                  return (
                    <React.Fragment key={trade.id}>
                      <tr
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className="hover:bg-slate-50/60 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-4 text-slate-600 font-semibold">
                          D{trade.day}-S{trade.session}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {trade.order_type || 'MATCH'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {trade.ticker.toUpperCase()}
                        </td>
                        <td className="py-2.5 px-4 text-slate-800">
                          {trade.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          ₹{trade.price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-emerald-600">
                          ₹{turnoverVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                          B: {trade.buyer_id || 'Agent'} · S: {trade.seller_id || 'Market'}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-1.5 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${riskLevel === 'High'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : riskLevel === 'Low'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                              {riskLevel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{conf}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-sans font-semibold inline-flex items-center space-x-0.5"
                          >
                            <span>{isExpanded ? 'Hide' : 'View'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable LLM Reasoning Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={9} className="py-3 px-6 text-xs font-sans text-slate-700 border-b border-slate-100">
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-2">
                              <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-100">
                                <span className="font-bold text-slate-900 flex items-center space-x-1">
                                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Autonomous AI Decision Rationale (Section 4)</span>
                                </span>
                                <span className="text-slate-500 font-mono">
                                  Confidence: {conf}% · Risk Assessment: {riskLevel}
                                </span>
                              </div>
                              <p className="text-slate-700 text-xs leading-relaxed italic">
                                "{trade.reasoning || 'Evaluated current order book depth and macro factor signals. Executing limit order at market equilibrium.'}"
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Wallet, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { AgentProfile, PortfolioHistory, LoanRecord } from '../types';

interface PortfoliosViewProps {
  agents: AgentProfile[];
  portfolios: PortfolioHistory[];
  loans: LoanRecord[];
}

export const PortfoliosView: React.FC<PortfoliosViewProps> = ({ agents, portfolios, loans }) => {
  const latestPortfolios = React.useMemo(() => {
    const map = new Map<string, PortfolioHistory>();
    portfolios.forEach((p) => {
      const key = String(p.agent_id);
      const existing = map.get(key);
      if (!existing || p.day > existing.day || (p.day === existing.day && p.session >= existing.session)) {
        map.set(key, p);
      }
    });
    return map;
  }, [portfolios]);

  const totalCapital = agents.reduce((sum, a) => {
    const p = latestPortfolios.get(String(a.id)) || latestPortfolios.get(String(a.agent_order));
    return sum + (p?.net_worth ?? a.initial_cash);
  }, 0);

  const totalDebt = loans.filter((l) => !l.is_repaid).reduce((sum, l) => sum + (l.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Portfolio Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Agent Capital</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{totalCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Portfolios</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{agents.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Aggregate Debt</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            ₹{totalDebt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Avg Net Worth</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{agents.length > 0 ? (totalCapital / agents.length).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
          </div>
        </div>
      </div>

      {/* Portfolio Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Investor Balance Sheets</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time asset allocations, liquid cash, and stock inventory</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{agents.length} Portfolios</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Agent Name</th>
                <th className="py-2.5 px-4">Strategy</th>
                <th className="py-2.5 px-4">Liquid Cash</th>
                <th className="py-2.5 px-4">Stock A</th>
                <th className="py-2.5 px-4">Stock B</th>
                <th className="py-2.5 px-4">Debt</th>
                <th className="py-2.5 px-4">Net Worth</th>
                <th className="py-2.5 px-4">Gain / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No agent portfolios available.
                  </td>
                </tr>
              ) : (
                agents.map((agent) => {
                  const port = latestPortfolios.get(String(agent.id)) || latestPortfolios.get(String(agent.agent_order));
                  const cash = port?.cash ?? agent.initial_cash;
                  const stockA = port?.stock_a_amount ?? agent.initial_stock_a;
                  const stockB = port?.stock_b_amount ?? agent.initial_stock_b;
                  const debt = port?.total_debt ?? 0;
                  const netWorth = port?.net_worth ?? agent.initial_cash;
                  const gain = netWorth - agent.initial_cash;
                  const gainPercent = agent.initial_cash > 0 ? (gain / agent.initial_cash) * 100 : 0;

                  return (
                    <tr key={agent.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        {agent.name}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {agent.risk_appetite || 'Balanced'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        ₹{cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {stockA.toLocaleString('en-IN')} shs
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {stockB.toLocaleString('en-IN')} shs
                      </td>
                      <td className="py-3 px-4 text-amber-600">
                        ₹{debt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            gain >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                          }`}
                        >
                          {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
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

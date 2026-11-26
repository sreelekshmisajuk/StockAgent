import React, { useState } from 'react';
import { DollarSign, Users, Zap, TrendingUp, BarChart2, CandlestickChart as CandleIcon } from 'lucide-react';
import { DashboardStats, SimulationRun, StockSnapshot, TradeOrder } from '../types';
import { MarketChart } from './MarketChart';
import { CandlestickChart } from './CandlestickChart';
import { OrderBookTape } from './OrderBookTape';

interface DashboardViewProps {
  stats: DashboardStats | null;
  activeSim: SimulationRun | null;
  snapshots: StockSnapshot[];
  trades: TradeOrder[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  activeSim,
  snapshots,
  trades,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'candlestick' | 'simulation'>('candlestick');

  const stockList = (activeSim?.stocks || 'Stock A, Stock B').split(',').map((s) => s.trim());
  const labelA = stockList[0] || 'Stock A';
  const labelB = stockList[1] || 'Stock B';

  const latestSnapA = [...snapshots].reverse().find((s) => {
    const t = (s.ticker || '').toLowerCase();
    return t === labelA.toLowerCase() || t === 'a' || t === 'stock_a';
  });
  const latestSnapB = [...snapshots].reverse().find((s) => {
    const t = (s.ticker || '').toLowerCase();
    return t === labelB.toLowerCase() || t === 'b' || t === 'stock_b';
  });

  const priceA = latestSnapA ? ((latestSnapA as any).price ?? latestSnapA.close_price ?? 26.79) : (stats?.latest_stock_a_price ?? 26.79);
  const priceB = latestSnapB ? ((latestSnapB as any).price ?? latestSnapB.close_price ?? 42.23) : (stats?.latest_stock_b_price ?? 42.23);

  return (
    <div className="space-y-5">
      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stock A Price */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">{labelA} (Chemicals)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{priceA.toFixed(2)}
          </div>
        </div>

        {/* Stock B Price */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">{labelB} (Technology)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{priceB.toFixed(2)}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Investor Agents</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {activeSim?.total_agents ?? 5}
          </div>
        </div>

        {/* Executed Trades */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Executed Trades</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {stats?.total_executed_trades ?? trades.length}
          </div>
        </div>
      </div>

      {/* Mode Switcher Pill */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Market Chart Mode:</span>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveChartTab('candlestick')}
            className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1.5 ${
              activeChartTab === 'candlestick'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Real-World Candlesticks (Green / Red)</span>
          </button>
          <button
            onClick={() => setActiveChartTab('simulation')}
            className={`px-3 py-1 rounded-md font-semibold transition flex items-center space-x-1.5 ${
              activeChartTab === 'simulation'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Simulation Price Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Split: Candlestick/Market Chart + Trades Tape */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          {activeChartTab === 'candlestick' ? (
            <CandlestickChart
              initialTicker="AAPL"
              simulationId={activeSim?.id}
            />
          ) : (
            <MarketChart
              snapshots={snapshots}
              latestPrices={{
                stock_a: priceA,
                stock_b: priceB,
              }}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <OrderBookTape trades={trades} />
        </div>
      </div>
    </div>
  );
};

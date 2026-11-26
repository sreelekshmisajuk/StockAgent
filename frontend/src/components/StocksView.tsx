import React from 'react';
import { StockSnapshot } from '../types';
import { MarketChart } from './MarketChart';

interface StocksViewProps {
  snapshots: StockSnapshot[];
  latestPrices: { stock_a?: number; stock_b?: number };
}

export const StocksView: React.FC<StocksViewProps> = ({ snapshots, latestPrices }) => {
  const stockASnaps = snapshots.filter((s) => {
    const t = (s.ticker || '').toLowerCase();
    return t === 'a' || t === 'stock_a' || t.includes('a');
  });
  const stockBSnaps = snapshots.filter((s) => {
    const t = (s.ticker || '').toLowerCase();
    return t === 'b' || t === 'stock_b' || t.includes('b');
  });

  const priceA = latestPrices.stock_a ?? 26.79;
  const priceB = latestPrices.stock_b ?? 42.23;

  return (
    <div className="space-y-5">
      {/* Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Stock A Valuation (Chemicals)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                ₹{priceA.toFixed(2)}
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-200">
              EQUITY A
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Historical Ticks: {stockASnaps.length}</span>
            <span>Initial: ₹26.79</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Stock B Valuation (Technology)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                ₹{priceB.toFixed(2)}
              </div>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full border border-indigo-200">
              EQUITY B
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>Historical Ticks: {stockBSnaps.length}</span>
            <span>Initial: ₹42.23</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <MarketChart snapshots={snapshots} latestPrices={{ stock_a: priceA, stock_b: priceB }} />
    </div>
  );
};

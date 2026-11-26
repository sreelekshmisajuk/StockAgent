import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { StockSnapshot } from '../types';

interface MarketChartProps {
  snapshots: StockSnapshot[];
  latestPrices: { stock_a?: number; stock_b?: number };
}

export const MarketChart: React.FC<MarketChartProps> = ({ snapshots, latestPrices }) => {
  const [selectedTicker, setSelectedTicker] = useState<'ALL' | 'stock_a' | 'stock_b'>('ALL');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  const baseA = latestPrices.stock_a ?? 26.79;
  const baseB = latestPrices.stock_b ?? 42.23;

  // Detect active stock ticker symbols dynamically
  const detectedTickers = React.useMemo(() => {
    const set = new Set<string>();
    snapshots.forEach((s) => {
      if (s.ticker) set.add(s.ticker.toUpperCase());
    });
    return Array.from(set);
  }, [snapshots]);

  const labelA = detectedTickers[0] || 'Stock A';
  const labelB = detectedTickers[1] || 'Stock B';

  const tickerData = React.useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return [
        { label: 'Day 1 Open', day: 1, session: 0, stock_a: baseA, stock_b: baseB },
        { label: 'Day 1 Close', day: 1, session: 1, stock_a: baseA, stock_b: baseB }
      ];
    }

    const timeMap = new Map<string, { label: string; day: number; session: number; stock_a?: number; stock_b?: number }>();

    snapshots.forEach((s) => {
      const d = (s.day != null && !isNaN(Number(s.day))) ? Number(s.day) : 1;
      const sess = (s.session != null && !isNaN(Number(s.session))) ? Number(s.session) : 1;
      const key = `Day ${d} · Sess ${sess}`;

      const existing = timeMap.get(key) || {
        label: key,
        day: d,
        session: sess,
      };

      const ticker = (s.ticker || '').toUpperCase();
      const p = (s as any).price ?? s.close_price ?? baseA;

      if (ticker === labelA.toUpperCase() || ticker === 'A' || ticker === 'STOCK_A') {
        existing.stock_a = p;
      } else if (ticker === labelB.toUpperCase() || ticker === 'B' || ticker === 'STOCK_B') {
        existing.stock_b = p;
      } else if (!existing.stock_a) {
        existing.stock_a = p;
      } else {
        existing.stock_b = p;
      }

      timeMap.set(key, existing);
    });

    const list = Array.from(timeMap.values()).sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.session - b.session;
    });

    if (list.length === 0) {
      return [
        { label: 'Day 1 Open', day: 1, session: 0, stock_a: baseA, stock_b: baseB },
        { label: 'Day 1 Close', day: 1, session: 1, stock_a: baseA, stock_b: baseB }
      ];
    }

    // Carry forward prices across sessions
    let currentA = baseA;
    let currentB = baseB;
    const filled = list.map((item) => {
      if (item.stock_a != null) currentA = item.stock_a;
      if (item.stock_b != null) currentB = item.stock_b;
      return {
        ...item,
        stock_a: item.stock_a ?? currentA,
        stock_b: item.stock_b ?? currentB,
      };
    });

    if (filled.length === 1) {
      return [
        { label: 'Day 1 Open', day: 1, session: 0, stock_a: baseA, stock_b: baseB },
        filled[0]
      ];
    }

    return filled;
  }, [snapshots, labelA, labelB, baseA, baseB]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Price Chart</h3>

        <div className="flex items-center space-x-2">
          {/* Ticker Filter */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setSelectedTicker('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${selectedTicker === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
            >
              Both
            </button>
            <button
              onClick={() => setSelectedTicker('stock_a')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${selectedTicker === 'stock_a' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                }`}
            >
              {labelA}
            </button>
            <button
              onClick={() => setSelectedTicker('stock_b')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${selectedTicker === 'stock_b' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
            >
              {labelB}
            </button>
          </div>

          {/* Mode */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${chartType === 'area' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-2 py-1 rounded text-xs font-medium transition ${chartType === 'line' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={tickerData}>
              <defs>
                <linearGradient id="colorStockA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorStockB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={[
                  (dataMin: number) => {
                    const min = Number.isFinite(dataMin) ? dataMin : 25;
                    return Math.floor(Math.max(0, min * 0.90));
                  },
                  (dataMax: number) => {
                    const max = Number.isFinite(dataMax) ? dataMax : 45;
                    return Math.ceil(max * 1.10);
                  }
                ]}
                tickLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                }}
                formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Price']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {(selectedTicker === 'ALL' || selectedTicker === 'stock_a') && (
                <Area
                  type="monotone"
                  name={labelA}
                  dataKey="stock_a"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorStockA)"
                />
              )}
              {(selectedTicker === 'ALL' || selectedTicker === 'stock_b') && (
                <Area
                  type="monotone"
                  name={labelB}
                  dataKey="stock_b"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorStockB)"
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={tickerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={[
                  (dataMin: number) => {
                    const min = Number.isFinite(dataMin) ? dataMin : 25;
                    return Math.floor(Math.max(0, min * 0.90));
                  },
                  (dataMax: number) => {
                    const max = Number.isFinite(dataMax) ? dataMax : 45;
                    return Math.ceil(max * 1.10);
                  }
                ]}
                tickLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'Price']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {(selectedTicker === 'ALL' || selectedTicker === 'stock_a') && (
                <Line
                  type="monotone"
                  name={labelA}
                  dataKey="stock_a"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
              {(selectedTicker === 'ALL' || selectedTicker === 'stock_b') && (
                <Line
                  type="monotone"
                  name={labelB}
                  dataKey="stock_b"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

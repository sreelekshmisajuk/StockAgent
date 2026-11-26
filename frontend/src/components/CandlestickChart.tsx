import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Maximize2,
  RefreshCw,
  Search,
  CheckCircle2,
  Sliders,
  Layers
} from 'lucide-react';
import { LiveStockQuote, CandleStickData } from '../types';
import { api } from '../services/api';

interface CandlestickChartProps {
  initialTicker?: string;
  simulationId?: string;
}

const PRESET_STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'NVDA', name: 'Nvidia' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'AMZN', name: 'Amazon' },
  { ticker: 'A', name: 'Stock A (Sim)' },
  { ticker: 'B', name: 'Stock B (Sim)' },
];

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  initialTicker = 'AAPL',
  simulationId
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [quoteData, setQuoteData] = useState<LiveStockQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');
  const [hoveredCandle, setHoveredCandle] = useState<CandleStickData | null>(null);
  const [customSearch, setCustomSearch] = useState<string>('');

  const fetchQuote = async (ticker: string, curr: 'INR' | 'USD') => {
    setLoading(true);
    try {
      const data = await api.getLiveStockQuote(ticker, curr, simulationId);
      if (data && data.candlesticks) {
        setQuoteData(data);
      }
    } catch (err) {
      console.error('Failed to fetch live stock quote', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote(selectedTicker, currency);
  }, [selectedTicker, currency, simulationId]);

  const handleSelectPreset = (tick: string) => {
    setSelectedTicker(tick);
    setHoveredCandle(null);
  };

  const handleCustomSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearch.trim()) {
      setSelectedTicker(customSearch.trim().toUpperCase());
      setCustomSearch('');
      setHoveredCandle(null);
    }
  };

  const candles = quoteData?.candlesticks || [];

  // Compute scale bounds for SVG rendering
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1000 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.1 || 5;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol || 1000
    };
  }, [candles]);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const isPositive = (quoteData?.change || 0) >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
      {/* Top Header & Stock Selection Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 uppercase tracking-wider">
            Markets:
          </span>
          {PRESET_STOCKS.map((st) => (
            <button
              key={st.ticker}
              onClick={() => handleSelectPreset(st.ticker)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedTicker === st.ticker
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st.ticker}
            </button>
          ))}
        </div>

        {/* Currency & Chart Type Switchers */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Custom Search Box */}
          <form onSubmit={handleCustomSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search ticker (e.g. TSLA)..."
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-36"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </form>

          {/* Currency Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                currency === 'INR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                currency === 'USD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setChartMode('candles')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                chartMode === 'candles' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Candles (Green/Red)
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                chartMode === 'line' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Area Line
            </button>
          </div>

          <button
            onClick={() => fetchQuote(selectedTicker, currency)}
            title="Refresh Live Market Data"
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Market Price Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/80 p-4 rounded-xl border border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-base">{quoteData?.company_name || selectedTicker}</span>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-mono text-[10px] rounded font-semibold">
              {quoteData?.ticker || selectedTicker}
            </span>
          </div>

          <div className="flex items-baseline space-x-3 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {currencySymbol}{(quoteData?.current_price ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-semibold flex items-center space-x-0.5 ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? '+' : ''}{(quoteData?.change ?? 0).toFixed(2)} ({isPositive ? '+' : ''}{(quoteData?.change_percent ?? 0).toFixed(2)}%)
              </span>
            </span>
          </div>
        </div>

        {/* OHLC Mini-Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Open</span>
            <span className="font-semibold text-slate-800">{currencySymbol}{(quoteData?.open_price ?? 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">24h High</span>
            <span className="font-semibold text-emerald-600">{currencySymbol}{(quoteData?.high_price ?? 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">24h Low</span>
            <span className="font-semibold text-rose-600">{currencySymbol}{(quoteData?.low_price ?? 0).toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-sans">Volume</span>
            <span className="font-semibold text-slate-800">{((quoteData?.volume ?? 0) / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* Candlestick Inspection HUD (Active when hovering over any bar) */}
      <div className="h-6 text-xs font-mono flex items-center space-x-4 text-slate-500 bg-white px-2">
        {hoveredCandle ? (
          <>
            <span className="font-sans font-bold text-slate-800">{hoveredCandle.time}</span>
            <span>O: <strong className="text-slate-800">{currencySymbol}{hoveredCandle.open.toFixed(2)}</strong></span>
            <span>H: <strong className="text-emerald-600">{currencySymbol}{hoveredCandle.high.toFixed(2)}</strong></span>
            <span>L: <strong className="text-rose-600">{currencySymbol}{hoveredCandle.low.toFixed(2)}</strong></span>
            <span>C: <strong className={hoveredCandle.is_bullish ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{currencySymbol}{hoveredCandle.close.toFixed(2)}</strong></span>
            <span>Vol: <strong className="text-slate-700">{hoveredCandle.volume.toLocaleString()}</strong></span>
          </>
        ) : (
          <span className="text-slate-400 italic">Hover over any green/red candle to inspect exact open, high, low, close, and volume</span>
        )}
      </div>

      {/* Real-World Green & Red Candlestick Chart (SVG Responsive Rendering) */}
      <div className="w-full h-80 relative select-none">
        {candles.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs bg-slate-50/50 rounded-lg">
            <span>Loading live stock market data...</span>
          </div>
        ) : (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 320" preserveAspectRatio="none">
            {/* Background Grid Lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1="0" y1="220" x2="800" y2="220" stroke="#f1f5f9" strokeDasharray="3 3" />
            <line x1="0" y1="250" x2="800" y2="250" stroke="#e2e8f0" />

            {/* Price Labels on Right Axis */}
            <text x="795" y="45" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
              {currencySymbol}{maxPrice.toFixed(1)}
            </text>
            <text x="795" y="165" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
              {currencySymbol}{((maxPrice + minPrice) / 2).toFixed(1)}
            </text>
            <text x="795" y="245" textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
              {currencySymbol}{minPrice.toFixed(1)}
            </text>

            {/* Candlesticks & Volume Bars */}
            {candles.map((candle, idx) => {
              const count = candles.length;
              const slotWidth = 760 / count;
              const x = 20 + idx * slotWidth + slotWidth / 2;
              const candleBodyWidth = Math.max(4, slotWidth * 0.65);

              // Price mapping (Y coordinates: 20px top to 240px bottom)
              const priceToY = (price: number) => {
                const range = maxPrice - minPrice || 1;
                return 240 - ((price - minPrice) / range) * 210;
              };

              const openY = priceToY(candle.open);
              const closeY = priceToY(candle.close);
              const highY = priceToY(candle.high);
              const lowY = priceToY(candle.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(3, Math.abs(closeY - openY));

              // Volume bar mapping (Y coordinates: 310px bottom up to 250px)
              const volHeight = Math.min(60, (candle.volume / (maxVolume || 1)) * 60);
              const volY = 310 - volHeight;

              const isGreen = candle.is_bullish;
              const fillColor = isGreen ? '#10b981' : '#ef4444';
              const wickColor = isGreen ? '#059669' : '#dc2626';

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setHoveredCandle(candle)}
                >
                  {/* Candlestick Wick (Upper & Lower Shadow) */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={wickColor}
                    strokeWidth="1.5"
                  />

                  {/* Candlestick Real-World Body (Green = Bullish, Red = Bearish) */}
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={fillColor}
                    rx="1.5"
                    stroke={fillColor}
                    strokeWidth="0.5"
                  />

                  {/* Bottom Volume Bar */}
                  <rect
                    x={x - candleBodyWidth / 2}
                    y={volY}
                    width={candleBodyWidth}
                    height={volHeight}
                    fill={fillColor}
                    opacity="0.35"
                    rx="1"
                  />

                  {/* Timeline Date Label */}
                  {idx % Math.ceil(count / 7) === 0 && (
                    <text
                      x={x}
                      y="322"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="sans-serif"
                    >
                      {candle.time}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Legend & Real-World Market Indicator Notes */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="font-semibold text-emerald-700">Green Candle (Bullish: Close ≥ Open)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span className="font-semibold text-rose-700">Red Candle (Bearish: Close &lt; Open)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-2 rounded-sm bg-slate-300 inline-block" />
            <span>Bottom: Trading Volume Histogram</span>
          </div>
        </div>

        <div className="text-slate-400 font-mono text-[10px]">
          Live feed powered by Yahoo Finance API & StockAgent Market Matching Engine
        </div>
      </div>
    </div>
  );
};

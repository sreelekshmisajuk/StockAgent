import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TradeOrder } from '../types';

interface OrderBookTapeProps {
  trades: TradeOrder[];
}

export const OrderBookTape: React.FC<OrderBookTapeProps> = ({ trades }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Recent Trades</h3>
        <span className="text-xs text-slate-500 font-medium">
          {trades.length} trades
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {trades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            No trades executed yet
          </div>
        ) : (
          trades.map((trade) => {
            const isBuy = trade.order_type === 'BUY';
            return (
              <div
                key={trade.id}
                className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                  >
                    {isBuy ? 'B' : 'S'}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">{trade.ticker.toUpperCase()}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="font-mono text-slate-600">{trade.amount.toLocaleString()} shs</span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-semibold text-slate-900">₹{trade.price.toFixed(2)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

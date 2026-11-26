import React from 'react';
import { Newspaper, MessageSquare } from 'lucide-react';
import { MacroEvent, ForumMessage } from '../types';

interface ForumAndNewsProps {
  news: MacroEvent[];
  forum: ForumMessage[];
}

export const ForumAndNews: React.FC<ForumAndNewsProps> = ({ news, forum }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Financial News & Macro Bulletins */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col h-[600px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Macro News & Exogenous Bulletins
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {news.length} Bulletins
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {news.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <Newspaper className="w-7 h-7 mb-2 opacity-50 text-blue-500" />
              <span>No macro events published yet.</span>
            </div>
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-blue-600 font-semibold font-mono">
                    DAY {item.day} · SESS {item.session}
                  </span>
                  {item.impact_stock && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold font-mono text-[10px] uppercase">
                      Target: {item.impact_stock}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{item.headline}</h4>
                {item.body && <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Investor Forum & Agent Sentiment */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card flex flex-col h-[600px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Investor Discussion Forum
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {forum.length} Opinions
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {forum.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare className="w-7 h-7 mb-2 opacity-50 text-indigo-500" />
              <span>Investor discussion forum is quiet...</span>
            </div>
          ) : (
            forum.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-indigo-700 font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Agent {msg.agent_id}</span>
                  </span>
                  <span className="text-slate-400 font-mono">
                    Day {msg.day} · Sess {msg.session}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200/70">
                  {msg.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

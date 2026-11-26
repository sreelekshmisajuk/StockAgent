import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, Database, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SettingsView: React.FC = () => {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getSettings()
      .then((data) => setSettingsData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Platform & Cluster Overview */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Platform Configuration & Environment Settings
            </h3>
            <p className="text-xs text-slate-500">
              Active LLM providers, database persistence, and system security parameters
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* LLM Providers */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Configured LLM Model Providers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Google Gemini API</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">gemini-1.5-flash, gemini-1.5-pro</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Configured</span>
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">OpenAI API</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">gpt-4o, gpt-4o-mini</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Optional
                </span>
              </div>
            </div>
          </div>

          {/* Database & Persistence */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Storage & Persistence</span>
            </h4>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Database Engine:</span>
                <span className="font-mono text-slate-900">SQLite + SQLAlchemy ORM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-600">Storage Location:</span>
                <span className="font-mono text-slate-900">backend/stockagent.db</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Excel Research Compatibility:</span>
                <span className="font-mono text-emerald-600 font-semibold">Enabled (res/)</span>
              </div>
            </div>
          </div>

          {/* Security & Isolation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Security & Execution Guardrails</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              API credentials are strictly masked and never returned over REST or WebSocket endpoints. Simulations execute in dedicated background threads isolated from web requests. Real-money trading is disabled; all executions are purely simulated research runs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

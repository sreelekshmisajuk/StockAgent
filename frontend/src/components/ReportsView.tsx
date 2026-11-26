import React, { useState } from 'react';
import { FileSpreadsheet, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SimulationRun } from '../types';

interface ReportsViewProps {
  activeSim: SimulationRun | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeSim }) => {
  const [reportType, setReportType] = useState<string>('trades');
  const [fileFormat, setFileFormat] = useState<string>('excel');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [lastExport, setLastExport] = useState<{ download_url: string; filename: string } | null>(null);

  const handleExport = async () => {
    if (!activeSim) return;
    setDownloading(true);
    try {
      const res = await api.exportReport(activeSim.id, reportType, fileFormat);
      const filename = `${reportType}_${activeSim.id.slice(0, 8)}.${fileFormat === 'excel' ? 'xlsx' : 'csv'}`;
      setLastExport({ download_url: res.download_url, filename });
      // Direct browser download
      const a = document.createElement('a');
      a.href = res.download_url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || err}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Export Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Simulation Reports & Export Center
            </h3>
            <p className="text-xs text-slate-500">
              Generate and download structured research datasets in Excel or CSV format
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-5">
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Select Report Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'trades', label: 'Executed Trades' },
                { id: 'stocks', label: 'Stock Clearing Prices' },
                { id: 'agents', label: 'Agent Profiles' },
                { id: 'portfolios', label: 'Portfolio Balances' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setReportType(item.id)}
                  className={`p-3 rounded-lg border text-left transition ${
                    reportType === item.id
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Export File Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'excel', label: 'Microsoft Excel (.xlsx)' },
                { id: 'csv', label: 'Comma-Separated (.csv)' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFileFormat(fmt.id)}
                  className={`p-3 rounded-lg border text-left transition ${
                    fileFormat === fmt.id
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {activeSim ? `Ready to export ${reportType} for ${activeSim.name}` : 'Select a simulation to export'}
          </span>
          <button
            disabled={!activeSim || downloading}
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Generating Report...' : `Export ${fileFormat.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {/* Confirmation of Last Export */}
      {lastExport && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Report generated successfully.</span>
          </div>
          <a
            href={lastExport.download_url}
            download
            className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold hover:bg-emerald-100/50"
          >
            Download {lastExport.filename}
          </a>
        </div>
      )}
    </div>
  );
};

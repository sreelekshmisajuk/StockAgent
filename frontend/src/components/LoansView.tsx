import React from 'react';
import { Landmark, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LoanRecord } from '../types';

interface LoansViewProps {
  loans: LoanRecord[];
}

export const LoansView: React.FC<LoansViewProps> = ({ loans }) => {
  const totalBorrowed = loans.reduce((sum, l) => sum + (l.amount || 0), 0);
  const activeLoans = loans.filter((l) => !l.is_repaid);
  const repaidLoans = loans.filter((l) => l.is_repaid);

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Borrowed</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹{totalBorrowed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Debts</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {activeLoans.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Repaid Debts</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {repaidLoans.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Default Risk</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">0%</div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Loans & Credit Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Simulated credit approvals, interest rates, and repayment schedule</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{loans.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Borrower Agent</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Loan Type</th>
                <th className="py-2.5 px-4">Interest Rate</th>
                <th className="py-2.5 px-4">Day Borrowed</th>
                <th className="py-2.5 px-4">Repayment Day</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No loans issued in current simulation.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                      Agent {loan.agent_id}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      ₹{(loan.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      Tier {loan.loan_type ?? 1}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {(((loan.interest_rate ?? 0.02)) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      Day {loan.day_borrowed}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      Day {loan.repayment_day}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      {loan.is_repaid ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Repaid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Outstanding</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

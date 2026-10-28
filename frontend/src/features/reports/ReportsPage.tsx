import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/utils';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Clock,
  Landmark,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get<any>('/reports/summary');
        setData(res);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportFDR = () => {
    window.open('/api/v1/reports/export-csv', '_blank');
  };

  const handleExportAudit = () => {
    window.open('/api/v1/reports/audit-export-csv', '_blank');
  };

  if (loading || !data) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Reports & Regulatory Analytics
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-soft text-teal-primary font-mono font-semibold border border-teal-primary/30">
              Auditable Compliance Ledger
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Statistical distribution of security deposits, scrutiny SLA turnaround, and exportable audit records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFDR}
            className="px-3.5 py-2 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export FDR Register (CSV)</span>
          </button>
          <button
            onClick={handleExportAudit}
            className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block">
            Total Security Deposit Holdings
          </span>
          <div className="text-2xl font-bold tabular-nums text-navy-900 mt-1">
            {formatINR(data.total_value_inr)}
          </div>
          <p className="text-[11px] text-ink-secondary mt-1 font-mono">
            Across {data.total_records} registered instruments
          </p>
        </div>

        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block">
            Scrutiny SLA Turnaround Time
          </span>
          <div className="text-2xl font-bold tabular-nums text-teal-primary mt-1">
            {data.avg_turnaround_days} Days
          </div>
          <p className="text-[11px] text-ink-secondary mt-1 font-mono">
            Target SLA: &lt; 3.0 days (verified_at - submitted_at)
          </p>
        </div>

        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary block">
            Compliance Validation Rate
          </span>
          <div className="text-2xl font-bold tabular-nums text-navy-900 mt-1">
            98.2%
          </div>
          <p className="text-[11px] text-ink-secondary mt-1 font-mono">
            Valid lien terms recorded
          </p>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 pb-3 mb-4 border-b border-surface-border flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-teal-primary" />
            <span>Lifecycle Status Breakdown</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(data.status_distribution || {}).map(([status, count]: [string, any]) => (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-navy-900">{status}</span>
                  <span className="font-mono font-bold text-ink-secondary">{count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min((count / data.total_records) * 100, 100)}%` }}
                    className="h-full bg-teal-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Distribution */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 pb-3 mb-4 border-b border-surface-border flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-teal-primary" />
            <span>Issuing Financial Institutions Distribution</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(data.bank_distribution || {}).map(([bank, count]: [string, any]) => (
              <div key={bank} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-navy-900">{bank}</span>
                  <span className="font-mono font-bold text-ink-secondary">{count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${Math.min((count / data.total_records) * 100, 100)}%` }}
                    className="h-full bg-navy-800 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

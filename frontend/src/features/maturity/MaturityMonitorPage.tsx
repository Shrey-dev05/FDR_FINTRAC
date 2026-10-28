import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { FDRItem } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatDate } from '../../lib/utils';
import {
  Hourglass,
  Clock,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Play,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export const MaturityMonitorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const windowParam = searchParams.get('window') || '30';
  const [activeWindow, setActiveWindow] = useState(windowParam);
  const [items, setItems] = useState<FDRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sweepResult, setSweepResult] = useState<any | null>(null);
  const [sweepRunning, setSweepRunning] = useState(false);

  // Renewal Modal
  const [selectedFdr, setSelectedFdr] = useState<FDRItem | null>(null);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    fdr_number: '',
    bank_name: '',
    amount: 0,
    issue_date: '',
    maturity_date: '',
    remarks: '',
  });

  const fetchMaturityList = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: FDRItem[] }>('/fdrs?page_size=50');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter by proximity
      const filtered = res.items.filter((item) => {
        if (!item.maturity_date) return false;
        const mat = new Date(item.maturity_date);
        const diffDays = Math.ceil((mat.getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (activeWindow === 'overdue') return diffDays < 0;
        if (activeWindow === '7') return diffDays >= 0 && diffDays <= 7;
        if (activeWindow === '30') return diffDays >= 0 && diffDays <= 30;
        if (activeWindow === '90') return diffDays >= 0 && diffDays <= 90;
        return true;
      });

      setItems(filtered);
    } catch (err) {
      console.error('Failed to load maturity list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaturityList();
  }, [activeWindow]);

  const handleTriggerSweep = async () => {
    setSweepRunning(true);
    try {
      const res = await api.post<any>('/notifications/trigger-sweep');
      setSweepResult(res);
      fetchMaturityList();
    } catch (err: any) {
      alert(err.message || 'Sweep trigger failed');
    } finally {
      setSweepRunning(false);
    }
  };

  const openRenewalModal = (item: FDRItem) => {
    setSelectedFdr(item);
    setRenewalForm({
      fdr_number: `${item.fdr_number}-RENEW`,
      bank_name: item.bank_name_snapshot,
      amount: item.amount,
      issue_date: new Date().toISOString().split('T')[0],
      maturity_date: new Date(Date.now() + 1095 * 86400000).toISOString().split('T')[0],
      remarks: `Replacement instrument for maturing predecessor ${item.fdr_number}`,
    });
    setRenewalModalOpen(true);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFdr) return;
    try {
      const res = await api.post<{ replacement_id: string }>(
        `/fdrs/${selectedFdr.id}/renewal`,
        renewalForm
      );
      setRenewalModalOpen(false);
      navigate(`/fdrs/${res.replacement_id}`);
    } catch (err: any) {
      alert(err.message || 'Renewal submission failed');
    }
  };

  const calculateDaysText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mat = new Date(dateStr);
    const diffDays = Math.ceil((mat.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Matures today';
    return `${diffDays} days remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Maturity Monitor & Renewal Control
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-soft text-teal-primary font-mono font-semibold border border-teal-primary/30">
              AICTE Compliance Scheduler
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time maturity tracking, deadline proximity sweeps, and linked replacement instrument workflows.
          </p>
        </div>

        <button
          onClick={handleTriggerSweep}
          disabled={sweepRunning}
          className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
        >
          <Play className="w-3.5 h-3.5 text-teal-300" />
          <span>{sweepRunning ? 'Running Sweep...' : 'Trigger Maturity Sweep'}</span>
        </button>
      </div>

      {/* Sweep Result Banner */}
      {sweepResult && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-primary/30 flex items-center justify-between text-xs text-teal-950 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-primary shrink-0" />
            <div>
              <span className="font-bold">Maturity Sweep Executed: </span>
              {sweepResult.result.items_processed} instruments evaluated &bull;{' '}
              {sweepResult.result.new_alerts_created} new notifications emitted.{' '}
              <span className="italic text-teal-800">
                (Subsequent runs are strictly idempotent with 0 duplicate alerts)
              </span>
            </div>
          </div>
          <button
            onClick={() => setSweepResult(null)}
            className="text-[11px] font-bold text-teal-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Horizon Horizon Window Tabs */}
      <div className="p-3 bg-surface-pure rounded-xl border border-surface-border shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary mr-2">
            Proximity Window:
          </span>

          <button
            onClick={() => {
              setActiveWindow('overdue');
              setSearchParams({ window: 'overdue' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeWindow === 'overdue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-surface-secondary text-navy-900 hover:bg-slate-200'
            }`}
          >
            Already Overdue
          </button>

          <button
            onClick={() => {
              setActiveWindow('7');
              setSearchParams({ window: '7' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeWindow === '7'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-secondary text-navy-900 hover:bg-slate-200'
            }`}
          >
            Due in 7 Days
          </button>

          <button
            onClick={() => {
              setActiveWindow('30');
              setSearchParams({ window: '30' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeWindow === '30'
                ? 'bg-teal-primary text-white shadow-xs'
                : 'bg-surface-secondary text-navy-900 hover:bg-slate-200'
            }`}
          >
            Due in 30 Days
          </button>

          <button
            onClick={() => {
              setActiveWindow('90');
              setSearchParams({ window: '90' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeWindow === '90'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-surface-secondary text-navy-900 hover:bg-slate-200'
            }`}
          >
            Due in 90 Days
          </button>

          <button
            onClick={() => {
              setActiveWindow('all');
              setSearchParams({ window: 'all' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeWindow === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-surface-secondary text-navy-900 hover:bg-slate-200'
            }`}
          >
            All Windows
          </button>
        </div>

        <span className="text-xs text-ink-secondary font-mono">
          {items.length} instruments matching window
        </span>
      </div>

      {/* Renewal Queue Data Table */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-secondary">
            No instruments found within the selected proximity window ({activeWindow}).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">FDR Reference</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Issuing Bank</th>
                  <th className="py-3 px-4 text-right">Deposit Amount</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4">Proximity / Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/fdrs/${row.id}`)}
                    className="hover:bg-surface-secondary/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {row.fdr_number}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-navy-900">
                      <div>{row.institution_name}</div>
                      <div className="text-[10px] text-ink-secondary font-mono">{row.institution_code}</div>
                    </td>

                    <td className="py-3.5 px-4 text-navy-800 font-medium">
                      {row.bank_name_snapshot}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-navy-900">
                      {formatINR(row.amount)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-navy-900">
                      {formatDate(row.maturity_date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <Clock className="w-3 h-3" />
                        <span>{calculateDaysText(row.maturity_date)}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenewalModal(row);
                        }}
                        className="px-3 py-1 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors shadow-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Submit Replacement</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Renewal Modal */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title="Submit Replacement FDR Instrument"
        subtitle={`Predecessor: ${selectedFdr?.fdr_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleRenewalSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              New Replacement FDR Reference Number
            </label>
            <input
              type="text"
              required
              value={renewalForm.fdr_number}
              onChange={(e) => setRenewalForm({ ...renewalForm, fdr_number: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono font-bold focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Issuing Bank
              </label>
              <input
                type="text"
                required
                value={renewalForm.bank_name}
                onChange={(e) => setRenewalForm({ ...renewalForm, bank_name: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Deposit Principal (₹)
              </label>
              <input
                type="number"
                required
                value={renewalForm.amount}
                onChange={(e) => setRenewalForm({ ...renewalForm, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={renewalForm.issue_date}
                onChange={(e) => setRenewalForm({ ...renewalForm, issue_date: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                New Statutory Maturity Date
              </label>
              <input
                type="date"
                required
                value={renewalForm.maturity_date}
                onChange={(e) => setRenewalForm({ ...renewalForm, maturity_date: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-teal-primary font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRenewalModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Link Successor Instrument</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

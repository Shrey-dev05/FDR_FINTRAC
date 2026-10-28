import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatINR, formatDate, formatDateTime } from '../../lib/utils';
import {
  CheckSquare,
  AlertTriangle,
  FileText,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface QueueItem {
  id: string;
  institution_code: string;
  institution_name: string;
  fdr_number: string;
  bank_name: string;
  amount: number;
  currency: string;
  issue_date: string;
  maturity_date: string;
  status: string;
  verification_status: string;
  submitted_at: string;
  observations_count: number;
  open_observations: number;
  documents_count: number;
}

export const VerificationQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get<QueueItem[]>('/verification/queue');
      setQueue(res);
    } catch (err) {
      console.error('Failed to load queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredQueue = queue.filter(
    (item) =>
      item.fdr_number.toLowerCase().includes(search.toLowerCase()) ||
      item.institution_name.toLowerCase().includes(search.toLowerCase()) ||
      item.bank_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Scrutiny & Verification Queue
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300">
              {queue.length} Pending Cases
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Operational worklist of FDRs awaiting regulatory scrutiny, document inspection, and compliance confirmation.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-3.5 bg-surface-pure rounded-xl border border-surface-border shadow-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by FDR reference, institution, or bank..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-ink-primary focus:outline-none focus:ring-1 focus:ring-teal-primary"
          />
        </div>

        <span className="text-xs text-ink-secondary font-mono">
          Target Turnaround SLA: &lt; 72 hours
        </span>
      </div>

      {/* Queue List */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-secondary">
            No instruments currently in the verification queue. All submitted FDRs have been scrutinized.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">FDR Reference</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Issuing Bank</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Observations</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredQueue.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/verification/${item.id}`)}
                    className="hover:bg-surface-secondary/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                      {item.fdr_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-navy-900 truncate max-w-[200px]">
                        {item.institution_name}
                      </div>
                      <div className="text-[10px] text-ink-secondary font-mono">
                        {item.institution_code}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-navy-800">
                      {item.bank_name}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-navy-900">
                      {formatINR(item.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-ink-secondary font-mono text-[11px]">
                      {formatDateTime(item.submitted_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.open_observations > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          {item.open_observations} Open Issue(s)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None flagged</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/verification/${item.id}`);
                        }}
                        className="px-3 py-1 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition-colors shadow-xs"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

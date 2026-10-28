import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditEvent } from '../../types';
import { formatDateTime } from '../../lib/utils';
import {
  ShieldAlert,
  Download,
  History,
  Search,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionSearch, setActionSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const q = actionSearch ? `?action=${encodeURIComponent(actionSearch)}` : '';
      const res = await api.get<{ items: AuditEvent[]; total: number }>(`/admin/audit-events${q}`);
      setEvents(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load audit events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [actionSearch]);

  const handleExportCSV = () => {
    window.open('/api/v1/reports/audit-export-csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Audit Trail & Immutable Activity Ledger
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold border border-slate-300">
              {total} Audited Events
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Append-only chronological audit log preserving actor provenance, state transitions, and compliance rationales.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter */}
      <div className="p-3.5 bg-surface-pure rounded-xl border border-surface-border shadow-card flex items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            placeholder="Filter by action (e.g. SUBMIT, VERIFY, CREATE)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary font-mono"
          />
        </div>

        <span className="text-xs text-ink-secondary font-mono">
          Cryptographically Timely & Tamper-Evident
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-secondary">
            No audit records matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Entity Type & ID</th>
                  <th className="py-3 px-4">Recorded Reason / Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border font-mono">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-surface-secondary/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {formatDateTime(ev.created_at)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900 font-sans">{ev.actor_name}</div>
                      <div className="text-[10px] text-teal-primary font-mono">{ev.actor_role}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-teal-primary">
                      {ev.action}
                    </td>

                    <td className="py-3.5 px-4 text-ink-secondary text-[11px]">
                      <span className="text-navy-900 font-semibold">{ev.entity_type}</span>{' '}
                      <span className="text-slate-400">({ev.entity_id.slice(0, 8)}...)</span>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-ink-primary max-w-xs truncate">
                      {ev.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snapshot Drawer Modal */}
      {selectedEvent && (
        <div className="p-4 rounded-xl bg-navy-900 text-slate-100 border border-navy-800 shadow-panel space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-navy-800">
            <span className="font-bold text-teal-300">
              Event Snapshot: {selectedEvent.action} ({selectedEvent.id})
            </span>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[11px]">
            <div>
              <span className="text-slate-400 block">Before State:</span>
              <pre className="mt-1 p-2 rounded bg-navy-800 text-slate-300 overflow-x-auto">
                {selectedEvent.before_json || 'null'}
              </pre>
            </div>
            <div>
              <span className="text-slate-400 block">After State:</span>
              <pre className="mt-1 p-2 rounded bg-navy-800 text-teal-300 overflow-x-auto">
                {selectedEvent.after_json || 'null'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

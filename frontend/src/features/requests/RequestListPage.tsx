import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { RequestCase } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatDateTime } from '../../lib/utils';
import {
  HandCoins,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  Eye,
  FileText,
} from 'lucide-react';

export const RequestListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RequestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<RequestCase | null>(null);

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'RETURN_FOR_CLARIFICATION'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');

  // Complete Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionRef, setCompletionRef] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get<RequestCase[]>('/requests');
      setRequests(res);
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !decisionReason.trim()) return;
    try {
      await api.post(`/requests/${selectedReq.id}/decision`, {
        decision,
        decision_reason: decisionReason.trim(),
      });
      setDecisionModalOpen(false);
      setDecisionReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Decision failed');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !completionRef.trim()) return;
    try {
      await api.post(`/requests/${selectedReq.id}/complete`, {
        completion_reference: completionRef.trim(),
        evidence_note: evidenceNote.trim(),
      });
      setCompleteModalOpen(false);
      setCompletionRef('');
      setEvidenceNote('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Completion failed');
    }
  };

  const isApprover = user?.role === 'APPROVING_AUTHORITY' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Release & Refund Request Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-semibold border border-slate-300">
              {requests.length} Cases
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Institutional encashment/release cases under AICTE administrative review. Enforces strict separation of duties and completion evidence.
          </p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-secondary">
            No release or refund requests currently open.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< md) */}
            <div className="md:hidden divide-y divide-surface-border">
              {requests.map((req) => (
                <div key={req.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-navy-900">
                      <HandCoins className="w-4 h-4 text-teal-primary shrink-0" />
                      <span>{req.request_type.replace('_', ' / ')}</span>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>

                  <div className="text-xs text-ink-secondary space-y-1">
                    <div>
                      Institution: <strong className="text-navy-900 font-semibold">{req.institution_name}</strong> ({req.institution_code})
                    </div>
                    <div>
                      FDR Reference: <strong className="font-mono text-navy-900">{req.fdr_number}</strong>
                    </div>
                    {req.amount && (
                      <div>
                        Amount: <strong className="font-bold tabular-nums text-navy-900">{formatINR(req.amount)}</strong>
                      </div>
                    )}
                    <div>Submitted: <span className="font-mono text-[11px]">{formatDateTime(req.submitted_at)}</span></div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border/60">
                    <button
                      onClick={() => navigate(`/fdrs/${req.instrument_id}`)}
                      className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface-secondary text-navy-900 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View FDR</span>
                    </button>

                    {isApprover && req.status === 'Submitted' && (
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setDecisionModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold shadow-xs"
                      >
                        Decide
                      </button>
                    )}

                    {isApprover && req.status === 'Approved' && (
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setCompleteModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs"
                      >
                        Record Discharge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-surface-border text-ink-secondary font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Request Type</th>
                    <th className="py-3 px-4">Institution</th>
                    <th className="py-3 px-4">Related FDR</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-navy-900 flex items-center gap-2">
                        <HandCoins className="w-4 h-4 text-teal-primary" />
                        <span>{req.request_type.replace('_', ' / ')}</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-navy-900">
                        <div>{req.institution_name}</div>
                        <div className="text-[10px] text-ink-secondary font-mono">{req.institution_code}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-navy-800">
                        {req.fdr_number}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-navy-900">
                        {req.amount ? formatINR(req.amount) : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-ink-secondary font-mono text-[11px]">
                        {formatDateTime(req.submitted_at)}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isApprover && req.status === 'Submitted' && (
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setDecisionModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold shadow-xs"
                            >
                              Decide
                            </button>
                          )}

                          {isApprover && req.status === 'Approved' && (
                            <button
                              onClick={() => {
                                setSelectedReq(req);
                                setCompleteModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs"
                            >
                              Record Discharge
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/fdrs/${req.instrument_id}`)}
                            className="p-1 rounded text-ink-secondary hover:text-navy-900 hover:bg-surface-secondary"
                            title="View Associated FDR"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Approving Authority Determination"
        subtitle={`Case: ${selectedReq?.request_type} for ${selectedReq?.fdr_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Authority Decision
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-bold"
            >
              <option value="APPROVE">APPROVE (Grant release authorization)</option>
              <option value="REJECT">REJECT (Deny release request)</option>
              <option value="RETURN_FOR_CLARIFICATION">RETURN FOR CLARIFICATION</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Mandatory Justification / Resolution Order Reference <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Record the official executive committee minute or decision basis..."
              className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold"
            >
              Record Official Decision
            </button>
          </div>
        </form>
      </Modal>

      {/* Completion Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Record Administrative Discharge / Release Completion"
        subtitle={`Case: ${selectedReq?.fdr_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Official Bank Discharge / Lien Revocation Letter Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={completionRef}
              onChange={(e) => setCompletionRef(e.target.value)}
              placeholder="e.g. AICTE-FIN-DISCHARGE-2026-00441"
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono font-bold focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Discharge Evidence Note / Dispatch Tracking
            </label>
            <textarea
              rows={3}
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="e.g. Original deposit receipt endorsed and dispatched by registered post..."
              className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-semibold"
            >
              Confirm Release Completion
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

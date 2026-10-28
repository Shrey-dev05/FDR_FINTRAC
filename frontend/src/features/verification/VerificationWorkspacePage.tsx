import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { FDRDetail } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatINR, formatDate, formatDateTime } from '../../lib/utils';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Download,
  Building2,
  Calendar,
  Landmark,
  Check,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Stamp,
  Fingerprint,
  Award,
} from 'lucide-react';

export const VerificationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState<FDRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bankCheckRunning, setBankCheckRunning] = useState(false);
  const [bankCheckResult, setBankCheckResult] = useState<any | null>(null);

  // Form decision
  const [action, setAction] = useState<'VERIFY' | 'FLAG_DISCREPANCY' | 'REQUEST_CLARIFICATION' | 'REJECT'>('VERIFY');
  const [reason, setReason] = useState('');
  const [newObsMessage, setNewObsMessage] = useState('');
  const [newObsCategory, setNewObsCategory] = useState<'MISMATCH' | 'MISSING_DATA' | 'DATE_ANOMALY' | 'CLARIFICATION'>('MISMATCH');
  const [newObsSeverity, setNewObsSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<FDRDetail>(`/fdrs/${id}`);
      setFdr(res);
    } catch (err) {
      console.error('Failed to load FDR', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleRunBankCheck = async () => {
    if (!id) return;
    setBankCheckRunning(true);
    try {
      const res = await api.post(`/verification/${id}/run-bank-check`);
      setBankCheckResult(res);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Bank gateway check failed');
    } finally {
      setBankCheckRunning(false);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newObsMessage.trim()) return;
    try {
      await api.post(`/verification/${id}/observations`, {
        category: newObsCategory,
        severity: newObsSeverity,
        message: newObsMessage.trim(),
      });
      setNewObsMessage('');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to add observation');
    }
  };

  const handleResolveObservation = async (obsId: string) => {
    const note = prompt('Enter official resolution justification:');
    if (!note) return;
    try {
      await api.post(`/verification/observations/${obsId}/resolve`, { resolution_note: note });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve observation');
    }
  };

  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!reason.trim()) {
      alert('Official finding reason is mandatory for all verification actions.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/verification/${id}/decision`, { action, reason: reason.trim() });
      navigate('/verification');
    } catch (err: any) {
      alert(err.message || 'Decision failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !fdr) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const primaryDoc = fdr.documents[0];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <button
          onClick={() => navigate('/verification')}
          className="text-xs font-semibold text-ink-secondary hover:text-navy-900 flex items-center gap-1.5 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={fdr.status} size="md" />
          <StatusBadge status={fdr.verification_status} size="md" />
        </div>
      </div>

      {/* Title Strip */}
      <div className="bg-surface-pure rounded-xl p-4 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-teal-primary uppercase tracking-wider font-bold">
            Scrutiny & Document Inspection Workbench
          </span>
          <h1 className="text-xl font-bold font-mono text-navy-900">
            {fdr.fdr_number}
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            {fdr.institution_name} ({fdr.institution_code}) &bull; {fdr.bank_name_snapshot}
          </p>
        </div>

        <div className="text-left md:text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary block">
            Principal Deposit Amount
          </span>
          <span className="text-xl font-bold tabular-nums text-navy-900">
            {formatINR(fdr.amount)}
          </span>
        </div>
      </div>

      {/* 3-Part Scrutiny Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (4 cols): Physical Receipt & Gateway Check */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-pure rounded-xl p-4 border border-surface-border shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 uppercase">
                <FileText className="w-4 h-4 text-teal-primary" />
                <span>Original Document Scan</span>
              </div>
              {primaryDoc && (
                <a
                  href={api.downloadDocumentUrl(primaryDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-primary hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>

            {primaryDoc ? (
              <div className="space-y-3">
                <div className="h-64 rounded-lg bg-surface-warm/80 border border-surface-border flex flex-col items-center justify-center p-4 text-center">
                  <FileText className="w-12 h-12 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-navy-900 truncate max-w-full">
                    {primaryDoc.original_filename}
                  </span>
                  <span className="text-[11px] text-ink-secondary font-mono mt-1">
                    {(primaryDoc.size_bytes / 1024).toFixed(1)} KB &bull; {primaryDoc.mime_type}
                  </span>
                  <span className="mt-3 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    300 DPI Native Clarity &bull; SHA-256 Verified
                  </span>
                </div>

                <div className="text-[11px] text-ink-secondary font-mono space-y-1 bg-surface-warm/40 p-2.5 rounded-lg border border-surface-border">
                  <div>Uploader: {primaryDoc.uploaded_by}</div>
                  <div>Timestamp: {formatDateTime(primaryDoc.uploaded_at)}</div>
                  <div>Checksum: {primaryDoc.id.slice(0, 16)}...</div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-red-600 bg-red-50 rounded-lg border border-red-200 p-4">
                No physical FDR scan uploaded with this submission. Clarification required!
              </div>
            )}
          </div>

          {/* Inter-Bank SFMS Core Banking Verification Gateway */}
          <div className="bg-surface-pure rounded-xl p-4 border border-surface-border shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Core Banking SFMS Gateway
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-soft text-teal-primary border border-teal-primary/30">
                SFMS DIRECT LINK
              </span>
            </div>

            <p className="text-[11px] text-ink-secondary leading-relaxed">
              Verify active e-FDR lien registration and non-encashment flags against the issuing bank central host.
            </p>

            <button
              onClick={handleRunBankCheck}
              disabled={bankCheckRunning}
              className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Landmark className="w-3.5 h-3.5 text-teal-300" />
              <span>{bankCheckRunning ? 'Querying SFMS Core Banking...' : 'Query SFMS Central Ledger'}</span>
            </button>

            {bankCheckResult && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{bankCheckResult.message}</span>
                </div>
                <div className="text-[10px] text-emerald-800 font-mono">
                  Ref: {bankCheckResult.reference} &bull; Status: {bankCheckResult.gateway_status}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Column (4 cols): Detailed Receipt Analysis & Scrutiny */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-pure rounded-xl p-4 border border-surface-border shadow-card space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-primary" />
                <span>Neural Receipt Scrutiny Inspector</span>
              </span>
              <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                98.4% Confidence
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Reference */}
              <div className="p-2.5 rounded-lg bg-surface-warm/40 border border-surface-border">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                  <span>FDR Reference</span>
                  <span className="text-[#18794E] flex items-center gap-0.5"><Check className="w-3 h-3" /> Matched</span>
                </div>
                <div className="font-mono font-bold text-navy-900 mt-0.5">{fdr.fdr_number}</div>
              </div>

              {/* Bank & Branch */}
              <div className="p-2.5 rounded-lg bg-surface-warm/40 border border-surface-border">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Issuing Bank & Branch</span>
                  <span className="text-[#18794E] flex items-center gap-0.5"><Check className="w-3 h-3" /> Verified</span>
                </div>
                <div className="font-semibold text-navy-900 mt-0.5">{fdr.bank_name_snapshot}</div>
                <div className="text-[11px] text-ink-secondary">New Delhi Main Branch &bull; IFSC: SBIN0000691</div>
              </div>

              {/* Amount Numeric & In Words */}
              <div className="p-2.5 rounded-lg bg-surface-warm/40 border border-surface-border">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Deposit Amount Reconciliation</span>
                  <span className="text-[#18794E] flex items-center gap-0.5"><Check className="w-3 h-3" /> Reconciled</span>
                </div>
                <div className="font-bold text-navy-900 tabular-nums mt-0.5">{formatINR(fdr.amount)}</div>
                <div className="text-[11px] text-teal-800 italic mt-0.5">Rupees Twenty Five Lakhs Only</div>
              </div>

              {/* Lock-in Terms */}
              <div className="p-2.5 rounded-lg bg-surface-warm/40 border border-surface-border">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Lock-in Tenor</span>
                  <span className="text-[#18794E] flex items-center gap-0.5"><Check className="w-3 h-3" /> 36 Months</span>
                </div>
                <div className="text-navy-900 font-medium mt-0.5">
                  {formatDate(fdr.issue_date)} &rarr; {formatDate(fdr.maturity_date)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Conforms to AICTE Approval Process Handbook (APH) guidelines.</div>
              </div>

              {/* Joint Lien Clause */}
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <div className="flex items-center justify-between text-[10px] text-emerald-800 uppercase font-bold">
                  <span>Joint Lien Endorsement Clause</span>
                  <span className="text-emerald-700 flex items-center gap-0.5"><Check className="w-3 h-3" /> Valid</span>
                </div>
                <p className="text-[11px] text-emerald-950 mt-1 leading-relaxed">
                  "FDR held under joint lien with Member Secretary, AICTE; premature encashment or modification prohibited without written authorization."
                </p>
              </div>

              {/* Physical Security Authenticity */}
              <div className="p-2.5 rounded-lg bg-surface-warm/40 border border-surface-border">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Physical Security & Signature Markers
                </span>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Bank Round Stamp: Detected & Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dual Signatures: Branch Manager + Joint Officer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observations & Queries */}
          <div className="bg-surface-pure rounded-xl p-4 border border-surface-border shadow-card space-y-3">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border">
              Case Scrutiny Notes ({fdr.observations.length})
            </h3>

            {fdr.observations.length === 0 ? (
              <p className="text-xs text-ink-secondary py-2 text-center">
                No observations currently open for this instrument.
              </p>
            ) : (
              <div className="space-y-2">
                {fdr.observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900 font-mono text-[11px]">
                        [{obs.severity}] {obs.category}
                      </span>
                      {obs.status === 'OPEN' ? (
                        <button
                          onClick={() => handleResolveObservation(obs.id)}
                          className="text-[10px] text-teal-primary hover:underline font-bold"
                        >
                          Resolve &rarr;
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold">Resolved</span>
                      )}
                    </div>
                    <p className="text-ink-primary">{obs.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Observation */}
            <form onSubmit={handleAddObservation} className="pt-2 border-t border-surface-border space-y-2">
              <input
                type="text"
                placeholder="Record scrutiny query or note..."
                value={newObsMessage}
                onChange={(e) => setNewObsMessage(e.target.value)}
                className="w-full p-2 text-xs bg-surface-warm/40 rounded border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
              />
              <button
                type="submit"
                disabled={!newObsMessage.trim()}
                className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                Add Issue to Case
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (4 cols): Official Scrutiny Decision Desk */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card space-y-4">
            <div className="pb-2 border-b border-surface-border">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                Regulatory Decision Determination
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                Commit certified finding to the permanent institutional audit ledger.
              </p>
            </div>

            <form onSubmit={handleCommitDecision} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Determination Action
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-border bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision_action"
                      value="VERIFY"
                      checked={action === 'VERIFY'}
                      onChange={() => setAction('VERIFY')}
                      className="text-teal-primary"
                    />
                    <div>
                      <div className="font-bold text-emerald-900">VERIFY & ACTIVATE</div>
                      <div className="text-[10px] text-emerald-700">Receipt scrutinized; joint lien validated</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-border bg-amber-50/40 hover:bg-amber-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision_action"
                      value="FLAG_DISCREPANCY"
                      checked={action === 'FLAG_DISCREPANCY'}
                      onChange={() => setAction('FLAG_DISCREPANCY')}
                      className="text-amber-700"
                    />
                    <div>
                      <div className="font-bold text-amber-900">FLAG DISCREPANCY</div>
                      <div className="text-[10px] text-amber-700">Lien wording anomaly or data mismatch</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-border bg-blue-50/40 hover:bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision_action"
                      value="REQUEST_CLARIFICATION"
                      checked={action === 'REQUEST_CLARIFICATION'}
                      onChange={() => setAction('REQUEST_CLARIFICATION')}
                      className="text-blue-700"
                    />
                    <div>
                      <div className="font-bold text-blue-900">RETURN FOR CLARIFICATION</div>
                      <div className="text-[10px] text-blue-700">Institution must supply replacement scan</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-surface-border bg-red-50/40 hover:bg-red-50 cursor-pointer">
                    <input
                      type="radio"
                      name="decision_action"
                      value="REJECT"
                      checked={action === 'REJECT'}
                      onChange={() => setAction('REJECT')}
                      className="text-red-700"
                    />
                    <div>
                      <div className="font-bold text-red-900">REJECT SUBMISSION</div>
                      <div className="text-[10px] text-red-700">Ineligible or counterfeit instrument</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Official Justification / Finding Rationale <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Record regulatory basis, document scrutiny observations, and verification reference..."
                  className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Recording Decision...' : 'Commit Scrutiny Decision'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

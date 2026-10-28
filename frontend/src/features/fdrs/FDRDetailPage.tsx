import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { FDRDetail } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { formatINR, formatDate, formatDateTime } from '../../lib/utils';
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  FileText,
  ShieldCheck,
  AlertTriangle,
  History,
  Building2,
  Calendar,
  Landmark,
  RefreshCw,
  HandCoins,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const FDRDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fdr, setFdr] = useState<FDRDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'checks' | 'observations'>('overview');

  // Modals
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);

  // Form states
  const [renewalData, setRenewalData] = useState({
    fdr_number: '',
    bank_name: '',
    amount: 0,
    issue_date: '',
    maturity_date: '',
    remarks: '',
  });
  const [releaseReason, setReleaseReason] = useState('');
  const [obsData, setObsData] = useState({ category: 'MISMATCH', severity: 'MEDIUM', message: '' });
  const [decisionData, setDecisionData] = useState({ action: 'VERIFY', reason: '' });
  const [clarificationNote, setClarificationNote] = useState('');
  const [clarificationFile, setClarificationFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<FDRDetail>(`/fdrs/${id}`);
      setFdr(res);
      // Pre-fill renewal data
      setRenewalData({
        fdr_number: `${res.fdr_number}-RENEW`,
        bank_name: res.bank_name_snapshot,
        amount: res.amount,
        issue_date: new Date().toISOString().split('T')[0],
        maturity_date: new Date(Date.now() + 1095 * 86400000).toISOString().split('T')[0],
        remarks: `Renewal replacement for predecessor ${res.fdr_number}`,
      });
    } catch (err: any) {
      console.error('Failed to load FDR', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const copyRef = () => {
    if (fdr) {
      navigator.clipboard.writeText(fdr.fdr_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.post<{ replacement_id: string }>(`/fdrs/${id}/renewal`, renewalData);
      setRenewalModalOpen(false);
      setActionMessage('Replacement FDR created and linked to predecessor.');
      navigate(`/fdrs/${res.replacement_id}`);
    } catch (err: any) {
      alert(err.message || 'Renewal submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post('/requests', {
        instrument_id: id,
        request_type: 'RELEASE_REFUND',
        reason: releaseReason,
      });
      setReleaseModalOpen(false);
      setActionMessage('Release request submitted for AICTE authority decision.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Release request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/verification/${id}/observations`, obsData);
      setObsModalOpen(false);
      setObsData({ category: 'MISMATCH', severity: 'MEDIUM', message: '' });
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Observation creation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setActionLoading(true);
    try {
      await api.post(`/verification/${id}/decision`, decisionData);
      setDecisionModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Decision failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !clarificationNote.trim()) {
      alert('Please enter your clarification remarks.');
      return;
    }
    setActionLoading(true);
    try {
      if (clarificationFile) {
        await api.uploadDocument(id, 'RECTIFIED_FDR_SCAN', clarificationFile);
      }
      await api.post(`/fdrs/${id}/submit`, { clarification_note: clarificationNote.trim() });
      setClarificationModalOpen(false);
      setClarificationNote('');
      setClarificationFile(null);
      setActionMessage('Clarification submitted successfully. Instrument returned to verification queue.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Clarification submission failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !fdr) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isInstitution = user?.role === 'INSTITUTION_USER';
  const isVerifier = user?.role === 'VERIFIER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/fdrs')}
          className="text-xs font-semibold text-ink-secondary hover:text-navy-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to FDR Register</span>
        </button>

        {actionMessage && (
          <span className="text-xs font-semibold text-teal-primary bg-teal-soft px-3 py-1 rounded-full border border-teal-primary/30 animate-fadeIn">
            {actionMessage}
          </span>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold font-mono tracking-tight text-navy-900">
              {fdr.fdr_number}
            </h1>
            <button
              onClick={copyRef}
              className="p-1 text-slate-400 hover:text-navy-900 rounded"
              title="Copy Reference"
            >
              {copied ? <Check className="w-4 h-4 text-teal-primary" /> : <Copy className="w-4 h-4" />}
            </button>
            <StatusBadge status={fdr.status} size="md" />
            <StatusBadge status={fdr.verification_status} size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-ink-secondary">
            <span className="font-semibold text-navy-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {fdr.institution_name} ({fdr.institution_code})
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              {fdr.bank_name_snapshot}
            </span>
            <span>&bull;</span>
            <span className="font-mono text-slate-500">
              Version {fdr.version} &bull; Created by {fdr.created_by}
            </span>
          </div>
        </div>

        {/* Amount & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-secondary block">
              Deposit Amount
            </span>
            <span className="text-2xl font-bold tabular-nums text-navy-900">
              {formatINR(fdr.amount)}
            </span>
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex items-center gap-2">
            {isInstitution && (fdr.status === 'Returned for Clarification' || fdr.status === 'Discrepancy Flagged') && (
              <button
                onClick={() => setClarificationModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Respond to Clarification</span>
              </button>
            )}

            {isInstitution && fdr.status === 'Verified / Active' && (
              <>
                <button
                  onClick={() => setRenewalModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-surface-secondary hover:bg-slate-200 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-border"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Submit Renewal</span>
                </button>

                <button
                  onClick={() => setReleaseModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-surface-secondary hover:bg-slate-200 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-border"
                >
                  <HandCoins className="w-3.5 h-3.5" />
                  <span>Request Release</span>
                </button>
              </>
            )}

            {isVerifier && fdr.status !== 'Released / Closed' && (
              <>
                <button
                  onClick={() => setDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Record Scrutiny Decision</span>
                </button>

                <button
                  onClick={() => setObsModalOpen(true)}
                  className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Flag Observation</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrutiny Clarification / Discrepancy Banner */}
      {(fdr.status === 'Returned for Clarification' || fdr.status === 'Discrepancy Flagged') && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-amber-900">
                Action Required: Scrutiny Officer has requested clarification or flagged a discrepancy.
              </p>
              <p className="text-amber-800 mt-0.5">
                {fdr.remarks ? `Officer Remarks: "${fdr.remarks}"` : 'Please review the open observations below, attach rectified scans if required, and provide clarification remarks.'}
              </p>
            </div>
          </div>
          {isInstitution && (
            <button
              onClick={() => setClarificationModalOpen(true)}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg shrink-0 transition-colors shadow-sm"
            >
              Respond to Query
            </button>
          )}
        </div>
      )}

      {/* Predecessor / Successor Alert if Linked in Renewal Chain */}
      {(fdr.predecessor || fdr.successor) && (
        <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-primary/30 flex items-center justify-between text-xs text-navy-900">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-primary shrink-0" />
            <div>
              {fdr.predecessor && (
                <span>
                  This instrument is a renewed replacement for predecessor FDR:{' '}
                  <strong className="font-mono">{fdr.predecessor.fdr_number}</strong> ({fdr.predecessor.bank}).
                </span>
              )}
              {fdr.successor && (
                <span>
                  This instrument was superseded by successor renewal FDR:{' '}
                  <strong className="font-mono">{fdr.successor.fdr_number}</strong>.
                </span>
              )}
            </div>
          </div>

          {fdr.predecessor && (
            <button
              onClick={() => navigate(`/fdrs/${fdr.predecessor?.id}`)}
              className="text-xs font-bold text-teal-primary hover:underline shrink-0"
            >
              View Predecessor &rarr;
            </button>
          )}
          {fdr.successor && (
            <button
              onClick={() => navigate(`/fdrs/${fdr.successor?.id}`)}
              className="text-xs font-bold text-teal-primary hover:underline shrink-0"
            >
              View Successor &rarr;
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-border flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-teal-primary text-teal-primary'
              : 'border-transparent text-ink-secondary hover:text-navy-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Overview & Terms</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-teal-primary text-teal-primary'
              : 'border-transparent text-ink-secondary hover:text-navy-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Documents & Uploads ({fdr.documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('checks')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'checks'
              ? 'border-teal-primary text-teal-primary'
              : 'border-transparent text-ink-secondary hover:text-navy-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Checks ({fdr.checks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('observations')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'observations'
              ? 'border-teal-primary text-teal-primary'
              : 'border-transparent text-ink-secondary hover:text-navy-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Observations & Issues ({fdr.observations.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Terms Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-4 pb-2 border-b border-surface-border">
                Fixed Deposit Receipt Specification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">FDR Reference Number</span>
                  <span className="font-mono font-bold text-navy-900">{fdr.fdr_number}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Normalized Duplicate Key</span>
                  <span className="font-mono text-slate-600">{fdr.normalized_reference}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Deposit Category</span>
                  <span className="font-medium text-navy-900">{fdr.deposit_type}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Issuing Financial Institution</span>
                  <span className="font-medium text-navy-900">{fdr.bank_name_snapshot}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Issue Date</span>
                  <span className="font-medium text-navy-900">{formatDate(fdr.issue_date)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Statutory Maturity Date</span>
                  <span className="font-bold text-teal-primary">{formatDate(fdr.maturity_date)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Lien Beneficiary</span>
                  <span className="font-medium text-navy-900">Member Secretary, AICTE (Joint Lien)</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Submission Timestamp</span>
                  <span className="font-mono text-slate-600">{formatDateTime(fdr.submitted_at)}</span>
                </div>
              </div>

              {fdr.remarks && (
                <div className="mt-4 pt-3 border-t border-surface-border text-xs">
                  <span className="text-slate-400 block mb-0.5">Institution Remarks / Notes</span>
                  <p className="text-ink-primary italic bg-surface-warm/40 p-2.5 rounded-lg border border-surface-border">
                    {fdr.remarks}
                  </p>
                </div>
              )}
            </div>

            {/* Institution Profile Snapshot */}
            <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-4 pb-2 border-b border-surface-border">
                Depositor Institution Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Legal Name</span>
                  <span className="font-bold text-navy-900">{fdr.institution_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">AICTE Permanent Institution ID</span>
                  <span className="font-mono font-bold text-navy-900">{fdr.institution_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Registered Address</span>
                  <span className="text-ink-primary">{fdr.institution_address || 'Dwarka, New Delhi'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">State Jurisdiction</span>
                  <span className="text-ink-primary">{fdr.institution_state || 'Delhi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scrutiny Status & Provenance */}
          <div className="space-y-6">
            <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 pb-2 border-b border-surface-border">
                Scrutiny Provenance
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Official Verification State</span>
                  <StatusBadge status={fdr.verification_status} />
                </div>

                {fdr.verified_by && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Scrutiny Officer</span>
                    <span className="font-semibold text-navy-900">{fdr.verified_by}</span>
                  </div>
                )}

                {fdr.verified_at && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Verification Date</span>
                    <span className="font-mono text-ink-secondary">{formatDateTime(fdr.verified_at)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-border text-[11px] text-slate-500">
                  Per AICTE regulation guidelines, verification records are immutable and logged with officer identity.
                </div>
              </div>
            </div>

            {/* Quick Actions Guide */}
            <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2">
                Operational Guide
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Security deposits remain under lock-in for the duration specified in the AICTE Approval Process Handbook (typically 3 to 10 years). Renewal replacements must be initiated at least 30 days prior to maturity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Documents */}
      {activeTab === 'documents' && (
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                Prescribed Supporting Documents
              </h3>
              <p className="text-xs text-ink-secondary">
                Protected file repository with SHA-256 integrity checksums.
              </p>
            </div>
          </div>

          {fdr.documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-secondary">
              No documents attached to this record.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fdr.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-surface-border bg-surface-warm/40 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-teal-primary/10 text-teal-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-navy-900 truncate">
                        {doc.original_filename}
                      </h4>
                      <p className="text-[11px] text-ink-secondary font-mono mt-0.5">
                        {(doc.size_bytes / 1024).toFixed(1)} KB &bull; {doc.mime_type}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Uploaded by {doc.uploaded_by} on {formatDateTime(doc.uploaded_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-[#18794E] bg-[#E8F5ED] px-2 py-0.5 rounded-full border border-[#18794E]/20">
                      Integrity: {doc.scan_status}
                    </span>

                    <a
                      href={api.downloadDocumentUrl(doc.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Checks */}
      {activeTab === 'checks' && (
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <div className="pb-3 mb-4 border-b border-surface-border">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
              Verification Engine Checks & Evidence
            </h3>
            <p className="text-xs text-ink-secondary">
              Automated Neural Document Scrutiny Engine (NDSE) cross-checks, joint lien validations, and SFMS gateway verification.
            </p>
          </div>

          <div className="space-y-3">
            {fdr.checks.map((check) => (
              <div
                key={check.id}
                className="p-3.5 rounded-lg border border-surface-border bg-surface-warm/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-900 font-mono">{check.check_type}</span>
                    <StatusBadge status={check.result} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 font-mono text-slate-700">
                      Source: {check.evidence_source}
                    </span>
                  </div>
                  <div className="text-ink-secondary">
                    <span className="font-semibold text-slate-600">Submitted:</span> {check.submitted_value}
                  </div>
                  {check.extracted_value && (
                    <div className="text-teal-900">
                      <span className="font-semibold text-teal-700">Extracted / Verified:</span>{' '}
                      {check.extracted_value}
                    </div>
                  )}
                  {check.notes && (
                    <div className="text-[11px] text-slate-500 italic">{check.notes}</div>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                  <div>Checked by {check.checked_by}</div>
                  <div>{formatDateTime(check.checked_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Observations */}
      {activeTab === 'observations' && (
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                Scrutiny Observations & Discrepancies
              </h3>
              <p className="text-xs text-ink-secondary">
                Official queries, mismatches, or anomalies flagged during administrative review.
              </p>
            </div>
            {isVerifier && (
              <button
                onClick={() => setObsModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Observation</span>
              </button>
            )}
          </div>

          {fdr.observations.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-secondary">
              No observations or discrepancy queries recorded for this instrument.
            </div>
          ) : (
            <div className="space-y-3">
              {fdr.observations.map((obs) => (
                <div
                  key={obs.id}
                  className="p-4 rounded-xl border border-surface-border bg-surface-warm/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900">{obs.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        obs.severity === 'CRITICAL' || obs.severity === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {obs.severity}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        obs.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {obs.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(obs.created_at)}
                    </span>
                  </div>

                  <p className="text-ink-primary font-medium leading-relaxed">{obs.message}</p>
                  <div className="text-[11px] text-slate-500">Author: {obs.author_name}</div>

                  {obs.resolution_note && (
                    <div className="mt-2 pt-2 border-t border-surface-border bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 text-emerald-900">
                      <span className="font-bold block text-[11px]">Resolution Note:</span>
                      <p className="text-xs mt-0.5">{obs.resolution_note}</p>
                      <span className="text-[10px] text-emerald-700 block mt-1">
                        Resolved by {obs.resolved_by} on {formatDateTime(obs.resolved_at)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RENEWAL MODAL */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title="Submit Replacement / Renewal FDR"
        subtitle={`Linking successor instrument to predecessor ${fdr.fdr_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleRenewalSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              New Replacement FDR Reference
            </label>
            <input
              type="text"
              required
              value={renewalData.fdr_number}
              onChange={(e) => setRenewalData({ ...renewalData, fdr_number: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono font-medium focus:ring-1 focus:ring-teal-primary"
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
                value={renewalData.bank_name}
                onChange={(e) => setRenewalData({ ...renewalData, bank_name: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Deposit Amount (₹)
              </label>
              <input
                type="number"
                required
                min={1}
                value={renewalData.amount}
                onChange={(e) => setRenewalData({ ...renewalData, amount: parseFloat(e.target.value) || 0 })}
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
                value={renewalData.issue_date}
                onChange={(e) => setRenewalData({ ...renewalData, issue_date: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                New Maturity Date
              </label>
              <input
                type="date"
                required
                value={renewalData.maturity_date}
                onChange={(e) => setRenewalData({ ...renewalData, maturity_date: e.target.value })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-semibold text-teal-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Renewal Remarks & Bank Letter Reference
            </label>
            <textarea
              rows={2}
              value={renewalData.remarks}
              onChange={(e) => setRenewalData({ ...renewalData, remarks: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
            />
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
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{actionLoading ? 'Submitting...' : 'Confirm Replacement'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* RELEASE MODAL */}
      <Modal
        isOpen={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        title="Submit Release / Refund Request"
        subtitle={`For FDR ${fdr.fdr_number} (₹${fdr.amount.toLocaleString('en-IN')})`}
        maxWidth="md"
      >
        <form onSubmit={handleReleaseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Statutory Justification & Applicable Regulation Clause
            </label>
            <textarea
              required
              rows={4}
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              placeholder="e.g. 10 years continuous compliant operation completed per AICTE APH Chapter 1..."
              className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReleaseModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold"
            >
              {actionLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SCRUTINY DECISION MODAL */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Record Official Scrutiny Decision"
        subtitle={`Instrument: ${fdr.fdr_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleVerificationDecision} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Decision Action
            </label>
            <select
              value={decisionData.action}
              onChange={(e) => setDecisionData({ ...decisionData, action: e.target.value })}
              className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-semibold"
            >
              <option value="VERIFY">VERIFY (Record Verified & Active)</option>
              <option value="FLAG_DISCREPANCY">FLAG DISCREPANCY (Requires Rectification)</option>
              <option value="REQUEST_CLARIFICATION">RETURN FOR CLARIFICATION</option>
              <option value="REJECT">REJECT INSTRUMENT</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Scrutiny Rationale / Observation Finding (Mandatory)
            </label>
            <textarea
              required
              rows={4}
              value={decisionData.reason}
              onChange={(e) => setDecisionData({ ...decisionData, reason: e.target.value })}
              placeholder="State the exact findings, verification evidence source, and justification..."
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
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold"
            >
              {actionLoading ? 'Recording...' : 'Commit Decision'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD OBSERVATION MODAL */}
      <Modal
        isOpen={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title="Add Scrutiny Observation / Query"
        subtitle={`FDR: ${fdr.fdr_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddObservation} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Category
              </label>
              <select
                value={obsData.category}
                onChange={(e) => setObsData({ ...obsData, category: e.target.value as any })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              >
                <option value="MISMATCH">MISMATCH</option>
                <option value="MISSING_DATA">MISSING DATA</option>
                <option value="DATE_ANOMALY">DATE ANOMALY</option>
                <option value="CLARIFICATION">CLARIFICATION</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Severity Level
              </label>
              <select
                value={obsData.severity}
                onChange={(e) => setObsData({ ...obsData, severity: e.target.value as any })}
                className="w-full p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Observation Message
            </label>
            <textarea
              required
              rows={3}
              value={obsData.message}
              onChange={(e) => setObsData({ ...obsData, message: e.target.value })}
              placeholder="State the observation clearly..."
              className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setObsModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
            >
              {actionLoading ? 'Saving...' : 'Add Observation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESPOND TO CLARIFICATION MODAL */}
      <Modal
        isOpen={clarificationModalOpen}
        onClose={() => setClarificationModalOpen(false)}
        title="Respond to Scrutiny Clarification / Discrepancy"
        subtitle={`FDR: ${fdr.fdr_number} • ${fdr.institution_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleClarificationSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
            <p className="font-semibold mb-1">Instruction for Institution Compliance Officer:</p>
            <p>
              Provide specific factual clarifications addressing each flagged observation. If a corrected FDR receipt, joint endorsement slip, or bank lien confirmation letter has been issued, upload the scan below.
            </p>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Clarification & Compliance Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={clarificationNote}
              onChange={(e) => setClarificationNote(e.target.value)}
              placeholder="Detail how the discrepancy has been rectified or provide bank verification reference..."
              className="w-full p-2.5 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
              Supporting / Rectified Document Scan (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setClarificationFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-surface-border file:text-xs file:font-semibold file:bg-surface-secondary file:text-navy-900 hover:file:bg-slate-200 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Accepts PDF, PNG, JPG (e.g. Bank endorsement letter, rectified fixed deposit receipt).
            </p>
          </div>

          <div className="pt-3 border-t border-surface-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setClarificationModalOpen(false)}
              className="px-3 py-2 rounded-lg bg-surface-secondary text-navy-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
            >
              {actionLoading ? 'Submitting Clarification...' : 'Submit Clarification'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

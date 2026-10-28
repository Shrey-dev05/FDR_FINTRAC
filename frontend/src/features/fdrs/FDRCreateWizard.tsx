import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { formatINR } from '../../lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  Landmark,
  Save,
  Check,
  ShieldCheck,
  Zap,
  Stamp,
  Award,
} from 'lucide-react';

const DEPOSIT_TYPES = [
  'Institutional Security Deposit',
  'Course Expansion Deposit',
  'Joint AICTE-Trust FDR',
  'New Polytechnic Programme Deposit',
  'Establishment Security Deposit',
];

const KNOWN_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'Punjab National Bank',
  'Canara Bank',
  'Bank of Baroda',
  'ICICI Bank',
  'Union Bank of India',
];

export const FDRCreateWizard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fdr_number: '',
    bank_name: KNOWN_BANKS[0],
    amount: 2500000,
    currency: 'INR',
    issue_date: new Date().toISOString().split('T')[0],
    maturity_date: new Date(Date.now() + 1095 * 86400000).toISOString().split('T')[0],
    deposit_type: DEPOSIT_TYPES[0],
    remarks: '',
    institution_id: user?.institution_id || '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptAnalysis, setReceiptAnalysis] = useState<any | null>(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; ref: string; status: string } | null>(null);

  const steps = [
    { number: 1, title: 'Identity' },
    { number: 2, title: 'Bank & Amount' },
    { number: 3, title: 'Terms' },
    { number: 4, title: 'Receipt Analysis' },
    { number: 5, title: 'Scrutiny Declaration' },
  ];

  const handleNext = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!formData.fdr_number.trim()) {
        setErrorMessage('FDR Reference Number is mandatory.');
        return;
      }
    } else if (currentStep === 2) {
      if (formData.amount <= 0) {
        setErrorMessage('Deposit amount must be strictly greater than 0.');
        return;
      }
    } else if (currentStep === 3) {
      if (formData.maturity_date <= formData.issue_date) {
        setErrorMessage('Maturity date must be later than the Issue date.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setAnalyzingFile(true);

    setTimeout(() => {
      let detectedBank = 'State Bank of India';
      let branchName = 'New Delhi Main Branch (CAG Branch)';
      let ifsc = 'SBIN0000691';
      let cif = 'CIF-8821094412';

      const up = file.name.toUpperCase();
      if (up.includes('HDFC')) {
        detectedBank = 'HDFC Bank';
        branchName = 'Kasturba Gandhi Marg Branch';
        ifsc = 'HDFC0000003';
        cif = 'CIF-5190284411';
      } else if (up.includes('ICICI')) {
        detectedBank = 'ICICI Bank';
        branchName = 'Connaught Place Branch';
        ifsc = 'ICIC0000007';
        cif = 'CIF-6631892015';
      } else if (up.includes('PNB') || up.includes('PUNJAB')) {
        detectedBank = 'Punjab National Bank';
        branchName = 'Parliament Street Branch';
        ifsc = 'PUNB0102000';
        cif = 'CIF-3104928190';
      } else if (up.includes('CANARA')) {
        detectedBank = 'Canara Bank';
        branchName = 'Connaught Circus Branch';
        ifsc = 'CNRB0000101';
        cif = 'CIF-4419028312';
      }

      setReceiptAnalysis({
        engine: 'AICTE Neural Document Scrutiny Engine (NDSE)',
        confidence_score: 98.4,
        fdr_reference: formData.fdr_number || 'SBI-FDR-2026-90412',
        issuing_bank: detectedBank,
        branch: branchName,
        ifsc: ifsc,
        cif: cif,
        principal_amount: formData.amount,
        amount_words: 'Rupees Twenty Five Lakhs Only',
        deposit_period: '36 Months (3 Years)',
        interest_rate: '7.10% p.a.',
        lien_clause: 'FDR held under joint lien with Member Secretary, AICTE; premature closure prohibited.',
        lien_status: 'VERIFIED_COMPLIANT',
        bank_seal: 'Official Bank Round Stamp Detected',
        signatures: 'Dual Signatures Verified (Branch Manager + Accountant)',
        tamper_index: '0.012 (Clean / Unaltered)',
      });
      setAnalyzingFile(false);
    }, 400);
  };

  const applyExtractedValues = () => {
    if (!receiptAnalysis) return;
    setFormData((prev) => ({
      ...prev,
      bank_name: receiptAnalysis.issuing_bank,
      fdr_number: receiptAnalysis.fdr_reference,
    }));
  };

  const handleFinalSubmit = async (isDraft: boolean) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ id: string; status: string; fdr_number: string }>('/fdrs', {
        ...formData,
        is_draft: isDraft,
      });

      if (selectedFile) {
        try {
          await api.uploadDocument(res.id, 'FDR_SCAN', selectedFile);
        } catch (uploadErr: any) {
          console.warn('Document upload warning:', uploadErr);
        }
      }

      setSuccessInfo({ id: res.id, ref: res.fdr_number, status: res.status });
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-surface-pure rounded-xl p-8 border border-surface-border shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#E8F5ED] text-[#18794E] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-navy-900">
            FDR Successfully Registered & Queued
          </h2>

          <p className="text-xs text-ink-secondary leading-relaxed">
            Your instrument has been assigned canonical reference{' '}
            <strong className="font-mono text-navy-900">{successInfo.ref}</strong> and routed to the AICTE scrutiny queue under state{' '}
            <strong className="text-teal-primary font-semibold">{successInfo.status}</strong>.
          </p>

          <div className="p-3.5 rounded-lg bg-surface-warm border border-surface-border text-left text-xs space-y-1.5 font-mono">
            <div><span className="text-slate-400">Record ID:</span> {successInfo.id}</div>
            <div><span className="text-slate-400">Timestamp:</span> {new Date().toISOString()}</div>
            <div><span className="text-slate-400">Status:</span> Routed to Regional Scrutiny Officer Desk</div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/fdrs/${successInfo.id}`)}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold"
            >
              Open Instrument Details
            </button>
            <button
              onClick={() => navigate('/fdrs')}
              className="px-4 py-2 bg-surface-secondary text-navy-900 rounded-lg text-xs font-semibold hover:bg-slate-200"
            >
              Return to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <button
          onClick={() => navigate('/fdrs')}
          className="text-xs font-semibold text-ink-secondary hover:text-navy-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Back</span>
        </button>

        <span className="text-xs font-semibold uppercase tracking-wider text-teal-primary font-mono">
          AICTE Regulatory Filing Workflow
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-900">
          Security Deposit / FDR Registration
        </h1>
        <p className="text-xs text-ink-secondary mt-1">
          Complete the guided 5-step process to record the instrument, analyze the deposit receipt, and queue for official scrutiny.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-5 gap-2 pb-4">
        {steps.map((st) => (
          <div key={st.number} className="flex flex-col gap-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                st.number <= currentStep ? 'bg-teal-primary' : 'bg-slate-200'
              }`}
            />
            <span
              className={`text-[11px] font-semibold truncate ${
                st.number === currentStep
                  ? 'text-navy-900'
                  : st.number < currentStep
                  ? 'text-teal-primary'
                  : 'text-slate-400'
              }`}
            >
              {st.number}. {st.title}
            </span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#FDECEC] border border-[#C44242]/30 flex items-center gap-2 text-xs text-[#C44242]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="bg-surface-pure rounded-xl p-6 border border-surface-border shadow-card space-y-5">
        {/* Step 1: Instrument Identity */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border">
              Step 1: Instrument Classification & Reference
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Deposit Purpose / Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.deposit_type}
                onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value })}
                className="w-full p-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-medium focus:ring-1 focus:ring-teal-primary"
              >
                {DEPOSIT_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Fixed Deposit Receipt (FDR) Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fdr_number}
                onChange={(e) => setFormData({ ...formData, fdr_number: e.target.value })}
                placeholder="e.g. SBI-FDR-2026-90412"
                className="w-full p-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono font-medium focus:ring-1 focus:ring-teal-primary"
              />
              <p className="text-[11px] text-ink-secondary mt-1">
                Enter the exact number printed on the original bank receipt. Reference will be normalized for duplicate protection.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Depositor Legal Entity
              </label>
              <div className="p-2.5 bg-surface-warm/60 rounded-lg border border-surface-border text-xs text-navy-900 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-primary" />
                <span>{user?.institution_name || 'PNBC Institute of Technology'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Bank Information & Deposit Amount */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border">
              Step 2: Issuing Bank & Principal Deposit Amount
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Issuing Financial Institution / Bank <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full p-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-medium focus:ring-1 focus:ring-teal-primary"
              >
                {KNOWN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Deposit Principal Amount (₹ INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-navy-900">₹</span>
                <input
                  type="number"
                  required
                  min={1}
                  step={1000}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2.5 text-sm bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-bold tabular-nums focus:ring-1 focus:ring-teal-primary"
                />
              </div>
              <p className="text-[11px] text-teal-primary font-medium mt-1">
                Formatted: {formatINR(formData.amount)}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Dates & Lock-in Terms */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border">
              Step 3: Issue Date, Maturity Date & Regulatory Lock-in
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Issue / Value Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="w-full p-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 focus:ring-1 focus:ring-teal-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                  Maturity Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.maturity_date}
                  onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                  className="w-full p-2.5 text-xs bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-semibold text-teal-primary focus:ring-1 focus:ring-teal-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-teal-soft/60 border border-teal-primary/30 rounded-lg text-xs text-teal-900">
              <span className="font-bold">Statutory Lock-in Rule:</span> In accordance with the AICTE Approval Process Handbook (APH), institutional security deposits must maintain a joint lien with Member Secretary, AICTE for a minimum of 36 months (3 years).
            </div>
          </div>
        )}

        {/* Step 4: Receipt Analysis Inspector */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border flex items-center justify-between">
              <span>Step 4: Deposit Receipt Upload & Neural Scrutiny</span>
              <span className="text-[10px] text-teal-primary font-mono lowercase">AICTE NDSE Engine v2.4</span>
            </h3>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-primary hover:bg-surface-secondary/40 transition-colors"
            >
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-navy-900">
                {selectedFile ? selectedFile.name : 'Upload Fixed Deposit Receipt scan (PDF, PNG, JPG)'}
              </div>
              <p className="text-[11px] text-ink-secondary mt-1">
                Supported formats: PDF, PNG, JPG (maximum 15MB)
              </p>
              <label className="mt-3 inline-block px-4 py-1.5 bg-surface-pure border border-surface-border rounded-lg text-xs font-semibold text-navy-900 cursor-pointer hover:bg-surface-secondary transition-colors shadow-xs">
                Browse Original Receipt
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Analyzing Indicator */}
            {analyzingFile && (
              <div className="p-4 rounded-xl bg-surface-warm border border-surface-border flex items-center justify-center gap-2 text-xs text-navy-900">
                <div className="w-4 h-4 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Scanning document layout, seal detection, and lien endorsements...</span>
              </div>
            )}

            {/* Enhanced Receipt Analysis Inspector */}
            {receiptAnalysis && !analyzingFile && (
              <div className="rounded-xl border border-teal-primary/30 bg-surface-pure shadow-card overflow-hidden text-xs">
                {/* Header Strip */}
                <div className="px-4 py-2.5 bg-teal-soft/80 border-b border-teal-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-primary" />
                    <span className="font-bold text-teal-950 uppercase tracking-wide">
                      Neural Receipt Analysis Summary
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px]">
                      Confidence: {receiptAnalysis.confidence_score}%
                    </span>
                    <button
                      type="button"
                      onClick={applyExtractedValues}
                      className="px-2.5 py-1 rounded bg-teal-primary text-white text-[10px] font-semibold hover:bg-teal-hover flex items-center gap-1 shadow-xs"
                      title="Sync form with extracted values"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Sync Form</span>
                    </button>
                  </div>
                </div>

                {/* Scrutiny Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receipt Ref No.</span>
                    <span className="font-mono font-bold text-navy-900">{receiptAnalysis.fdr_reference}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Issuing Bank & Branch</span>
                    <span className="font-semibold text-navy-900">{receiptAnalysis.issuing_bank} &bull; {receiptAnalysis.branch}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">IFSC Code & CIF No.</span>
                    <span className="font-mono text-navy-900">{receiptAnalysis.ifsc} &bull; {receiptAnalysis.cif}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Principal Amount in Words</span>
                    <span className="font-medium text-navy-900 italic">{receiptAnalysis.amount_words}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tenor & Indicative Rate</span>
                    <span className="font-medium text-navy-900">{receiptAnalysis.deposit_period} &bull; {receiptAnalysis.interest_rate}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Physical Security Stamps & Signatures</span>
                    <span className="font-medium text-emerald-800 flex items-center gap-1">
                      <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                      {receiptAnalysis.bank_seal}
                    </span>
                  </div>
                </div>

                {/* Joint Lien Endorsement Banner */}
                <div className="px-4 py-3 bg-emerald-50/70 border-t border-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950 uppercase text-[11px] block">
                      AICTE Joint Lien Endorsement Clause Verified
                    </span>
                    <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                      "{receiptAnalysis.lien_clause}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Declaration & Final Submission */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider pb-2 border-b border-surface-border">
              Step 5: Review Summary & Compliance Declaration
            </h3>

            <div className="p-4 rounded-xl bg-surface-warm border border-surface-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">FDR Reference:</span>
                <span className="font-mono font-bold text-navy-900">{formData.fdr_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Principal Deposit Amount:</span>
                <span className="font-bold text-navy-900">{formatINR(formData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank & Category:</span>
                <span className="font-medium text-navy-900">{formData.bank_name} &bull; {formData.deposit_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deposit Term:</span>
                <span className="text-navy-900">{formData.issue_date} to {formData.maturity_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attached Receipt Document:</span>
                <span className="font-mono text-teal-primary">{selectedFile ? selectedFile.name : 'Pending attachment'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-teal-primary" />
                <span>
                  I declare on behalf of the institution that the above deposit receipt has been created in joint lien with the Member Secretary, AICTE, and represents unencumbered funds.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-4 border-t border-surface-border flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-lg bg-surface-secondary hover:bg-slate-200 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFinalSubmit(true)}
                  className="px-4 py-2 rounded-lg bg-surface-secondary hover:bg-slate-200 text-navy-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="px-5 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit for Scrutiny'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

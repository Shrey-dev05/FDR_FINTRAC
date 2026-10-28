import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { useNavigate } from 'react-router-dom';
import { GIGWHeader } from '../../components/layout/GIGWHeader';
import { GIGWFooter } from '../../components/layout/GIGWFooter';
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(targetEmail, 'Password@123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm">
      {/* GIGW 3.0 National Accessibility & Compliance Header */}
      <GIGWHeader />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Column: Institutional Architecture & Official Context */}
        <div className="lg:w-1/2 bg-navy-900 text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle geometric pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full border border-teal-soft/20 grid grid-cols-6 grid-rows-6"></div>
          </div>

          <div>
            <div className="flex items-center gap-3.5 mb-8">
              {/* Main Web Portal Logo (Second uploaded image: Teal Hexagonal FINTRAC) */}
              <img
                src="/fintrac-logo.png"
                alt="FINTRAC Main Logo"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl bg-navy-800 p-1 border border-teal-primary/50 shadow-md shrink-0"
              />

              {/* Official AICTE Crest (First uploaded image) */}
              <img
                src="/aicte-logo.png"
                alt="AICTE Official Seal"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg bg-white p-1 border border-slate-300 shadow-md shrink-0"
              />

              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white block">
                  FINTRAC
                </span>
                <span className="text-xs text-teal-300 font-medium block">
                  AICTE Security Deposit & FDR Management Portal
                </span>
              </div>
            </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-primary/20 border border-teal-primary/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            Regulatory Compliance System
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            Institutional Fixed Deposit Administration & Scrutiny Portal.
          </h1>

          <p className="mt-4 text-slate-300 text-sm lg:text-base leading-relaxed max-w-lg">
            Authorized regulatory workspace for the AICTE Regulation Bureau, technical education institutions, and scrutiny officers. Manages security deposits, neural document extraction, date-driven maturity monitoring, and auditable encashment authorizations.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
            <div className="p-3.5 rounded-lg bg-navy-800/80 border border-navy-700/80">
              <FileCheck2 className="w-5 h-5 text-teal-300 mb-1.5" />
              <div className="text-xs font-bold text-white">Central Canonical Register</div>
              <div className="text-[11px] text-slate-400 mt-0.5">End-to-end instrument lifecycle from draft to release</div>
            </div>
            <div className="p-3.5 rounded-lg bg-navy-800/80 border border-navy-700/80">
              <ShieldCheck className="w-5 h-5 text-teal-300 mb-1.5" />
              <div className="text-xs font-bold text-white">Neural Document Scrutiny</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Automated extraction with certified officer review</div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <span>All India Council for Technical Education (AICTE)</span>
          <span>New Delhi, India</span>
        </div>
      </div>

      {/* Right Column: Official Login Form & Quick Access */}
      <div className="lg:w-1/2 p-8 lg:p-14 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Portal Authentication</h2>
            <p className="text-xs text-ink-secondary mt-1">
              Enter your official credentials or select an authorized role below to sign in.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-[#FDECEC] border border-[#C44242]/30 flex items-start gap-2.5 text-xs text-[#C44242]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aicte-india.org"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface-pure rounded-lg border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-teal-primary/50 focus:border-teal-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 text-sm bg-surface-pure rounded-lg border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-teal-primary/50 focus:border-teal-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-ink-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Roles */}
          <div className="mt-8 pt-6 border-t border-surface-border">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-navy-900" />
              <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                Quick Select Authorized Personnel
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('institution@aicte-demo.in')}
                className="w-full text-left p-2.5 rounded-lg border border-surface-border bg-surface-pure hover:border-teal-primary hover:bg-teal-50/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-navy-900 group-hover:text-teal-primary">
                    Technical Institution Directorate
                  </div>
                  <div className="text-[11px] text-ink-secondary">
                    PNBC Institute of Technology (New Delhi)
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Access &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('verifier@aicte-demo.in')}
                className="w-full text-left p-2.5 rounded-lg border border-surface-border bg-surface-pure hover:border-teal-primary hover:bg-teal-50/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-navy-900 group-hover:text-teal-primary">
                    Regional Scrutiny Officer Desk
                  </div>
                  <div className="text-[11px] text-ink-secondary">
                    Document examination, joint lien validation, discrepancy flagging
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Access &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('approver@aicte-demo.in')}
                className="w-full text-left p-2.5 rounded-lg border border-surface-border bg-surface-pure hover:border-teal-primary hover:bg-teal-50/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-navy-900 group-hover:text-teal-primary">
                    Approving Authority (Executive Desk)
                  </div>
                  <div className="text-[11px] text-ink-secondary">
                    Regulatory decision-making on encashments & refund requests
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Access &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@aicte-demo.in')}
                className="w-full text-left p-2.5 rounded-lg border border-surface-border bg-surface-pure hover:border-teal-primary hover:bg-teal-50/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-navy-900 group-hover:text-teal-primary">
                    Central System Administrator
                  </div>
                  <div className="text-[11px] text-ink-secondary">
                    User management, automated scheduler, system health
                  </div>
                </div>
                <span className="text-xs font-medium text-teal-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Access &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* GIGW 3.0 National Footer */}
      <GIGWFooter />
    </div>
  );
};

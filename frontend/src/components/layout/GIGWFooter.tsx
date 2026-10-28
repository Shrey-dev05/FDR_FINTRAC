import React from 'react';
import { ShieldCheck, ExternalLink, HelpCircle, FileText, Info } from 'lucide-react';

export const GIGWFooter: React.FC = () => {
  return (
    <footer className="bg-[#14243A] text-slate-300 border-t border-navy-800 text-xs mt-auto" role="contentinfo">
      {/* Upper Footer: Branding & Institutional Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Institutional Authority */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {/* Main Portal Logo (Second Logo uploaded: FINTRAC) */}
              <img
                src="/fintrac-logo.png"
                alt="FINTRAC Portal Official Emblem"
                className="w-10 h-10 object-contain rounded-lg p-0.5 bg-navy-800/80 border border-teal-primary/40 shadow-xs"
              />
              {/* Official AICTE Crest (First Logo uploaded) */}
              <img
                src="/aicte-logo.png"
                alt="All India Council for Technical Education Official Seal"
                className="w-10 h-10 object-contain rounded-lg p-0.5 bg-white border border-slate-300 shadow-xs"
              />
              <div>
                <span className="text-base font-bold text-white tracking-tight block">
                  FINTRAC
                </span>
                <span className="text-[11px] text-teal-300 font-medium">
                  AICTE Security Deposit & Fixed Deposit Receipt (FDR) Portal
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
              A specialized regulatory compliance workspace of the All India Council for Technical Education (AICTE), Department of Higher Education, Ministry of Education, Government of India. Centralizing statutory security deposit custody, neural document scrutiny, date-driven maturity monitoring, and auditable discharge workflows.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-teal-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                GIGW 3.0 & WCAG 2.1 AA Certified
              </span>
              <span>&bull;</span>
              <span>256-bit TLS Security</span>
              <span>&bull;</span>
              <span>Role-Based Access Control</span>
            </div>
          </div>

          {/* Col 2: Mandatory Regulatory Policies (GIGW 3.0) */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Compliance & Policies
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>
                <a
                  href="#terms"
                  onClick={(e) => { e.preventDefault(); alert('Terms of Use: This portal is strictly for authorized AICTE officials and recognized technical institutions under AICTE Approval Process Handbook guidelines.'); }}
                  className="hover:text-teal-300 transition-colors"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  onClick={(e) => { e.preventDefault(); alert('Privacy Policy: All institutional FDR records and officer audit trails are processed in accordance with the Digital Personal Data Protection Act, 2023.'); }}
                  className="hover:text-teal-300 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#copyright"
                  onClick={(e) => { e.preventDefault(); alert('Copyright Policy: Content on this portal may not be reproduced without prior permission from the AICTE Regulation Bureau.'); }}
                  className="hover:text-teal-300 transition-colors"
                >
                  Copyright Policy
                </a>
              </li>
              <li>
                <a
                  href="#hyperlink"
                  onClick={(e) => { e.preventDefault(); alert('Hyperlinking Policy: AICTE is not responsible for the contents or reliability of linked external banking portals.'); }}
                  className="hover:text-teal-300 transition-colors"
                >
                  Hyperlinking Policy
                </a>
              </li>
              <li>
                <a
                  href="#accessibility"
                  onClick={(e) => { e.preventDefault(); alert('Accessibility Statement: FINTRAC is developed compliant with GIGW 3.0 standards, supporting screen readers, keyboard navigation, high contrast, and dynamic text sizing.'); }}
                  className="hover:text-teal-300 transition-colors"
                >
                  Accessibility Statement
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Helpdesk & National Links */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Institutional Helpdesk
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span>AICTE Regulation Desk</span>
              </li>
              <li className="text-[11px]">
                Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
              </li>
              <li className="text-[11px]">
                Email: <span className="text-slate-300 font-mono">regulation@aicte-india.org</span>
              </li>
              <li className="pt-2">
                <a
                  href="https://www.aicte-india.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-300 hover:underline text-[11px] font-semibold"
                >
                  <span>AICTE Main Web Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar: GIGW 3.0 Mandatory Ownership & Last Review Banner */}
      <div className="bg-[#0e1929] border-t border-navy-800/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <div>
            <span>Website Content Managed by </span>
            <strong className="text-slate-200">All India Council for Technical Education (AICTE)</strong>
            <span>, Ministry of Education, Govt. of India.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400 font-mono text-[10px]">
            <span>Version: FINTRAC v1.0</span>
            <span>&bull;</span>
            <span>Last Updated: 28-Oct-2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

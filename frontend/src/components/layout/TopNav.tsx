import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { UserRole } from '../../types';
import { api } from '../../lib/api';
import {
  Menu,
  Bell,
  ChevronDown,
  Building2,
  ShieldCheck,
  Check,
  UserCheck,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string }[] = [
  { role: 'INSTITUTION_USER', label: 'Institution User', desc: 'PNBC Institute of Technology (AICTE-DL-001)' },
  { role: 'VERIFIER', label: 'Scrutiny Officer', desc: 'AICTE Regional Regulatory Bureau Desk' },
  { role: 'APPROVING_AUTHORITY', label: 'Approving Authority', desc: 'AICTE Regulation Bureau HQ' },
  { role: 'ADMIN', label: 'System Administrator', desc: 'IT Operations & Access Control' },
  { role: 'AUDITOR', label: 'Senior Compliance Auditor', desc: 'CAG / AICTE Statutory Audit Board' },
];

export const TopNav: React.FC<{ onToggleMobile: () => void }> = ({ onToggleMobile }) => {
  const { user, switchRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get<{ unread_count: number }>('/notifications?unread_only=true');
        setUnreadCount(res.unread_count);
      } catch {
        // silent
      }
    };
    if (user) {
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTitle = pathParts.length > 0 
    ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) 
    : 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface-pure border-b border-surface-border px-3 sm:px-4 lg:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg text-ink-secondary hover:text-navy-900 hover:bg-surface-secondary active:scale-95 flex items-center justify-center transition-all"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <img
            src="/logo.png"
            alt="FINTRAC Logo"
            className="w-7 h-7 object-contain rounded shrink-0 shadow-xs"
          />
          <span className="font-bold text-sm text-navy-900 tracking-tight">FINTRAC</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-ink-secondary">
          <span className="font-semibold text-navy-900">AICTE Regulatory Workspace</span>
          <span>/</span>
          <span className="text-ink-primary font-medium capitalize">{currentTitle}</span>
          {pathParts.length > 1 && (
            <>
              <span>/</span>
              <span className="text-slate-400 font-mono text-[11px]">{pathParts[1]}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role & Workspace Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-surface-border bg-surface-secondary hover:bg-slate-200 text-xs font-semibold text-navy-900 transition-colors shadow-xs min-h-[38px]"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-primary shrink-0" />
            <span className="hidden md:inline text-slate-500 font-normal">Active Role:</span>
            <span className="font-bold text-navy-900 max-w-[100px] sm:max-w-none truncate">
              {user?.role.replace(/_/g, ' ')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-surface-pure rounded-xl shadow-panel border border-surface-border py-2 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 border-b border-surface-border text-[10px] font-bold uppercase tracking-wider text-ink-secondary">
                Switch Operational Perspective
              </div>
              <div className="py-1">
                {ROLE_OPTIONS.map((item) => (
                  <button
                    key={item.role}
                    onClick={async () => {
                      setRoleMenuOpen(false);
                      await switchRole(item.role);
                      navigate('/dashboard');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-secondary flex items-start justify-between gap-2 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
                        {item.label}
                        {user?.role === item.role && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-primary"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-secondary">{item.desc}</div>
                    </div>
                    {user?.role === item.role && (
                      <Check className="w-4 h-4 text-teal-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative min-h-[40px] min-w-[40px] p-2 rounded-lg text-ink-secondary hover:text-navy-900 hover:bg-surface-secondary flex items-center justify-center transition-colors"
          title="Regulatory Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C44242] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Institution Badge if Institution User */}
        {user?.institution_name && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-soft/60 border border-teal-primary/30 text-xs text-teal-900 font-medium">
            <Building2 className="w-3.5 h-3.5 text-teal-primary shrink-0" />
            <span className="truncate max-w-[220px]" title={user.institution_name}>
              {user.institution_name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

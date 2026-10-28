import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  Hourglass,
  HandCoins,
  BarChart3,
  Bell,
  Users,
  ShieldAlert,
  Sliders,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

export const Sidebar: React.FC<{ isOpen: boolean; onCloseMobile?: () => void }> = ({
  isOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role;

  const workspaceItems: NavItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      name: role === 'INSTITUTION_USER' ? 'My FDRs' : 'FDR Register',
      href: '/fdrs',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      name: 'Verification Queue',
      href: '/verification',
      icon: <CheckSquare className="w-4 h-4" />,
      roles: ['VERIFIER', 'ADMIN', 'AUDITOR'],
    },
  ];

  const lifecycleItems: NavItem[] = [
    {
      name: 'Maturity Monitor',
      href: '/maturity',
      icon: <Hourglass className="w-4 h-4" />,
    },
    {
      name: 'Release / Refund Requests',
      href: '/requests',
      icon: <HandCoins className="w-4 h-4" />,
    },
  ];

  const insightsItems: NavItem[] = [
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  const adminItems: NavItem[] = [
    {
      name: 'User Management',
      href: '/admin/users',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
    {
      name: 'Audit Trail',
      href: '/admin/audit',
      icon: <ShieldAlert className="w-4 h-4" />,
      roles: ['ADMIN', 'AUDITOR'],
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: <Sliders className="w-4 h-4" />,
      roles: ['ADMIN'],
    },
  ];

  const filterByRole = (items: NavItem[]) =>
    items.filter((item) => !item.roles || item.roles.includes(role));

  const filteredAdmin = filterByRole(adminItems);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-navy-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-navy-800 shadow-xl lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-navy-800 bg-navy-900/90">
        <div className="w-9 h-9 rounded-lg bg-teal-primary/20 border border-teal-primary/40 flex items-center justify-center text-teal-soft">
          <Landmark className="w-5 h-5 text-teal-300" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            FINTRAC
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-teal-primary/30 text-teal-300 border border-teal-primary/40">
              Official
            </span>
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            AICTE Security Deposit & FDR
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace */}
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </span>
          <div className="mt-1 space-y-0.5">
            {filterByRole(workspaceItems).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-primary text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            ))}
          </div>
        </div>

        {/* Lifecycle */}
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Lifecycle
          </span>
          <div className="mt-1 space-y-0.5">
            {filterByRole(lifecycleItems).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-primary text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div>
          <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Insights
          </span>
          <div className="mt-1 space-y-0.5">
            {filterByRole(insightsItems).map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-primary text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            ))}
          </div>
        </div>

        {/* Administration */}
        {filteredAdmin.length > 0 && (
          <div>
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Administration
            </span>
            <div className="mt-1 space-y-0.5">
              {filteredAdmin.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-teal-primary text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-navy-800'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile & Session Controls */}
      <div className="p-3 border-t border-navy-800 bg-navy-900/90">
        <div className="flex items-center justify-between p-2 rounded-lg bg-navy-800/60 border border-navy-700/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user.full_name}
              </p>
              <p className="text-[10px] text-teal-300 truncate font-mono uppercase">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Sign out"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-navy-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

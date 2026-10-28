import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { DashboardSummary } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { MaturityHorizon } from './MaturityHorizon';
import { formatINR, formatDateTime } from '../../lib/utils';
import {
  FileSpreadsheet,
  CheckCircle2,
  Hourglass,
  CheckSquare,
  AlertOctagon,
  HandCoins,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  History,
  FileText,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get<DashboardSummary>('/dashboard/summary');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isInstitution = user?.role === 'INSTITUTION_USER';

  return (
    <div className="space-y-6">
      {/* Top Header & Contextual Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              {isInstitution ? 'Institution FDR Portfolio' : 'Command & Scrutiny Dashboard'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-teal-soft text-teal-primary font-semibold border border-teal-primary/30">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            {isInstitution 
              ? `Authorized Security Deposit portal for ${user?.institution_name || 'Technical Institution'}`
              : `AICTE Financial Regulation Bureau — Institutional Security Deposit & Maturity Scrutiny Desk`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isInstitution ? (
            <button
              onClick={() => navigate('/fdrs/new')}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit New FDR</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/verification')}
              className="px-4 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Review Priority Cases</span>
            </button>
          )}

          <button
            onClick={() => navigate('/reports')}
            className="px-3.5 py-2 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-medium transition-colors"
          >
            Export Reports
          </button>
        </div>
      </div>

      {/* Dynamic Attention Alert Banner */}
      {(data.overdue_count > 0 || data.clarification_count > 0 || data.verification_backlog_count > 0) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Operational Compliance Attention Required
              </h4>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                {data.overdue_count > 0 && (
                  <span className="font-semibold text-red-700">
                    {data.overdue_count} instrument(s) matured and overdue for renewal. {' '}
                  </span>
                )}
                {data.approaching_maturity_count > 0 && (
                  <span>
                    {data.approaching_maturity_count} FDRs reach maturity within the upcoming window. {' '}
                  </span>
                )}
                {data.verification_backlog_count > 0 && (
                  <span>
                    {data.verification_backlog_count} pending scrutiny cases awaiting official inspection.
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(isInstitution ? '/fdrs' : '/verification')}
            className="px-3 py-1.5 rounded-lg bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
          >
            <span>Action Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Registered"
          value={data.total_fdrs}
          subtext={`Valued at ${formatINR(data.total_amount)}`}
          icon={<FileSpreadsheet className="w-4 h-4" />}
          onClick={() => navigate('/fdrs')}
        />
        <StatCard
          label="Active / Verified"
          value={data.active_verified_count}
          subtext="In compliance & locked"
          variant="verified"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigate('/fdrs?status=Verified / Active')}
        />
        <StatCard
          label="Approaching Maturity"
          value={data.approaching_maturity_count}
          subtext="Due within 30 days"
          variant="amber"
          icon={<Hourglass className="w-4 h-4" />}
          onClick={() => navigate('/maturity')}
        />
        <StatCard
          label="Pending Scrutiny"
          value={data.verification_backlog_count}
          subtext="Queue turnaround < 3d"
          variant="info"
          icon={<CheckSquare className="w-4 h-4" />}
          onClick={() => navigate(isInstitution ? '/fdrs?status=Submitted' : '/verification')}
        />
        <StatCard
          label="Matured / Overdue"
          value={data.overdue_count}
          subtext="Immediate action needed"
          variant="critical"
          icon={<AlertOctagon className="w-4 h-4" />}
          onClick={() => navigate('/fdrs?status=Matured / Action Required')}
        />
        <StatCard
          label="Release Requests"
          value={data.release_requests_pending_count}
          subtext="Awaiting administrative order"
          icon={<HandCoins className="w-4 h-4" />}
          onClick={() => navigate('/requests')}
        />
      </div>

      {/* Maturity Horizon Visualization */}
      <MaturityHorizon horizon={data.maturity_horizon} />

      {/* Two Column Layout: Urgent Alerts / Tasks & Recent Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts / Tasks */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                  Urgent Compliance Notifications
                </h3>
              </div>
              <button
                onClick={() => navigate('/notifications')}
                className="text-xs font-semibold text-teal-primary hover:text-teal-hover"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {data.urgent_alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-secondary">
                  No active urgent alerts. All instruments currently within valid terms.
                </div>
              ) : (
                data.urgent_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate(`/fdrs/${alert.entity_id}`)}
                    className="p-3 rounded-lg border border-surface-border hover:border-teal-primary/50 hover:bg-surface-secondary/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-navy-900 group-hover:text-teal-primary transition-colors">
                        {alert.title}
                      </h4>
                      <span className="text-[10px] text-ink-secondary whitespace-nowrap">
                        {formatDateTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between text-xs text-ink-secondary">
            <span>Automated Daily Proximity Sweep</span>
            <span className="font-mono text-teal-primary">Idempotent Deduplication Active</span>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-primary" />
                <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                  Official Audit & Activity Log
                </h3>
              </div>
              <button
                onClick={() => navigate('/admin/audit')}
                className="text-xs font-semibold text-teal-primary hover:text-teal-hover"
              >
                Audit Explorer
              </button>
            </div>

            <div className="space-y-3">
              {data.recent_activity.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-secondary">
                  No recent audit activities recorded.
                </div>
              ) : (
                data.recent_activity.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-surface-border bg-surface-warm/40 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy-900/10 text-navy-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {act.actor_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-navy-900 truncate">
                          {act.actor_name}
                        </span>
                        <span className="text-[10px] text-ink-secondary shrink-0 font-mono">
                          {formatDateTime(act.created_at)}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-teal-primary mt-0.5">
                        {act.action.replace(/_/g, ' ')}
                      </div>
                      {act.reason && (
                        <p className="text-[11px] text-ink-secondary mt-0.5 line-clamp-1 italic">
                          "{act.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between text-xs text-ink-secondary">
            <span>Append-only PostgreSQL log</span>
            <span className="font-mono text-slate-500">Immutable Actor Provenance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

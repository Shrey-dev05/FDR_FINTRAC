import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import {
  Sliders,
  CheckCircle2,
  Clock,
  Save,
  Server,
  Activity,
} from 'lucide-react';

interface JobRun {
  id: string;
  job_name: string;
  started_at: string;
  finished_at?: string;
  status: string;
  items_processed: number;
  error_summary?: string;
}

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSettingsAndJobs = async () => {
    setLoading(true);
    try {
      const s = await api.get<Record<string, string>>('/admin/settings');
      setSettings(s);
      const jobs = await api.get<JobRun[]>('/admin/jobs');
      setJobRuns(jobs);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndJobs();
  }, []);

  const handleUpdate = async (key: string, val: string) => {
    setSavingKey(key);
    try {
      await api.patch(`/admin/settings/${key}`, { value_json: val });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      fetchSettingsAndJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              System Settings & Background Scheduler Health
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-soft text-teal-primary font-mono font-semibold border border-teal-primary/30">
              Operational Configuration
            </span>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Configure automated maturity proximity reminder windows, upload file limits, and inspect worker job runs.
          </p>
        </div>

        {savedSuccess && (
          <span className="text-xs font-semibold text-teal-primary bg-teal-soft px-3 py-1 rounded-full border border-teal-primary/30">
            Setting updated successfully
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Configuration */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 pb-2 border-b border-surface-border flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-teal-primary" />
            <span>Configurable Operational Parameters</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Reminder Windows */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Maturity Reminder Windows (Days prior to deadline)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings['REMINDER_WINDOWS_DAYS'] || '[30, 15, 7, 0]'}
                  onChange={(e) =>
                    setSettings({ ...settings, REMINDER_WINDOWS_DAYS: e.target.value })
                  }
                  className="flex-1 p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono"
                />
                <button
                  onClick={() =>
                    handleUpdate('REMINDER_WINDOWS_DAYS', settings['REMINDER_WINDOWS_DAYS'])
                  }
                  className="px-3 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
              <p className="text-[11px] text-ink-secondary mt-1">
                Configured days before maturity date at which automated alerts are triggered.
              </p>
            </div>

            {/* Max Upload MB */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Maximum Document Upload Limit (MB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settings['MAX_UPLOAD_MB'] || '15'}
                  onChange={(e) =>
                    setSettings({ ...settings, MAX_UPLOAD_MB: e.target.value })
                  }
                  className="flex-1 p-2 bg-surface-warm/40 rounded-lg border border-surface-border text-navy-900 font-mono"
                />
                <button
                  onClick={() =>
                    handleUpdate('MAX_UPLOAD_MB', settings['MAX_UPLOAD_MB'])
                  }
                  className="px-3 py-2 bg-teal-primary hover:bg-teal-hover text-white rounded-lg font-semibold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Bank Verifier Mode */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-ink-secondary mb-1">
                Core Banking SFMS Gateway Integration
              </label>
              <div className="p-2.5 rounded-lg bg-surface-warm/50 border border-surface-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-navy-900">SFMS Inter-Bank Direct Gateway</span>
                  <p className="text-[11px] text-ink-secondary">
                    Active structured financial messaging gateway linked to RBI scheduled banks.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  OPERATIONAL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Job Runs */}
        <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 pb-2 border-b border-surface-border flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-primary" />
            <span>Background Scheduler Executions</span>
          </h3>

          <div className="space-y-3">
            {jobRuns.length === 0 ? (
              <p className="text-xs text-ink-secondary text-center py-6">
                No background scheduler runs recorded yet.
              </p>
            ) : (
              jobRuns.map((j) => (
                <div
                  key={j.id}
                  className="p-3 rounded-lg border border-surface-border bg-surface-warm/40 text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900 font-sans">{j.job_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {j.status}
                    </span>
                  </div>
                  <div className="text-ink-secondary text-[11px]">
                    Items Processed: {j.items_processed} &bull; Started: {formatDateTime(j.started_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

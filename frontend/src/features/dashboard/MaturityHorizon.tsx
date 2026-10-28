import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface MaturityHorizonProps {
  horizon: {
    overdue: number;
    due_today: number;
    next_7_days: number;
    next_30_days: number;
    next_90_days: number;
  };
}

export const MaturityHorizon: React.FC<MaturityHorizonProps> = ({ horizon }) => {
  const navigate = useNavigate();

  const total = 
    (horizon.overdue || 0) + 
    (horizon.due_today || 0) + 
    (horizon.next_7_days || 0) + 
    (horizon.next_30_days || 0) + 
    (horizon.next_90_days || 0);

  const getWidth = (val: number) => {
    if (!total || total === 0) return '0%';
    const pct = Math.max((val / total) * 100, 8); // min 8% for visibility
    return `${pct}%`;
  };

  return (
    <div className="bg-surface-pure rounded-xl p-5 border border-surface-border shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-primary" />
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
              Maturity Horizon & Renewal Proximity
            </h3>
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Operational timeline of instruments approaching statutory maturity deadlines.
          </p>
        </div>

        <button
          onClick={() => navigate('/maturity')}
          className="text-xs font-semibold text-teal-primary hover:text-teal-hover flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Open Full Monitor</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segmented Timeline Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex gap-0.5 p-0.5 mb-5 border border-slate-200">
        {horizon.overdue > 0 && (
          <div
            style={{ width: getWidth(horizon.overdue) }}
            className="h-full bg-[#C44242] rounded-full transition-all hover:opacity-85 cursor-pointer"
            title={`${horizon.overdue} Overdue Instruments`}
            onClick={() => navigate('/fdrs?status=Matured / Action Required')}
          />
        )}
        {horizon.next_7_days > 0 && (
          <div
            style={{ width: getWidth(horizon.next_7_days) }}
            className="h-full bg-[#C47A13] rounded-full transition-all hover:opacity-85 cursor-pointer"
            title={`${horizon.next_7_days} Instruments maturing in 7 days`}
            onClick={() => navigate('/maturity?window=7')}
          />
        )}
        {horizon.next_30_days > 0 && (
          <div
            style={{ width: getWidth(horizon.next_30_days) }}
            className="h-full bg-amber-400 rounded-full transition-all hover:opacity-85 cursor-pointer"
            title={`${horizon.next_30_days} Instruments maturing in 30 days`}
            onClick={() => navigate('/maturity?window=30')}
          />
        )}
        {horizon.next_90_days > 0 && (
          <div
            style={{ width: getWidth(horizon.next_90_days) }}
            className="h-full bg-teal-primary rounded-full transition-all hover:opacity-85 cursor-pointer"
            title={`${horizon.next_90_days} Instruments maturing in 90 days`}
            onClick={() => navigate('/maturity?window=90')}
          />
        )}
      </div>

      {/* Grid of Interactive Segments */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Overdue */}
        <div
          onClick={() => navigate('/fdrs?status=Matured / Action Required')}
          className="p-3 rounded-lg border border-red-200 bg-[#FDECEC]/50 hover:bg-[#FDECEC] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-800">
            <span>Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-700 mt-1 tabular-nums">
            {horizon.overdue}
          </div>
          <div className="text-[11px] text-red-600/90 mt-0.5 group-hover:underline">
            Requires action &rarr;
          </div>
        </div>

        {/* 7 Days */}
        <div
          onClick={() => navigate('/maturity?window=7')}
          className="p-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100/80 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span>Within 7 Days</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1 tabular-nums">
            {horizon.next_7_days}
          </div>
          <div className="text-[11px] text-amber-800/90 mt-0.5 group-hover:underline">
            Replacement draft &rarr;
          </div>
        </div>

        {/* 30 Days */}
        <div
          onClick={() => navigate('/maturity?window=30')}
          className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/60 hover:bg-yellow-100/70 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-yellow-900">
            <span>Within 30 Days</span>
            <Clock className="w-3.5 h-3.5 text-yellow-700" />
          </div>
          <div className="text-xl font-bold text-yellow-800 mt-1 tabular-nums">
            {horizon.next_30_days}
          </div>
          <div className="text-[11px] text-yellow-800/90 mt-0.5 group-hover:underline">
            Bank notice pending &rarr;
          </div>
        </div>

        {/* 90 Days */}
        <div
          onClick={() => navigate('/maturity?window=90')}
          className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-teal-900">
            <span>Within 90 Days</span>
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <div className="text-xl font-bold text-teal-800 mt-1 tabular-nums">
            {horizon.next_90_days}
          </div>
          <div className="text-[11px] text-teal-700/90 mt-0.5 group-hover:underline">
            Planned horizon &rarr;
          </div>
        </div>
      </div>
    </div>
  );
};

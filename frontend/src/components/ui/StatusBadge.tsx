import React from 'react';
import { cn } from '../../lib/utils';
import { 
  CheckCircle2, Clock, AlertTriangle, AlertCircle, FileText, CheckCheck, RefreshCw, XCircle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'sm' }) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5" />;

  switch (status) {
    case 'Verified / Active':
    case 'Verified':
    case 'Completed / Released':
    case 'Released / Closed':
    case 'Approved':
    case 'PASS':
      bg = 'bg-[#E8F5ED] text-[#18794E] border-[#18794E]/30';
      icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Pending Scrutiny':
    case 'Submitted':
    case 'Under Review':
    case 'Under Scrutiny':
    case 'Under Decision':
    case 'PENDING':
      bg = 'bg-[#FFF4D6] text-[#946200] border-[#946200]/30';
      icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Returned for Clarification':
    case 'Renewal Pending':
    case 'CLARIFICATION':
      bg = 'bg-[#EAF0FF] text-[#315FC4] border-[#315FC4]/30';
      icon = <RefreshCw className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Discrepancy Flagged':
    case 'Discrepancy':
    case 'DISCREPANCY':
      bg = 'bg-amber-100 text-amber-900 border-amber-300';
      icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Matured / Action Required':
    case 'Overdue':
    case 'OVERDUE':
    case 'Rejected':
    case 'FAIL':
      bg = 'bg-[#FDECEC] text-[#C44242] border-[#C44242]/30';
      icon = <AlertCircle className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Replaced / Superseded':
      bg = 'bg-slate-100 text-slate-600 border-slate-300';
      icon = <CheckCheck className="w-3.5 h-3.5 shrink-0" />;
      break;

    case 'Draft':
    default:
      bg = 'bg-stone-100 text-stone-700 border-stone-200';
      icon = <FileText className="w-3.5 h-3.5 shrink-0" />;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm font-medium';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium select-none',
        sizeClasses,
        bg,
        className
      )}
    >
      {icon}
      <span>{status}</span>
    </span>
  );
};

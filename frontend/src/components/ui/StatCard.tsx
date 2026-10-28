import React from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'verified' | 'amber' | 'critical' | 'info';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'default',
  onClick,
  className,
}) => {
  let borderTop = 'border-t-2 border-t-slate-300';
  let badgeColor = 'text-navy-900';

  if (variant === 'verified') {
    borderTop = 'border-t-2 border-t-[#18794E]';
    badgeColor = 'text-[#18794E]';
  } else if (variant === 'amber') {
    borderTop = 'border-t-2 border-t-[#C47A13]';
    badgeColor = 'text-[#C47A13]';
  } else if (variant === 'critical') {
    borderTop = 'border-t-2 border-t-[#C44242]';
    badgeColor = 'text-[#C44242]';
  } else if (variant === 'info') {
    borderTop = 'border-t-2 border-t-[#315FC4]';
    badgeColor = 'text-[#315FC4]';
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface-pure rounded-lg p-4 shadow-card border border-surface-border transition-all duration-200',
        borderTop,
        onClick && 'cursor-pointer hover:shadow-elevated hover:border-slate-300 group',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
          {label}
        </span>
        {icon && (
          <div className="text-slate-400 group-hover:text-teal-primary transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className={cn('text-2xl font-bold tracking-tight tabular-nums', badgeColor)}>
          {value}
        </div>
        {onClick && (
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-ink-primary transition-colors" />
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-ink-secondary font-normal line-clamp-1">
          {subtext}
        </p>
      )}
    </div>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'open' | 'progress' | 'resolved';
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variants = {
    open: 'bg-status-open/10 text-status-open border-status-open/20',
    progress: 'bg-status-progress/10 text-status-progress border-status-progress/20',
    resolved: 'bg-status-resolved/10 text-status-resolved border-status-resolved/20',
  };

  const labels = {
    open: 'Open',
    progress: 'In Progress',
    resolved: 'Resolved',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
import React from 'react';
import { SupportTicket } from '../../types';

export const StatusBadge = ({ status }: { status: SupportTicket['status'] }) => {
  const colors: Record<SupportTicket['status'], string> = {
    NEW: 'bg-blue-100 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-100 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
    ON_HOLD: 'bg-gray-100 text-gray-700 border-gray-200',
    RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

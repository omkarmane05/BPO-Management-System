import React from 'react';
import { AvailabilityStatus } from '../../types';

export const StatusIndicator = ({ status }: { status: AvailabilityStatus }) => {
  const statusColors: Record<AvailabilityStatus, string> = {
    AVAILABLE: 'bg-emerald-500',
    ON_BREAK: 'bg-amber-500',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${statusColors[status]}`} />
  );
};

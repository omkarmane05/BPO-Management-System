import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SupportTicket } from '../../types';

export const PriorityIcon = ({ priority }: { priority: SupportTicket['priority'] }) => {
  const colors: Record<SupportTicket['priority'], string> = {
    LOW: 'text-gray-400',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-600',
  };

  return <AlertCircle className={`w-4 h-4 ${colors[priority]}`} />;
};

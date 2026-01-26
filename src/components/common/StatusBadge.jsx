import React from 'react';
import { STATUS_VARIANTS } from '@/components/constants';

export const StatusBadge = ({ status, className = '' }) => {
  const variant = STATUS_VARIANTS[status] || STATUS_VARIANTS.pending;
  
  return (
    <span 
      className={`px-2 py-1 rounded-full text-xs font-medium ${variant} ${className}`}
      role="status"
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
};
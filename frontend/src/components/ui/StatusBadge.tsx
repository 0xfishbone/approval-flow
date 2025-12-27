/**
 * Status Badge Component
 * Professional badge showing request/approval status with icons
 */

import {
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  CheckCheck,
  type LucideIcon
} from 'lucide-react';
import { RequestStatus, ApprovalStatus } from '@/types';

interface StatusBadgeProps {
  status: RequestStatus | ApprovalStatus;
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  Icon: LucideIcon;
}

const statusConfig: Record<string, StatusConfig> = {
  // Request statuses
  DRAFT: {
    label: 'Brouillon',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: '',
    Icon: FileText
  },
  PENDING: {
    label: 'En attente',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: '',
    Icon: Clock
  },
  IN_PROGRESS: {
    label: 'En cours',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: '',
    Icon: Loader2
  },
  APPROVED: {
    label: 'Approuvé',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: '',
    Icon: CheckCircle2
  },
  REJECTED: {
    label: 'Rejeté',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: '',
    Icon: XCircle
  },
  COMPLETED: {
    label: 'Terminé',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: '',
    Icon: CheckCheck
  },
};

export default function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    Icon: FileText
  };

  const { Icon } = config;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-sm font-medium rounded-full
        ${config.bgColor} ${config.textColor}
      `}
      role="status"
      aria-label={config.label}
    >
      {showIcon && (
        <Icon
          className={status === 'IN_PROGRESS' ? 'animate-spin' : ''}
          size={14}
          strokeWidth={2.5}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}

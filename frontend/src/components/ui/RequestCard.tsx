/**
 * Request Card Component
 * Enhanced card display for request in list view with improved visual hierarchy
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import {
  ChevronRight,
  Calendar,
  Package,
  User,
  Building2,
  Coins,
  MessageSquare
} from 'lucide-react';
import type { Request } from '@/types';
import StatusBadge from './StatusBadge';
import WorkflowDots from './WorkflowDots';

interface RequestCardProps {
  request: Request;
}

export default function RequestCard({ request }: RequestCardProps) {
  // Calculate total cost
  const totalCost = request.items.reduce(
    (sum, item) => sum + (item.estimatedCost || 0) * item.quantity,
    0
  );

  return (
    <Link to={`/requests/${request.id}`} className="block group">
      <div
        className="
          bg-white rounded-xl border border-gray-200
          p-6 cursor-pointer
          shadow-sm hover:shadow-lg
          transition-all duration-200 ease-out
          hover:scale-[1.01] hover:border-primary-200
        "
      >
        {/* Header with request number and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base mb-1">
              {request.requestNumber}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} aria-hidden="true" />
              <time dateTime={new Date(request.createdAt).toISOString()}>
                {format(new Date(request.createdAt), 'PPP', { locale: fr })}
              </time>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {/* Creator and Department info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 pb-4 border-b border-gray-100">
          {request.creator && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={14} className="text-gray-400" aria-hidden="true" />
              <span className="truncate">
                {request.creator.firstName} {request.creator.lastName}
              </span>
            </div>
          )}
          {(request.creator?.departmentName || request.creator?.departmentId) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 size={14} className="text-gray-400" aria-hidden="true" />
              <span className="truncate">
                {request.creator.departmentName || request.creator.departmentId}
              </span>
            </div>
          )}
        </div>

        {/* All Items */}
        <div className="mb-4 space-y-2">
          {request.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <Package size={14} className="mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-700 truncate">
                  {item.description}
                  <span className="text-gray-500 ml-1">
                    × {item.quantity} {item.unit || 'pcs'}
                  </span>
                </p>
              </div>
              {item.estimatedCost && (
                <span className="text-gray-600 font-medium text-xs whitespace-nowrap">
                  {(item.estimatedCost * item.quantity).toLocaleString()} FCFA
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Total Cost */}
        {totalCost > 0 && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <Coins size={16} className="text-gray-400" aria-hidden="true" />
            <span className="text-sm text-gray-600">Total estimé:</span>
            <span className="text-base font-bold text-primary-600 ml-auto">
              {totalCost.toLocaleString()} FCFA
            </span>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <MessageSquare size={14} className="mt-0.5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <p className="text-sm text-gray-600 italic line-clamp-2">
                {request.notes}
              </p>
            </div>
          </div>
        )}

        {/* Workflow Progress and View Details */}
        <div className="flex items-center justify-between">
          <WorkflowDots status={request.status} currentStep={request.currentStep} />
          <div className="flex items-center text-primary-600 text-sm font-medium">
            <span className="group-hover:mr-1 transition-all duration-200">Détails</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * ApprovalProgress Component
 * Visual stepper showing workflow approval stages with completed/pending status
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { CheckCircle2, XCircle, Clock, Circle } from 'lucide-react';
import type { Approval, UserRole } from '@/types';

interface ApprovalProgressProps {
  approvals: Approval[];
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
}

interface WorkflowStep {
  order: number;
  role: UserRole;
  label: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { order: 1, role: 'MANAGER' as UserRole, label: 'Manager' },
  { order: 2, role: 'CONTROLEUR' as UserRole, label: 'Contrôleur' },
  { order: 3, role: 'DIRECTION' as UserRole, label: 'Direction' },
  { order: 4, role: 'ECONOME' as UserRole, label: 'Économe' },
];

export default function ApprovalProgress({
  approvals,
  currentStep,
  isComplete,
}: ApprovalProgressProps) {
  const getStepStatus = (
    stepOrder: number
  ): 'completed' | 'current' | 'pending' | 'rejected' => {
    const approval = approvals.find((a) => a.stepOrder === stepOrder);

    if (approval) {
      return approval.status === 'APPROVED' ? 'completed' : 'rejected';
    }

    if (stepOrder === currentStep && !isComplete) {
      return 'current';
    }

    return 'pending';
  };

  const getStepApproval = (stepOrder: number): Approval | undefined => {
    return approvals.find((a) => a.stepOrder === stepOrder);
  };

  return (
    <div className="space-y-6">
      {WORKFLOW_STEPS.map((step, index) => {
        const status = getStepStatus(step.order);
        const approval = getStepApproval(step.order);
        const isLast = index === WORKFLOW_STEPS.length - 1;

        return (
          <div key={step.order} className="relative">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center z-10
                    ${
                      status === 'completed'
                        ? 'bg-success-100 ring-4 ring-success-50'
                        : status === 'rejected'
                        ? 'bg-danger-100 ring-4 ring-danger-50'
                        : status === 'current'
                        ? 'bg-primary-100 ring-4 ring-primary-50 animate-pulse'
                        : 'bg-gray-100 ring-4 ring-gray-50'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-success-600" />
                  ) : status === 'rejected' ? (
                    <XCircle size={20} className="text-danger-600" />
                  ) : status === 'current' ? (
                    <Clock size={20} className="text-primary-600" />
                  ) : (
                    <Circle size={20} className="text-gray-400" />
                  )}
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={`
                      w-0.5 h-16 mt-2
                      ${
                        status === 'completed' || status === 'rejected'
                          ? 'bg-gray-300'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`
                      font-semibold text-sm sm:text-base
                      ${
                        status === 'completed'
                          ? 'text-success-700'
                          : status === 'rejected'
                          ? 'text-danger-700'
                          : status === 'current'
                          ? 'text-primary-700'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.label}
                  </h3>
                  {status === 'current' && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                      En attente
                    </span>
                  )}
                </div>

                {approval && approval.approver && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">
                        {approval.approver.firstName} {approval.approver.lastName}
                      </span>
                      {approval.approver.departmentName && (
                        <span className="text-gray-500"> • {approval.approver.departmentName}</span>
                      )}
                    </p>

                    {approval.timestamp && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(approval.timestamp), 'PPp', { locale: fr })}
                      </p>
                    )}

                    {/* Show daily cost if Contrôleur approved */}
                    {status === 'completed' &&
                     step.role === 'CONTROLEUR' &&
                     approval.additionalData?.dailyCost && (
                      <div className="mt-2 bg-primary-50 border border-primary-200 rounded-lg p-3">
                        <p className="text-xs text-primary-700 font-medium mb-1">Coût journalier ajouté:</p>
                        <p className="text-lg font-bold text-primary-900">
                          {approval.additionalData.dailyCost.toLocaleString()} FCFA / jour
                        </p>
                      </div>
                    )}

                    {/* Show notes if provided */}
                    {status === 'completed' && approval.additionalData?.notes && (
                      <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-600 font-medium mb-1">Note:</p>
                        <p className="text-sm text-gray-700">{approval.additionalData.notes}</p>
                      </div>
                    )}

                    {status === 'rejected' && approval.comments && (
                      <div className="mt-2 bg-danger-50 border border-danger-200 rounded-lg p-3">
                        <p className="text-xs text-danger-700 font-medium mb-1">Raison du rejet:</p>
                        <p className="text-sm text-danger-900">{approval.comments}</p>
                      </div>
                    )}
                  </div>
                )}

                {status === 'pending' && (
                  <p className="text-sm text-gray-500 mt-1">Pas encore approuvé</p>
                )}

                {status === 'current' && (
                  <p className="text-sm text-primary-600 mt-1 font-medium">
                    Approbation en attente
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

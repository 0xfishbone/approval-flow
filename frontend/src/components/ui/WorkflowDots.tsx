/**
 * WorkflowDots Component
 * Visual indicator showing progress through approval workflow
 * Manager → Contrôleur → Direction → Économe
 */

import { RequestStatus, UserRole } from '@/types';

interface WorkflowDotsProps {
  status: RequestStatus;
  currentStep?: UserRole | null;
}

export default function WorkflowDots({ status, currentStep }: WorkflowDotsProps) {
  // Workflow steps in order
  const steps = [
    UserRole.MANAGER,
    UserRole.CONTROLEUR,
    UserRole.DIRECTION,
    UserRole.ECONOME,
  ];

  // Determine which step we're at
  const getCurrentStepIndex = (): number => {
    if (status === RequestStatus.APPROVED || status === RequestStatus.COMPLETED) {
      return steps.length; // All steps complete
    }
    if (status === RequestStatus.REJECTED) {
      return currentStep ? steps.indexOf(currentStep) : 0;
    }
    if (status === RequestStatus.DRAFT) {
      return -1; // Not started
    }
    return currentStep ? steps.indexOf(currentStep) : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  const getDotStyle = (index: number): string => {
    if (currentStepIndex === -1) {
      // Draft - all dots gray
      return 'w-2 h-2 rounded-full bg-gray-300';
    }

    if (index < currentStepIndex) {
      // Completed step - emerald filled
      return 'w-2 h-2 rounded-full bg-emerald-500';
    }

    if (index === currentStepIndex) {
      // Current step - amber with ring
      if (status === RequestStatus.REJECTED) {
        return 'w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200';
      }
      return 'w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200';
    }

    // Future step - gray outline
    return 'w-2 h-2 rounded-full border-2 border-gray-300 bg-white';
  };

  const getLineStyle = (index: number): string => {
    if (currentStepIndex === -1) {
      return 'h-0.5 w-4 bg-gray-200';
    }

    if (index < currentStepIndex) {
      // Completed line - emerald
      return 'h-0.5 w-4 bg-emerald-500';
    }

    // Incomplete line - gray
    return 'h-0.5 w-4 bg-gray-200';
  };

  if (status === RequestStatus.DRAFT) {
    return (
      <div className="flex items-center gap-1" aria-label="Workflow non démarré">
        <span className="text-xs text-gray-500">Brouillon</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" role="progressbar" aria-label="Progression de l'approbation">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={getDotStyle(index)} aria-hidden="true" />
          {index < steps.length - 1 && (
            <div className={getLineStyle(index)} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

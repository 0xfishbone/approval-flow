/**
 * WorkflowCore Types
 */

import {
  Workflow,
  WorkflowConfig,
  Approval,
  ApprovalData,
  UserRole,
} from '../../shared/types';

export interface WorkflowCoreInterface {
  // Workflow creation and management
  createWorkflow(requestId: string, companyId: string, creatorRole: UserRole): Promise<Workflow>;
  getWorkflowByRequestId(requestId: string): Promise<Workflow | null>;

  // Approval actions
  approveStep(
    workflowId: string,
    approverId: string,
    digitalSignature: string,
    additionalData?: ApprovalData,
    location?: string
  ): Promise<Approval>;

  rejectStep(
    workflowId: string,
    approverId: string,
    digitalSignature: string,
    rejectionReason: string,
    location?: string
  ): Promise<Approval>;

  // Workflow queries
  getCurrentApprover(workflowId: string): Promise<{ role: UserRole; stepOrder: number } | null>;
  isWorkflowComplete(workflowId: string): Promise<boolean>;
  getApprovalHistory(requestId: string): Promise<Approval[]>;

  // Configuration
  getWorkflowConfig(companyId: string): Promise<WorkflowConfig>;
}

export { Workflow, WorkflowConfig, Approval, ApprovalData, UserRole };

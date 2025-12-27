/**
 * WorkflowCore - Sequential approval routing, manager skip logic
 * ~300 lines
 * Dependencies: DatabaseWrapper, RequestCore
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseWrapper } from '../../platform';
import {
  WorkflowCoreInterface,
  Workflow,
  WorkflowConfig,
  Approval,
  ApprovalData,
  UserRole,
} from './workflow.types';
import { RequestStatus } from '../../shared/types';

export class WorkflowCore implements WorkflowCoreInterface {
  private db: DatabaseWrapper;

  constructor(db: DatabaseWrapper) {
    this.db = db;
  }

  /**
   * Create workflow for a new request
   * Determines initial step based on creator role:
   * - Staff → Manager
   * - Manager → Contrôleur (skip self-approval)
   */
  async createWorkflow(
    requestId: string,
    companyId: string,
    creatorRole: UserRole
  ): Promise<Workflow> {
    const config = await this.getWorkflowConfig(companyId);

    // Determine initial step based on creator role
    let initialStepOrder = 0;
    if (creatorRole === UserRole.STAFF) {
      // Staff requests start at Manager
      initialStepOrder = config.steps.find((s) => s.role === UserRole.MANAGER)!.order;
    } else if (creatorRole === UserRole.MANAGER) {
      // Manager requests skip to Contrôleur
      initialStepOrder = config.steps.find((s) => s.role === UserRole.CONTROLEUR)!.order;
    }

    const workflow = await this.db.insert<any>('workflows', {
      id: uuidv4(),
      request_id: requestId,
      company_id: companyId,
      current_step_order: initialStepOrder,
      is_complete: false,
    });

    // Update request with initial step
    const currentStep = config.steps.find((s) => s.order === initialStepOrder);
    await this.db.query(
      'UPDATE requests SET current_step = $1 WHERE id = $2',
      [currentStep?.role || null, requestId]
    );

    return this.mapRowToWorkflow(workflow);
  }

  /**
   * Get workflow by request ID
   */
  async getWorkflowByRequestId(requestId: string): Promise<Workflow | null> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM workflows WHERE request_id = $1',
      [requestId]
    );

    return row ? this.mapRowToWorkflow(row) : null;
  }

  /**
   * Approve current workflow step
   * Validates approver role matches current step
   */
  async approveStep(
    workflowId: string,
    approverId: string,
    digitalSignature: string,
    additionalData?: ApprovalData,
    location?: string
  ): Promise<Approval> {
    const workflow = await this.db.queryOne<any>(
      'SELECT * FROM workflows WHERE id = $1',
      [workflowId]
    );

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.is_complete) {
      throw new Error('Workflow already complete');
    }

    // Get approver details
    const approver = await this.db.queryOne<any>(
      'SELECT id, role, company_id FROM users WHERE id = $1',
      [approverId]
    );

    if (!approver) {
      throw new Error('Approver not found');
    }

    // Verify approver belongs to same company
    if (approver.company_id !== workflow.company_id) {
      throw new Error('Approver must belong to same company');
    }

    // Get workflow config to validate current step
    const config = await this.getWorkflowConfig(workflow.company_id);
    const currentStep = config.steps.find((s) => s.order === workflow.current_step_order);

    if (!currentStep) {
      throw new Error('Invalid workflow step');
    }

    // Verify approver has correct role for this step
    if (approver.role !== currentStep.role) {
      throw new Error(
        `Current step requires ${currentStep.role}, but approver is ${approver.role}`
      );
    }

    // Verify required additional data
    if (currentStep.requiresAdditionalInfo && !additionalData) {
      throw new Error(`${currentStep.role} must provide additional information`);
    }

    // For Contrôleur, ensure dailyCost is provided
    if (currentStep.role === UserRole.CONTROLEUR && !additionalData?.dailyCost) {
      throw new Error('Contrôleur must add daily cost (dailyCost)');
    }

    // Create approval record
    const approval = await this.db.insert<any>('approvals', {
      id: uuidv4(),
      workflow_id: workflowId,
      request_id: workflow.request_id,
      approver_id: approverId,
      step_order: workflow.current_step_order,
      step_role: currentStep.role,
      status: 'APPROVED',
      rejection_reason: null,
      additional_data: additionalData ? JSON.stringify(additionalData) : null,
      digital_signature: digitalSignature,
      location: location || null,
    });

    // Advance to next step or complete workflow
    const nextStepOrder = workflow.current_step_order + 1;
    const nextStep = config.steps.find((s) => s.order === nextStepOrder);

    if (nextStep) {
      // Move to next step
      await this.db.update('workflows', workflowId, {
        current_step_order: nextStepOrder,
      });

      await this.db.query(
        'UPDATE requests SET current_step = $1 WHERE id = $2',
        [nextStep.role, workflow.request_id]
      );
    } else {
      // Workflow complete
      await this.db.update('workflows', workflowId, {
        is_complete: true,
        current_step_order: workflow.current_step_order,
      });

      await this.db.query(
        'UPDATE requests SET status = $1, current_step = NULL WHERE id = $2',
        [RequestStatus.APPROVED, workflow.request_id]
      );
    }

    return this.mapRowToApproval(approval);
  }

  /**
   * Reject current workflow step
   * Stops workflow and updates request status
   */
  async rejectStep(
    workflowId: string,
    approverId: string,
    digitalSignature: string,
    rejectionReason: string,
    location?: string
  ): Promise<Approval> {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    const workflow = await this.db.queryOne<any>(
      'SELECT * FROM workflows WHERE id = $1',
      [workflowId]
    );

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (workflow.is_complete) {
      throw new Error('Workflow already complete');
    }

    // Get approver details
    const approver = await this.db.queryOne<any>(
      'SELECT id, role, company_id FROM users WHERE id = $1',
      [approverId]
    );

    if (!approver) {
      throw new Error('Approver not found');
    }

    if (approver.company_id !== workflow.company_id) {
      throw new Error('Approver must belong to same company');
    }

    // Get current step
    const config = await this.getWorkflowConfig(workflow.company_id);
    const currentStep = config.steps.find((s) => s.order === workflow.current_step_order);

    if (!currentStep) {
      throw new Error('Invalid workflow step');
    }

    // Verify approver role
    if (approver.role !== currentStep.role) {
      throw new Error(
        `Current step requires ${currentStep.role}, but approver is ${approver.role}`
      );
    }

    // Create rejection record
    const approval = await this.db.insert<any>('approvals', {
      id: uuidv4(),
      workflow_id: workflowId,
      request_id: workflow.request_id,
      approver_id: approverId,
      step_order: workflow.current_step_order,
      step_role: currentStep.role,
      status: 'REJECTED',
      rejection_reason: rejectionReason,
      additional_data: null,
      digital_signature: digitalSignature,
      location: location || null,
    });

    // Mark workflow as complete (stopped due to rejection)
    await this.db.update('workflows', workflowId, {
      is_complete: true,
    });

    // Update request status to rejected
    await this.db.query(
      'UPDATE requests SET status = $1, current_step = NULL WHERE id = $2',
      [RequestStatus.REJECTED, workflow.request_id]
    );

    return this.mapRowToApproval(approval);
  }

  /**
   * Get current approver role and step for workflow
   */
  async getCurrentApprover(
    workflowId: string
  ): Promise<{ role: UserRole; stepOrder: number } | null> {
    const workflow = await this.db.queryOne<any>(
      'SELECT * FROM workflows WHERE id = $1',
      [workflowId]
    );

    if (!workflow || workflow.is_complete) {
      return null;
    }

    const config = await this.getWorkflowConfig(workflow.company_id);
    const currentStep = config.steps.find((s) => s.order === workflow.current_step_order);

    if (!currentStep) {
      return null;
    }

    return {
      role: currentStep.role,
      stepOrder: workflow.current_step_order,
    };
  }

  /**
   * Check if workflow is complete
   */
  async isWorkflowComplete(workflowId: string): Promise<boolean> {
    const workflow = await this.db.queryOne<any>(
      'SELECT is_complete FROM workflows WHERE id = $1',
      [workflowId]
    );

    return workflow?.is_complete || false;
  }

  /**
   * Get approval history for a request with approver details
   */
  async getApprovalHistory(requestId: string): Promise<any[]> {
    const rows = await this.db.query<any>(
      `SELECT
        a.*,
        u.id as approver_user_id,
        u.first_name as approver_first_name,
        u.last_name as approver_last_name,
        u.email as approver_email,
        u.role as approver_role,
        u.department_id as approver_department_id,
        d.name as approver_department_name
      FROM approvals a
      LEFT JOIN users u ON a.approver_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE a.request_id = $1
      ORDER BY a.step_order ASC`,
      [requestId]
    );

    return rows.map((row) => ({
      ...this.mapRowToApproval(row),
      approver: {
        id: row.approver_user_id,
        firstName: row.approver_first_name,
        lastName: row.approver_last_name,
        email: row.approver_email,
        role: row.approver_role,
        departmentId: row.approver_department_id,
        departmentName: row.approver_department_name,
      },
    }));
  }

  /**
   * Get workflow configuration for company
   * Default configuration: Manager → Contrôleur → Direction → Économe
   */
  async getWorkflowConfig(companyId: string): Promise<WorkflowConfig> {
    // For now, return default config
    // In future, this could be customized per company in database
    return {
      companyId,
      steps: [
        {
          order: 1,
          role: UserRole.MANAGER,
          label: 'Manager Approval',
          requiresAdditionalInfo: false,
        },
        {
          order: 2,
          role: UserRole.CONTROLEUR,
          label: 'Contrôleur Review',
          requiresAdditionalInfo: true, // Must add daily cost
        },
        {
          order: 3,
          role: UserRole.DIRECTION,
          label: 'Direction Authorization',
          requiresAdditionalInfo: false,
        },
        {
          order: 4,
          role: UserRole.ECONOME,
          label: 'Économe Release',
          requiresAdditionalInfo: false,
        },
      ],
    };
  }

  /**
   * Map database row to Workflow object
   */
  private mapRowToWorkflow(row: any): Workflow {
    return {
      id: row.id,
      requestId: row.request_id,
      companyId: row.company_id,
      currentStepOrder: row.current_step_order,
      isComplete: row.is_complete,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Map database row to Approval object
   */
  private mapRowToApproval(row: any): Approval {
    // Parse additional_data if it's a JSON string
    let additionalData = row.additional_data;
    if (typeof additionalData === 'string') {
      try {
        additionalData = JSON.parse(additionalData);
      } catch (e) {
        additionalData = null;
      }
    }

    return {
      id: row.id,
      workflowId: row.workflow_id,
      requestId: row.request_id,
      approverId: row.approver_id,
      stepOrder: row.step_order,
      stepRole: row.step_role as UserRole,
      status: row.status as 'APPROVED' | 'REJECTED',
      rejectionReason: row.rejection_reason,
      additionalData: additionalData || null,
      digitalSignature: row.digital_signature,
      timestamp: new Date(row.timestamp),
      location: row.location,
    };
  }
}

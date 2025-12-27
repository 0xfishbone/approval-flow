/**
 * WorkflowCore Tests
 * Run with: npm test
 */

import { WorkflowCore } from './workflow.core';
import { DatabaseWrapper } from '../../platform';
import { UserRole } from './workflow.types';

describe('WorkflowCore', () => {
  let workflowCore: WorkflowCore;
  let mockDb: jest.Mocked<DatabaseWrapper>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      queryOne: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn(),
    } as any;

    workflowCore = new WorkflowCore(mockDb);
  });

  describe('createWorkflow', () => {
    it('should create workflow starting at Manager for Staff request', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 1,
        is_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.insert.mockResolvedValue(mockWorkflow);
      mockDb.query.mockResolvedValue([]);

      const result = await workflowCore.createWorkflow(
        'req-123',
        'company-123',
        UserRole.STAFF
      );

      expect(mockDb.insert).toHaveBeenCalledWith(
        'workflows',
        expect.objectContaining({
          request_id: 'req-123',
          company_id: 'company-123',
          current_step_order: 1, // Manager step
          is_complete: false,
        })
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE requests SET current_step = $1 WHERE id = $2',
        [UserRole.MANAGER, 'req-123']
      );

      expect(result.requestId).toBe('req-123');
    });

    it('should create workflow starting at Contrôleur for Manager request (skip logic)', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 2,
        is_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.insert.mockResolvedValue(mockWorkflow);
      mockDb.query.mockResolvedValue([]);

      const result = await workflowCore.createWorkflow(
        'req-123',
        'company-123',
        UserRole.MANAGER
      );

      expect(mockDb.insert).toHaveBeenCalledWith(
        'workflows',
        expect.objectContaining({
          current_step_order: 2, // Contrôleur step (skip Manager)
        })
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE requests SET current_step = $1 WHERE id = $2',
        [UserRole.CONTROLEUR, 'req-123']
      );
    });
  });

  describe('approveStep', () => {
    it('should approve step and advance to next step', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 1,
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.MANAGER,
        company_id: 'company-123',
      };

      const mockApproval = {
        id: 'approval-123',
        workflow_id: 'workflow-123',
        request_id: 'req-123',
        approver_id: 'approver-123',
        step_order: 1,
        step_role: UserRole.MANAGER,
        status: 'APPROVED',
        rejection_reason: null,
        additional_data: null,
        digital_signature: 'signature-hash',
        location: null,
        timestamp: new Date(),
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow) // getWorkflow
        .mockResolvedValueOnce(mockApprover); // getApprover

      mockDb.insert.mockResolvedValue(mockApproval);
      mockDb.update.mockResolvedValue(undefined);
      mockDb.query.mockResolvedValue([]);

      const result = await workflowCore.approveStep(
        'workflow-123',
        'approver-123',
        'signature-hash'
      );

      expect(mockDb.insert).toHaveBeenCalledWith(
        'approvals',
        expect.objectContaining({
          workflow_id: 'workflow-123',
          approver_id: 'approver-123',
          step_role: UserRole.MANAGER,
          status: 'APPROVED',
        })
      );

      // Should advance to next step (Contrôleur)
      expect(mockDb.update).toHaveBeenCalledWith('workflows', 'workflow-123', {
        current_step_order: 2,
      });

      expect(result.status).toBe('APPROVED');
    });

    it('should throw error if approver role does not match current step', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 1, // Manager step
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.CONTROLEUR, // Wrong role
        company_id: 'company-123',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockApprover);

      await expect(
        workflowCore.approveStep('workflow-123', 'approver-123', 'signature-hash')
      ).rejects.toThrow('Current step requires MANAGER, but approver is CONTROLEUR');
    });

    it('should throw error if Contrôleur does not provide daily cost', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 2, // Contrôleur step
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.CONTROLEUR,
        company_id: 'company-123',
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockApprover);

      await expect(
        workflowCore.approveStep(
          'workflow-123',
          'approver-123',
          'signature-hash'
          // No additionalData with dailyCost
        )
      ).rejects.toThrow('Contrôleur must add daily cost (dailyCost)');
    });

    it('should accept approval with daily cost from Contrôleur', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 2, // Contrôleur step
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.CONTROLEUR,
        company_id: 'company-123',
      };

      const mockApproval = {
        id: 'approval-123',
        workflow_id: 'workflow-123',
        request_id: 'req-123',
        approver_id: 'approver-123',
        step_order: 2,
        step_role: UserRole.CONTROLEUR,
        status: 'APPROVED',
        rejection_reason: null,
        additional_data: JSON.stringify({ dailyCost: 150.0 }),
        digital_signature: 'signature-hash',
        location: null,
        timestamp: new Date(),
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockApprover);

      mockDb.insert.mockResolvedValue(mockApproval);
      mockDb.update.mockResolvedValue(undefined);
      mockDb.query.mockResolvedValue([]);

      const result = await workflowCore.approveStep(
        'workflow-123',
        'approver-123',
        'signature-hash',
        { dailyCost: 150.0 }
      );

      expect(result.status).toBe('APPROVED');
      expect(result.stepRole).toBe(UserRole.CONTROLEUR);
    });

    it('should complete workflow after final approval (Économe)', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 4, // Économe step (final)
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.ECONOME,
        company_id: 'company-123',
      };

      const mockApproval = {
        id: 'approval-123',
        workflow_id: 'workflow-123',
        request_id: 'req-123',
        approver_id: 'approver-123',
        step_order: 4,
        step_role: UserRole.ECONOME,
        status: 'APPROVED',
        rejection_reason: null,
        additional_data: null,
        digital_signature: 'signature-hash',
        location: null,
        timestamp: new Date(),
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockApprover);

      mockDb.insert.mockResolvedValue(mockApproval);
      mockDb.update.mockResolvedValue(undefined);
      mockDb.query.mockResolvedValue([]);

      await workflowCore.approveStep('workflow-123', 'approver-123', 'signature-hash');

      // Should mark workflow as complete
      expect(mockDb.update).toHaveBeenCalledWith('workflows', 'workflow-123', {
        is_complete: true,
        current_step_order: 4,
      });

      // Should mark request as APPROVED
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE requests SET status = $1, current_step = NULL WHERE id = $2',
        ['APPROVED', 'req-123']
      );
    });

    it('should throw error if workflow already complete', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 4,
        is_complete: true, // Already complete
      };

      mockDb.queryOne.mockResolvedValueOnce(mockWorkflow);

      await expect(
        workflowCore.approveStep('workflow-123', 'approver-123', 'signature-hash')
      ).rejects.toThrow('Workflow already complete');
    });
  });

  describe('rejectStep', () => {
    it('should reject step and stop workflow', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 1,
        is_complete: false,
      };

      const mockApprover = {
        id: 'approver-123',
        role: UserRole.MANAGER,
        company_id: 'company-123',
      };

      const mockRejection = {
        id: 'approval-123',
        workflow_id: 'workflow-123',
        request_id: 'req-123',
        approver_id: 'approver-123',
        step_order: 1,
        step_role: UserRole.MANAGER,
        status: 'REJECTED',
        rejection_reason: 'Budget exceeded',
        additional_data: null,
        digital_signature: 'signature-hash',
        location: null,
        timestamp: new Date(),
      };

      mockDb.queryOne
        .mockResolvedValueOnce(mockWorkflow)
        .mockResolvedValueOnce(mockApprover);

      mockDb.insert.mockResolvedValue(mockRejection);
      mockDb.update.mockResolvedValue(undefined);
      mockDb.query.mockResolvedValue([]);

      const result = await workflowCore.rejectStep(
        'workflow-123',
        'approver-123',
        'signature-hash',
        'Budget exceeded'
      );

      expect(mockDb.insert).toHaveBeenCalledWith(
        'approvals',
        expect.objectContaining({
          status: 'REJECTED',
          rejection_reason: 'Budget exceeded',
        })
      );

      // Should mark workflow as complete
      expect(mockDb.update).toHaveBeenCalledWith('workflows', 'workflow-123', {
        is_complete: true,
      });

      // Should mark request as REJECTED
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE requests SET status = $1, current_step = NULL WHERE id = $2',
        ['REJECTED', 'req-123']
      );

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Budget exceeded');
    });

    it('should throw error if rejection reason is empty', async () => {
      await expect(
        workflowCore.rejectStep('workflow-123', 'approver-123', 'signature-hash', '')
      ).rejects.toThrow('Rejection reason is required');
    });
  });

  describe('getCurrentApprover', () => {
    it('should return current approver role and step order', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 2,
        is_complete: false,
      };

      mockDb.queryOne.mockResolvedValue(mockWorkflow);

      const result = await workflowCore.getCurrentApprover('workflow-123');

      expect(result).toEqual({
        role: UserRole.CONTROLEUR,
        stepOrder: 2,
      });
    });

    it('should return null if workflow is complete', async () => {
      const mockWorkflow = {
        id: 'workflow-123',
        request_id: 'req-123',
        company_id: 'company-123',
        current_step_order: 4,
        is_complete: true,
      };

      mockDb.queryOne.mockResolvedValue(mockWorkflow);

      const result = await workflowCore.getCurrentApprover('workflow-123');

      expect(result).toBeNull();
    });
  });

  describe('getApprovalHistory', () => {
    it('should return all approvals in order', async () => {
      const mockApprovals = [
        {
          id: 'approval-1',
          workflow_id: 'workflow-123',
          request_id: 'req-123',
          approver_id: 'manager-123',
          step_order: 1,
          step_role: UserRole.MANAGER,
          status: 'APPROVED',
          rejection_reason: null,
          additional_data: null,
          digital_signature: 'sig-1',
          location: null,
          timestamp: new Date('2024-12-22T10:00:00Z'),
        },
        {
          id: 'approval-2',
          workflow_id: 'workflow-123',
          request_id: 'req-123',
          approver_id: 'controleur-123',
          step_order: 2,
          step_role: UserRole.CONTROLEUR,
          status: 'APPROVED',
          rejection_reason: null,
          additional_data: { dailyCost: 100 },
          digital_signature: 'sig-2',
          location: null,
          timestamp: new Date('2024-12-22T11:00:00Z'),
        },
      ];

      mockDb.query.mockResolvedValue(mockApprovals);

      const result = await workflowCore.getApprovalHistory('req-123');

      expect(result).toHaveLength(2);
      expect(result[0].stepRole).toBe(UserRole.MANAGER);
      expect(result[1].stepRole).toBe(UserRole.CONTROLEUR);
    });
  });
});

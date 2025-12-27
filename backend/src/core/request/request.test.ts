/**
 * RequestCore Tests
 * Run with: npm test
 */

import { RequestCore } from './request.core';
import { DatabaseWrapper } from '../../platform';
import { RequestStatus, WorkflowStep } from './request.types';
import { UserRole } from '../../shared/types';

describe('RequestCore', () => {
  let requestCore: RequestCore;
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

    requestCore = new RequestCore(mockDb);
  });

  describe('createRequest', () => {
    it('should create a request with auto-generated request number', async () => {
      const creatorData = {
        id: 'user-123',
        company_id: 'company-123',
        role: UserRole.STAFF,
      };

      const departmentData = {
        id: 'dept-123',
        company_id: 'company-123',
      };

      const mockRequest = {
        id: 'req-123',
        request_number: 'REQ-20241222-0001',
        creator_id: 'user-123',
        department_id: 'dept-123',
        company_id: 'company-123',
        status: RequestStatus.PENDING,
        current_step: null,
        items: JSON.stringify([
          { description: 'Office supplies', quantity: 10, unit: 'boxes' },
        ]),
        notes: 'Urgent request',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne
        .mockResolvedValueOnce(creatorData) // First call: get creator
        .mockResolvedValueOnce(departmentData); // Second call: get department

      mockDb.insert.mockResolvedValue(mockRequest);

      const result = await requestCore.createRequest('user-123', {
        departmentId: 'dept-123',
        items: [{ description: 'Office supplies', quantity: 10, unit: 'boxes' }],
        notes: 'Urgent request',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT company_id, role FROM users WHERE id = $1',
        ['user-123']
      );

      expect(mockDb.insert).toHaveBeenCalledWith(
        'requests',
        expect.objectContaining({
          creator_id: 'user-123',
          department_id: 'dept-123',
          company_id: 'company-123',
          status: RequestStatus.PENDING,
        })
      );

      expect(result.requestNumber).toBe('REQ-20241222-0001');
      expect(result.items).toHaveLength(1);
      expect(result.status).toBe(RequestStatus.PENDING);
    });

    it('should throw error if creator not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(
        requestCore.createRequest('invalid-user', {
          departmentId: 'dept-123',
          items: [{ description: 'Test', quantity: 1 }],
        })
      ).rejects.toThrow('Creator not found');
    });

    it('should throw error if department not found', async () => {
      const creatorData = {
        id: 'user-123',
        company_id: 'company-123',
        role: UserRole.STAFF,
      };

      mockDb.queryOne
        .mockResolvedValueOnce(creatorData) // First call: get creator
        .mockResolvedValueOnce(null); // Second call: department not found

      await expect(
        requestCore.createRequest('user-123', {
          departmentId: 'invalid-dept',
          items: [{ description: 'Test', quantity: 1 }],
        })
      ).rejects.toThrow('Department not found');
    });

    it('should throw error if department does not belong to creator company', async () => {
      const creatorData = {
        id: 'user-123',
        company_id: 'company-123',
        role: UserRole.STAFF,
      };

      const departmentData = {
        id: 'dept-123',
        company_id: 'company-456', // Different company
      };

      mockDb.queryOne
        .mockResolvedValueOnce(creatorData)
        .mockResolvedValueOnce(departmentData);

      await expect(
        requestCore.createRequest('user-123', {
          departmentId: 'dept-123',
          items: [{ description: 'Test', quantity: 1 }],
        })
      ).rejects.toThrow('Department does not belong to creator company');
    });
  });

  describe('getRequestById', () => {
    it('should return request by ID', async () => {
      const mockRequest = {
        id: 'req-123',
        request_number: 'REQ-20241222-0001',
        creator_id: 'user-123',
        department_id: 'dept-123',
        company_id: 'company-123',
        status: RequestStatus.PENDING,
        current_step: WorkflowStep.MANAGER,
        items: [{ description: 'Test item', quantity: 5 }],
        notes: 'Test notes',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(mockRequest);

      const result = await requestCore.getRequestById('req-123');

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM requests WHERE id = $1',
        ['req-123']
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('req-123');
      expect(result?.items).toHaveLength(1);
    });

    it('should return null if request not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await requestCore.getRequestById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getRequestsByDepartment', () => {
    it('should return all requests for a department', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          request_number: 'REQ-20241222-0001',
          creator_id: 'user-1',
          department_id: 'dept-123',
          company_id: 'company-123',
          status: RequestStatus.PENDING,
          current_step: WorkflowStep.MANAGER,
          items: [{ description: 'Item 1', quantity: 1 }],
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'req-2',
          request_number: 'REQ-20241222-0002',
          creator_id: 'user-2',
          department_id: 'dept-123',
          company_id: 'company-123',
          status: RequestStatus.APPROVED,
          current_step: null,
          items: [{ description: 'Item 2', quantity: 2 }],
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue(mockRequests);

      const result = await requestCore.getRequestsByDepartment('dept-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM requests WHERE department_id = $1 ORDER BY created_at DESC',
        ['dept-123']
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('req-1');
      expect(result[1].id).toBe('req-2');
    });
  });

  describe('getRequestsByCreator', () => {
    it('should return all requests by a specific creator', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          request_number: 'REQ-20241222-0001',
          creator_id: 'user-123',
          department_id: 'dept-123',
          company_id: 'company-123',
          status: RequestStatus.PENDING,
          current_step: WorkflowStep.MANAGER,
          items: [{ description: 'Item 1', quantity: 1 }],
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue(mockRequests);

      const result = await requestCore.getRequestsByCreator('user-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM requests WHERE creator_id = $1 ORDER BY created_at DESC',
        ['user-123']
      );
      expect(result).toHaveLength(1);
      expect(result[0].creatorId).toBe('user-123');
    });
  });

  describe('getPendingRequestsForApprover', () => {
    it('should return pending requests for a specific workflow step', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          request_number: 'REQ-20241222-0001',
          creator_id: 'user-123',
          department_id: 'dept-123',
          company_id: 'company-123',
          status: RequestStatus.PENDING,
          current_step: WorkflowStep.CONTROLEUR,
          items: [{ description: 'Item 1', quantity: 1 }],
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValue(mockRequests);

      const result = await requestCore.getPendingRequestsForApprover(
        'company-123',
        WorkflowStep.CONTROLEUR
      );

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE company_id = $1'),
        ['company-123', RequestStatus.PENDING, WorkflowStep.CONTROLEUR]
      );
      expect(result).toHaveLength(1);
      expect(result[0].currentStep).toBe(WorkflowStep.CONTROLEUR);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status', async () => {
      await requestCore.updateRequestStatus('req-123', RequestStatus.APPROVED);

      expect(mockDb.update).toHaveBeenCalledWith('requests', 'req-123', {
        status: RequestStatus.APPROVED,
      });
    });

    it('should update request status and current step', async () => {
      await requestCore.updateRequestStatus(
        'req-123',
        RequestStatus.PENDING,
        WorkflowStep.DIRECTION
      );

      expect(mockDb.update).toHaveBeenCalledWith('requests', 'req-123', {
        status: RequestStatus.PENDING,
        current_step: WorkflowStep.DIRECTION,
      });
    });
  });

  describe('addAttachment', () => {
    it('should add attachment to request', async () => {
      const mockRequest = {
        id: 'req-123',
        request_number: 'REQ-20241222-0001',
        creator_id: 'user-123',
        department_id: 'dept-123',
        company_id: 'company-123',
        status: RequestStatus.PENDING,
        current_step: WorkflowStep.MANAGER,
        items: [{ description: 'Test', quantity: 1 }],
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockAttachment = {
        id: 'attachment-123',
        request_id: 'req-123',
        file_name: 'document.pdf',
        file_url: 'https://storage.example.com/document.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
        uploaded_by: 'user-123',
        created_at: new Date(),
      };

      mockDb.queryOne.mockResolvedValue(mockRequest);
      mockDb.insert.mockResolvedValue(mockAttachment);

      const result = await requestCore.addAttachment('req-123', 'user-123', {
        fileName: 'document.pdf',
        fileUrl: 'https://storage.example.com/document.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });

      expect(mockDb.insert).toHaveBeenCalledWith(
        'attachments',
        expect.objectContaining({
          request_id: 'req-123',
          file_name: 'document.pdf',
          uploaded_by: 'user-123',
        })
      );
      expect(result.fileName).toBe('document.pdf');
    });

    it('should throw error if request not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(
        requestCore.addAttachment('invalid-req', 'user-123', {
          fileName: 'test.pdf',
          fileUrl: 'https://example.com/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow('Request not found');
    });
  });

  describe('getRequestTimeline', () => {
    it('should return complete timeline with request creation, approvals, and comments', async () => {
      const mockRequest = {
        id: 'req-123',
        request_number: 'REQ-20241222-0001',
        creator_id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.STAFF,
        items: JSON.stringify([{ description: 'Test', quantity: 1 }]),
        created_at: new Date('2024-12-22T10:00:00Z'),
      };

      const mockApprovals = [
        {
          id: 'approval-1',
          request_id: 'req-123',
          approver_id: 'manager-123',
          first_name: 'Jane',
          last_name: 'Manager',
          role: UserRole.MANAGER,
          step_role: WorkflowStep.MANAGER,
          status: 'APPROVED',
          rejection_reason: null,
          additional_data: null,
          timestamp: new Date('2024-12-22T11:00:00Z'),
        },
      ];

      const mockComments = [
        {
          id: 'comment-1',
          request_id: 'req-123',
          user_id: 'user-456',
          first_name: 'Alice',
          last_name: 'Smith',
          role: UserRole.CONTROLEUR,
          content: 'Looks good',
          via_email: false,
          created_at: new Date('2024-12-22T12:00:00Z'),
        },
      ];

      mockDb.queryOne.mockResolvedValue(mockRequest);
      mockDb.query
        .mockResolvedValueOnce(mockApprovals) // First call: approvals
        .mockResolvedValueOnce(mockComments); // Second call: comments

      const timeline = await requestCore.getRequestTimeline('req-123');

      expect(timeline).toHaveLength(3); // Creation + 1 approval + 1 comment
      expect(timeline[0].type).toBe('created');
      expect(timeline[0].actor.name).toBe('John Doe');
      expect(timeline[1].type).toBe('approved');
      expect(timeline[1].actor.name).toBe('Jane Manager');
      expect(timeline[2].type).toBe('comment');
      expect(timeline[2].actor.name).toBe('Alice Smith');
    });

    it('should throw error if request not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(requestCore.getRequestTimeline('invalid-req')).rejects.toThrow(
        'Request not found'
      );
    });
  });
});

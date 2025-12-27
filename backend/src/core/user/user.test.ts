/**
 * UserCore Tests
 * Run with: npm test
 */

import { UserCore } from './user.core';
import { DatabaseWrapper } from '../../platform';
import { UserRole, Action } from './user.types';

describe('UserCore', () => {
  let userCore: UserCore;
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

    userCore = new UserCore(mockDb, {
      jwtSecret: 'test-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtExpiresIn: '15m',
      jwtRefreshExpiresIn: '7d',
      bcryptRounds: 10,
    });
  });

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.STAFF,
        company_id: 'company-123',
        department_id: 'dept-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDb.insert.mockResolvedValue(mockUser);

      const result = await userCore.createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.STAFF,
        companyId: 'company-123',
        departmentId: 'dept-123',
      });

      expect(mockDb.insert).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        })
      );
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('validatePermission', () => {
    it('should allow STAFF to create requests', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'user-123',
        role: UserRole.STAFF,
        email: 'staff@example.com',
        first_name: 'Staff',
        last_name: 'User',
        company_id: 'company-123',
        department_id: 'dept-123',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const canCreate = await userCore.validatePermission('user-123', Action.CREATE_REQUEST);
      expect(canCreate).toBe(true);
    });

    it('should not allow STAFF to approve requests', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'user-123',
        role: UserRole.STAFF,
        email: 'staff@example.com',
        first_name: 'Staff',
        last_name: 'User',
        company_id: 'company-123',
        department_id: 'dept-123',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const canApprove = await userCore.validatePermission('user-123', Action.APPROVE_REQUEST);
      expect(canApprove).toBe(false);
    });

    it('should allow MANAGER to approve requests', async () => {
      mockDb.queryOne.mockResolvedValue({
        id: 'user-123',
        role: UserRole.MANAGER,
        email: 'manager@example.com',
        first_name: 'Manager',
        last_name: 'User',
        company_id: 'company-123',
        department_id: 'dept-123',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const canApprove = await userCore.validatePermission('user-123', Action.APPROVE_REQUEST);
      expect(canApprove).toBe(true);
    });
  });
});

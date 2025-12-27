/**
 * UserCore Types
 */

import { User, UserRole, Action, UserInput, AuthToken } from '../../shared/types';

export { User, UserRole, Action, UserInput, AuthToken };

export interface UserCoreInterface {
  createUser(data: UserInput): Promise<User>;
  authenticateUser(email: string, password: string): Promise<AuthToken>;
  getUserById(id: string): Promise<User | null>;
  getUsersByDepartment(departmentId: string): Promise<User[]>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  validatePermission(userId: string, action: Action): Promise<boolean>;
  getApproverForRole(role: UserRole, companyId: string): Promise<User | null>;
  setUserSignature(id: string, signatureUrl: string): Promise<void>;
  refreshAccessToken(refreshToken: string): Promise<AuthToken>;
}

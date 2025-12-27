/**
 * UserCore - Authentication, roles, permissions, profiles
 * ~200 lines
 * Foundational module - called by most, never calls others
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseWrapper } from '../../platform';
import { UserCoreInterface, User, UserRole, Action, UserInput, AuthToken } from './user.types';

export class UserCore implements UserCoreInterface {
  private db: DatabaseWrapper;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;
  private bcryptRounds: number;

  constructor(
    db: DatabaseWrapper,
    config: {
      jwtSecret: string;
      jwtRefreshSecret: string;
      jwtExpiresIn?: string;
      jwtRefreshExpiresIn?: string;
      bcryptRounds?: number;
    }
  ) {
    this.db = db;
    this.jwtSecret = config.jwtSecret;
    this.jwtRefreshSecret = config.jwtRefreshSecret;
    this.jwtExpiresIn = config.jwtExpiresIn || '15m';
    this.jwtRefreshExpiresIn = config.jwtRefreshExpiresIn || '7d';
    this.bcryptRounds = config.bcryptRounds || 12;
  }

  async createUser(data: UserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, this.bcryptRounds);

    const user = await this.db.insert<User>('users', {
      id: uuidv4(),
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: data.firstName,
      last_name: data.lastName,
      role: data.role,
      department_id: data.departmentId || null,
      company_id: data.companyId,
      is_active: true,
    });

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user as any;
    return userWithoutPassword;
  }

  async authenticateUser(email: string, password: string): Promise<AuthToken> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (!row) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, row.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [row.id]
    );

    const user: User = this.mapRowToUser(row);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.jwtRefreshSecret,
      { expiresIn: this.jwtRefreshExpiresIn } as jwt.SignOptions
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert('refresh_tokens', {
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken, user };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthToken> {
    // Verify refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token exists in DB
    const tokenRow = await this.db.queryOne<any>(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken]
    );

    if (!tokenRow) {
      throw new Error('Refresh token expired or invalid');
    }

    // Get user
    const user = await this.getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken, user };
  }

  async getUserById(id: string): Promise<User | null> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    return row ? this.mapRowToUser(row) : null;
  }

  async getUsersByDepartment(departmentId: string): Promise<User[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM users WHERE department_id = $1 AND is_active = true ORDER BY first_name',
      [departmentId]
    );

    return rows.map(this.mapRowToUser);
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    const rows = await this.db.query<any>(
      'SELECT * FROM users WHERE company_id = $1 AND is_active = true ORDER BY first_name',
      [companyId]
    );

    return rows.map(this.mapRowToUser);
  }

  async validatePermission(userId: string, action: Action): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;

    // Permission matrix based on product brief
    const permissions: Record<UserRole, Action[]> = {
      [UserRole.STAFF]: [Action.CREATE_REQUEST, Action.VIEW_REQUEST, Action.ADD_COMMENT],
      [UserRole.MANAGER]: [
        Action.CREATE_REQUEST,
        Action.VIEW_REQUEST,
        Action.APPROVE_REQUEST,
        Action.REJECT_REQUEST,
        Action.ADD_COMMENT,
        Action.VIEW_DEPARTMENT,
      ],
      [UserRole.CONTROLEUR]: [
        Action.VIEW_REQUEST,
        Action.APPROVE_REQUEST,
        Action.REJECT_REQUEST,
        Action.ADD_COMMENT,
        Action.VIEW_COMPANY,
      ],
      [UserRole.DIRECTION]: [
        Action.VIEW_REQUEST,
        Action.APPROVE_REQUEST,
        Action.REJECT_REQUEST,
        Action.ADD_COMMENT,
        Action.VIEW_COMPANY,
      ],
      [UserRole.ECONOME]: [
        Action.VIEW_REQUEST,
        Action.APPROVE_REQUEST,
        Action.REJECT_REQUEST,
        Action.ADD_COMMENT,
        Action.VIEW_COMPANY,
      ],
    };

    return permissions[user.role]?.includes(action) || false;
  }

  async getApproverForRole(role: UserRole, companyId: string): Promise<User | null> {
    const row = await this.db.queryOne<any>(
      'SELECT * FROM users WHERE role = $1 AND company_id = $2 AND is_active = true LIMIT 1',
      [role, companyId]
    );

    return row ? this.mapRowToUser(row) : null;
  }

  async setUserSignature(id: string, signatureUrl: string): Promise<void> {
    await this.db.update('users', id, {
      visual_signature_url: signatureUrl,
    });
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role as UserRole,
      departmentId: row.department_id,
      companyId: row.company_id,
      visualSignatureUrl: row.visual_signature_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

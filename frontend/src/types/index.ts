/**
 * Frontend Type Definitions
 * Matches backend API responses
 */

export enum UserRole {
  STAFF = 'STAFF',
  MANAGER = 'MANAGER',
  CONTROLEUR = 'CONTROLEUR',
  DIRECTION = 'DIRECTION',
  ECONOME = 'ECONOME',
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  APPROVAL_NEEDED = 'APPROVAL_NEEDED',
  APPROVAL_COMPLETED = 'APPROVAL_COMPLETED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
}

export interface RequestItem {
  description: string;
  quantity: number;
  unit?: string;
  estimatedCost?: number;
}

export interface Request {
  id: string;
  requestNumber: string;
  creatorId: string;
  departmentId: string;
  status: RequestStatus;
  items: RequestItem[];
  notes?: string;
  attachmentUrls?: string[];
  urgency?: 'flexible' | 'normal' | 'urgent';
  category?: 'alimentation' | 'equipement' | 'fournitures' | 'services' | 'autre';
  neededByDate?: Date;
  currentStep?: UserRole | null;
  createdAt: Date;
  updatedAt: Date;
  // Enriched data from backend
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    departmentId?: string;
    departmentName?: string;
  };
}

export interface Approval {
  id: string;
  requestId: string;
  approverId: string;
  stepOrder: number;
  status: ApprovalStatus;
  digitalSignature?: string;
  visualSignatureUrl?: string;
  biometricMetadata?: Record<string, unknown>;
  comments?: string;
  timestamp?: Date;
  additionalData?: {
    dailyCost?: number;
    notes?: string;
    [key: string]: any;
  };
  // Enriched data from backend
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    departmentId?: string;
    departmentName?: string;
  };
}

export interface Workflow {
  id: string;
  requestId: string;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  requestId: string;
  userId: string;
  user: User;
  content: string;
  viaEmail: boolean;
  emailSent: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  requestId?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Document {
  id: string;
  requestId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  generatedBy?: string;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'approved' | 'rejected' | 'commented' | 'completed';
  user: {
    name: string;
    role: UserRole;
  };
  timestamp: Date;
  message: string;
  metadata?: Record<string, unknown>;
}

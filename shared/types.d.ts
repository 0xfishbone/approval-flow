/**
 * Shared TypeScript Types for ApprovalFlow
 * Used across backend and frontend
 */
export declare enum UserRole {
    STAFF = "STAFF",
    MANAGER = "MANAGER",
    CONTROLEUR = "CONTROLEUR",
    DIRECTION = "DIRECTION",
    ECONOME = "ECONOME"
}
export type UserCategory = 'REQUESTER' | 'APPROVER';
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    departmentId: string | null;
    companyId: string;
    visualSignatureUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthToken {
    accessToken: string;
    refreshToken: string;
    user: User;
}
export interface UserInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    departmentId?: string;
    companyId: string;
}
export interface Company {
    id: string;
    name: string;
    logo: string | null;
    createdAt: Date;
}
export interface Department {
    id: string;
    name: string;
    companyId: string;
    createdAt: Date;
}
export declare enum RequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export declare enum WorkflowStep {
    MANAGER = "MANAGER",
    CONTROLEUR = "CONTROLEUR",
    DIRECTION = "DIRECTION",
    ECONOME = "ECONOME"
}
export interface RequestItem {
    description: string;
    quantity: number;
    unit?: string;
}
export interface Request {
    id: string;
    requestNumber: string;
    creatorId: string;
    departmentId: string;
    companyId: string;
    status: RequestStatus;
    currentStep: WorkflowStep | null;
    items: RequestItem[];
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface RequestInput {
    departmentId: string;
    items: RequestItem[];
    notes?: string;
}
export interface Attachment {
    id: string;
    requestId: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    createdAt: Date;
}
export interface Workflow {
    id: string;
    requestId: string;
    companyId: string;
    currentStepOrder: number;
    isComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStepConfig {
    order: number;
    role: UserRole;
    label: string;
    requiresAdditionalInfo: boolean;
}
export interface WorkflowConfig {
    companyId: string;
    steps: WorkflowStepConfig[];
}
export interface ApprovalData {
    dailyCost?: number;
    notes?: string;
    [key: string]: any;
}
export interface Approval {
    id: string;
    workflowId: string;
    requestId: string;
    approverId: string;
    stepOrder: number;
    stepRole: UserRole;
    status: 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    additionalData: ApprovalData | null;
    digitalSignature: string;
    timestamp: Date;
    location: string | null;
}
export interface Signature {
    id: string;
    userId: string;
    imageData: Buffer;
    imageUrl: string;
    createdAt: Date;
}
export interface DigitalSignature {
    id: string;
    userId: string;
    requestId: string;
    signature: string;
    algorithm: string;
    timestamp: Date;
    metadata: SignatureMetadata;
}
export interface SignatureMetadata {
    deviceInfo: string;
    ipAddress: string;
    location: string | null;
    biometricUsed: boolean;
}
export interface VerificationResult {
    isValid: boolean;
    signedBy: string;
    timestamp: Date;
    tamperedWith: boolean;
}
export interface Comment {
    id: string;
    requestId: string;
    userId: string;
    content: string;
    viaEmail: boolean;
    createdAt: Date;
}
export interface InboundEmail {
    from: string;
    to: string;
    subject: string;
    body: string;
    html: string;
    messageId: string;
    receivedAt: Date;
}
export interface ParsedComment {
    requestId: string;
    userEmail: string;
    content: string;
}
export declare enum NotificationType {
    APPROVAL_NEEDED = "APPROVAL_NEEDED",
    APPROVAL_COMPLETED = "APPROVAL_COMPLETED",
    REQUEST_REJECTED = "REQUEST_REJECTED",
    COMMENT_ADDED = "COMMENT_ADDED",
    WORKFLOW_COMPLETED = "WORKFLOW_COMPLETED"
}
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    requestId: string | null;
    isRead: boolean;
    createdAt: Date;
}
export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, any>;
    imageUrl?: string;
}
export interface Document {
    id: string;
    requestId: string;
    documentType: 'PDF' | 'ATTACHMENT';
    fileName: string;
    fileUrl: string;
    fileSize: number;
    generatedBy: string | null;
    createdAt: Date;
}
export interface DocumentTemplate {
    id: string;
    companyId: string;
    templateType: string;
    headerLogoUrl: string | null;
    footerText: string | null;
    configuration: Record<string, any>;
}
export interface SignedStep {
    role: UserRole;
    approverName: string;
    visualSignatureUrl: string;
    timestamp: Date;
    additionalData: ApprovalData | null;
}
export declare enum AuditAction {
    REQUEST_CREATED = "REQUEST_CREATED",
    REQUEST_APPROVED = "REQUEST_APPROVED",
    REQUEST_REJECTED = "REQUEST_REJECTED",
    COMMENT_ADDED = "COMMENT_ADDED",
    ATTACHMENT_UPLOADED = "ATTACHMENT_UPLOADED",
    SIGNATURE_CAPTURED = "SIGNATURE_CAPTURED",
    PDF_GENERATED = "PDF_GENERATED",
    USER_LOGIN = "USER_LOGIN",
    USER_CREATED = "USER_CREATED"
}
export interface AuditEntry {
    id: string;
    requestId: string | null;
    userId: string;
    action: AuditAction;
    metadata: Record<string, any>;
    checksum: string;
    timestamp: Date;
}
export interface AuditReport {
    requestId: string;
    entries: AuditEntry[];
    integrityVerified: boolean;
    generatedAt: Date;
}
export interface IntegrityResult {
    isValid: boolean;
    corruptedEntries: string[];
    lastVerifiedEntry: string | null;
}
export interface TimelineEntry {
    id: string;
    timestamp: Date;
    type: 'created' | 'approved' | 'rejected' | 'comment' | 'completed';
    actor: {
        id: string;
        name: string;
        role: UserRole;
    };
    description: string;
    metadata?: Record<string, any>;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: Date;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare enum Action {
    CREATE_REQUEST = "CREATE_REQUEST",
    VIEW_REQUEST = "VIEW_REQUEST",
    APPROVE_REQUEST = "APPROVE_REQUEST",
    REJECT_REQUEST = "REJECT_REQUEST",
    ADD_COMMENT = "ADD_COMMENT",
    VIEW_DEPARTMENT = "VIEW_DEPARTMENT",
    VIEW_COMPANY = "VIEW_COMPANY"
}
export interface Permission {
    role: UserRole;
    actions: Action[];
    scope: 'DEPARTMENT' | 'COMPANY' | 'OWN';
}
//# sourceMappingURL=types.d.ts.map
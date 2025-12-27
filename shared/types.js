"use strict";
/**
 * Shared TypeScript Types for ApprovalFlow
 * Used across backend and frontend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = exports.AuditAction = exports.NotificationType = exports.WorkflowStep = exports.RequestStatus = exports.UserRole = void 0;
// ============================================================================
// USER & AUTH TYPES
// ============================================================================
var UserRole;
(function (UserRole) {
    UserRole["STAFF"] = "STAFF";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["CONTROLEUR"] = "CONTROLEUR";
    UserRole["DIRECTION"] = "DIRECTION";
    UserRole["ECONOME"] = "ECONOME";
})(UserRole || (exports.UserRole = UserRole = {}));
// ============================================================================
// REQUEST TYPES
// ============================================================================
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
    RequestStatus["COMPLETED"] = "COMPLETED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var WorkflowStep;
(function (WorkflowStep) {
    WorkflowStep["MANAGER"] = "MANAGER";
    WorkflowStep["CONTROLEUR"] = "CONTROLEUR";
    WorkflowStep["DIRECTION"] = "DIRECTION";
    WorkflowStep["ECONOME"] = "ECONOME";
})(WorkflowStep || (exports.WorkflowStep = WorkflowStep = {}));
// ============================================================================
// NOTIFICATION TYPES
// ============================================================================
var NotificationType;
(function (NotificationType) {
    NotificationType["APPROVAL_NEEDED"] = "APPROVAL_NEEDED";
    NotificationType["APPROVAL_COMPLETED"] = "APPROVAL_COMPLETED";
    NotificationType["REQUEST_REJECTED"] = "REQUEST_REJECTED";
    NotificationType["COMMENT_ADDED"] = "COMMENT_ADDED";
    NotificationType["WORKFLOW_COMPLETED"] = "WORKFLOW_COMPLETED";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// ============================================================================
// AUDIT TYPES
// ============================================================================
var AuditAction;
(function (AuditAction) {
    AuditAction["REQUEST_CREATED"] = "REQUEST_CREATED";
    AuditAction["REQUEST_APPROVED"] = "REQUEST_APPROVED";
    AuditAction["REQUEST_REJECTED"] = "REQUEST_REJECTED";
    AuditAction["COMMENT_ADDED"] = "COMMENT_ADDED";
    AuditAction["ATTACHMENT_UPLOADED"] = "ATTACHMENT_UPLOADED";
    AuditAction["SIGNATURE_CAPTURED"] = "SIGNATURE_CAPTURED";
    AuditAction["PDF_GENERATED"] = "PDF_GENERATED";
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_CREATED"] = "USER_CREATED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
// ============================================================================
// PERMISSION TYPES
// ============================================================================
var Action;
(function (Action) {
    Action["CREATE_REQUEST"] = "CREATE_REQUEST";
    Action["VIEW_REQUEST"] = "VIEW_REQUEST";
    Action["APPROVE_REQUEST"] = "APPROVE_REQUEST";
    Action["REJECT_REQUEST"] = "REJECT_REQUEST";
    Action["ADD_COMMENT"] = "ADD_COMMENT";
    Action["VIEW_DEPARTMENT"] = "VIEW_DEPARTMENT";
    Action["VIEW_COMPANY"] = "VIEW_COMPANY";
})(Action || (exports.Action = Action = {}));
//# sourceMappingURL=types.js.map
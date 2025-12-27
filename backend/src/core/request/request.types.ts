/**
 * RequestCore Types
 */

import {
  Request,
  RequestInput,
  RequestItem,
  RequestStatus,
  WorkflowStep,
  Attachment,
  TimelineEntry,
} from '../../shared/types';

export interface RequestCoreInterface {
  // Request CRUD
  createRequest(creatorId: string, data: RequestInput): Promise<Request>;
  getRequestById(id: string): Promise<Request | null>;
  getRequestsByDepartment(departmentId: string): Promise<Request[]>;
  getRequestsByCreator(creatorId: string): Promise<Request[]>;
  getPendingRequestsForApprover(companyId: string, currentStep: WorkflowStep): Promise<Request[]>;

  // Request status management
  updateRequestStatus(id: string, status: RequestStatus, currentStep?: WorkflowStep | null): Promise<void>;

  // Attachments
  addAttachment(requestId: string, uploadedBy: string, file: AttachmentInput): Promise<Attachment>;
  getAttachments(requestId: string): Promise<Attachment[]>;

  // Timeline
  getRequestTimeline(requestId: string): Promise<TimelineEntry[]>;
}

export interface AttachmentInput {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export { Request, RequestInput, RequestItem, RequestStatus, WorkflowStep, Attachment, TimelineEntry };

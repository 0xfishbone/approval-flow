/**
 * Notification Types
 * Email, push, and in-app notifications
 */

export enum NotificationType {
  APPROVAL_NEEDED = 'APPROVAL_NEEDED',
  APPROVAL_COMPLETED = 'APPROVAL_COMPLETED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED',
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

export interface EmailNotificationData {
  to: string;
  subject: string;
  templateData: Record<string, any>;
  language?: 'en' | 'fr';
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationCoreInterface {
  // In-app notifications
  createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    requestId?: string
  ): Promise<Notification>;
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;

  // Email notifications
  sendEmail(data: EmailNotificationData): Promise<void>;
  notifyApprovalNeeded(requestId: string, approverId: string, requestData: any): Promise<void>;
  notifyApprovalComplete(requestId: string, submitterId: string, requestData: any): Promise<void>;
  notifyRejection(requestId: string, submitterId: string, reason: string, requestData: any): Promise<void>;
  notifyComment(requestId: string, commentData: any, participantIds: string[]): Promise<void>;
  notifyWorkflowComplete(requestId: string, participantIds: string[], pdfUrl?: string): Promise<void>;

  // Push notifications
  sendPushNotification(data: PushNotificationData): Promise<void>;

  // Device management
  registerDevice(userId: string, deviceToken: string): Promise<void>;
}

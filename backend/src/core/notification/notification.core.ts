/**
 * NotificationCore - Email, push, and in-app notifications
 * ~250 lines
 * Dependencies: DatabaseWrapper, EmailWrapper, PushWrapper
 */

import { v4 as uuidv4 } from 'uuid';
import { DatabaseWrapper, EmailWrapper, PushWrapper } from '../../platform';
import {
  NotificationCoreInterface,
  Notification,
  NotificationType,
  EmailNotificationData,
  PushNotificationData,
} from './notification.types';

export class NotificationCore implements NotificationCoreInterface {
  private db: DatabaseWrapper;
  private email: EmailWrapper;
  private push: PushWrapper;

  constructor(db: DatabaseWrapper, email: EmailWrapper, push: PushWrapper) {
    this.db = db;
    this.email = email;
    this.push = push;
  }

  /**
   * Create in-app notification
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    requestId?: string
  ): Promise<Notification> {
    const notification = await this.db.insert<any>('notifications', {
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      body,
      request_id: requestId || null,
      is_read: false,
    });

    return this.mapRowToNotification(notification);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const query = unreadOnly
      ? 'SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC'
      : 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC';

    const rows = await this.db.query<any>(query, [userId]);
    return rows.map(this.mapRowToNotification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.db.update('notifications', notificationId, {
      is_read: true,
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(data: EmailNotificationData): Promise<void> {
    const template = this.getEmailTemplate(data.templateData.type, data.language || 'en');
    const html = this.renderTemplate(template, data.templateData);

    await this.email.sendEmail(data.to, data.subject, html);
  }

  /**
   * Notify approver that approval is needed
   */
  async notifyApprovalNeeded(
    requestId: string,
    approverId: string,
    requestData: any
  ): Promise<void> {
    const approver = await this.db.queryOne<any>('SELECT * FROM users WHERE id = $1', [
      approverId,
    ]);

    if (!approver) return;

    const language = 'fr'; // Default to French for Senegal

    // Create in-app notification
    await this.createNotification(
      approverId,
      NotificationType.APPROVAL_NEEDED,
      language === 'fr' ? 'Approbation requise' : 'Approval Required',
      language === 'fr'
        ? `Demande ${requestData.requestNumber} nécessite votre approbation`
        : `Request ${requestData.requestNumber} requires your approval`,
      requestId
    );

    // Send email
    const html = this.renderTemplate(this.getEmailTemplate('approval_needed', language), {
      type: 'approval_needed',
      approverName: `${approver.first_name} ${approver.last_name}`,
      requestNumber: requestData.requestNumber,
      requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests/${requestId}`,
      items: requestData.items,
      submitter: requestData.submitter,
    });

    await this.email.sendEmail(
      approver.email,
      language === 'fr'
        ? `Approbation requise: ${requestData.requestNumber}`
        : `Approval Required: ${requestData.requestNumber}`,
      html
    );

    // Send push notification
    await this.sendPushNotification({
      userId: approverId,
      title: language === 'fr' ? 'Approbation requise' : 'Approval Required',
      body: `${requestData.requestNumber} - ${requestData.submitter}`,
      data: { requestId, type: 'approval_needed' },
    });
  }

  /**
   * Notify submitter that approval is complete
   */
  async notifyApprovalComplete(
    requestId: string,
    submitterId: string,
    requestData: any
  ): Promise<void> {
    const submitter = await this.db.queryOne<any>('SELECT * FROM users WHERE id = $1', [
      submitterId,
    ]);

    if (!submitter) return;

    const language = 'fr';

    await this.createNotification(
      submitterId,
      NotificationType.APPROVAL_COMPLETED,
      language === 'fr' ? 'Demande approuvée' : 'Request Approved',
      language === 'fr'
        ? `Votre demande ${requestData.requestNumber} a été approuvée`
        : `Your request ${requestData.requestNumber} has been approved`,
      requestId
    );

    await this.sendEmail({
      to: submitter.email,
      subject:
        language === 'fr'
          ? `Demande approuvée: ${requestData.requestNumber}`
          : `Request Approved: ${requestData.requestNumber}`,
      templateData: {
        type: 'approval_complete',
        submitterName: `${submitter.first_name} ${submitter.last_name}`,
        requestNumber: requestData.requestNumber,
        requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests/${requestId}`,
      },
      language,
    });
  }

  /**
   * Notify submitter of rejection
   */
  async notifyRejection(
    requestId: string,
    submitterId: string,
    reason: string,
    requestData: any
  ): Promise<void> {
    const submitter = await this.db.queryOne<any>('SELECT * FROM users WHERE id = $1', [
      submitterId,
    ]);

    if (!submitter) return;

    const language = 'fr';

    await this.createNotification(
      submitterId,
      NotificationType.REQUEST_REJECTED,
      language === 'fr' ? 'Demande rejetée' : 'Request Rejected',
      language === 'fr'
        ? `Votre demande ${requestData.requestNumber} a été rejetée`
        : `Your request ${requestData.requestNumber} has been rejected`,
      requestId
    );

    await this.sendEmail({
      to: submitter.email,
      subject:
        language === 'fr'
          ? `Demande rejetée: ${requestData.requestNumber}`
          : `Request Rejected: ${requestData.requestNumber}`,
      templateData: {
        type: 'rejection',
        submitterName: `${submitter.first_name} ${submitter.last_name}`,
        requestNumber: requestData.requestNumber,
        reason,
        requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests/${requestId}`,
      },
      language,
    });
  }

  /**
   * Notify participants of new comment
   */
  async notifyComment(
    requestId: string,
    commentData: any,
    participantIds: string[]
  ): Promise<void> {
    for (const participantId of participantIds) {
      const participant = await this.db.queryOne<any>('SELECT * FROM users WHERE id = $1', [
        participantId,
      ]);

      if (!participant) continue;

      const language = 'fr';

      await this.createNotification(
        participantId,
        NotificationType.COMMENT_ADDED,
        language === 'fr' ? 'Nouveau commentaire' : 'New Comment',
        language === 'fr'
          ? `${commentData.authorName} a commenté sur ${commentData.requestNumber}`
          : `${commentData.authorName} commented on ${commentData.requestNumber}`,
        requestId
      );
    }
  }

  /**
   * Notify all participants when workflow is complete
   */
  async notifyWorkflowComplete(
    requestId: string,
    participantIds: string[],
    pdfUrl?: string
  ): Promise<void> {
    const request = await this.db.queryOne<any>('SELECT * FROM requests WHERE id = $1', [
      requestId,
    ]);

    if (!request) return;

    for (const participantId of participantIds) {
      const participant = await this.db.queryOne<any>('SELECT * FROM users WHERE id = $1', [
        participantId,
      ]);

      if (!participant) continue;

      const language = 'fr';

      await this.createNotification(
        participantId,
        NotificationType.WORKFLOW_COMPLETED,
        language === 'fr' ? 'Workflow terminé' : 'Workflow Complete',
        language === 'fr'
          ? `La demande ${request.request_number} est terminée`
          : `Request ${request.request_number} is complete`,
        requestId
      );

      await this.sendEmail({
        to: participant.email,
        subject:
          language === 'fr'
            ? `Workflow terminé: ${request.request_number}`
            : `Workflow Complete: ${request.request_number}`,
        templateData: {
          type: 'workflow_complete',
          participantName: `${participant.first_name} ${participant.last_name}`,
          requestNumber: request.request_number,
          requestUrl: `${process.env.APP_URL || 'http://localhost:5173'}/requests/${requestId}`,
          pdfUrl,
        },
        language,
      });
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(data: PushNotificationData): Promise<void> {
    // Get user's device tokens
    const devices = await this.db.query<any>(
      'SELECT device_token FROM user_devices WHERE user_id = $1 AND is_active = true',
      [data.userId]
    );

    for (const device of devices) {
      try {
        await this.push.sendToTopic(device.device_token, {
          title: data.title,
          body: data.body,
          data: data.data,
        });
      } catch (error) {
        console.error('Push notification failed:', error);
      }
    }
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(userId: string, deviceToken: string): Promise<void> {
    // Check if device already registered
    const existing = await this.db.queryOne<any>(
      'SELECT id FROM user_devices WHERE user_id = $1 AND device_token = $2',
      [userId, deviceToken]
    );

    if (!existing) {
      await this.db.insert('user_devices', {
        id: uuidv4(),
        user_id: userId,
        device_token: deviceToken,
        is_active: true,
      });
    }
  }

  /**
   * Get email template (simplified - would use real templates in production)
   */
  private getEmailTemplate(type: string, language: 'en' | 'fr'): string {
    const templates: Record<string, Record<string, string>> = {
      approval_needed: {
        en: `
          <h2>Approval Required</h2>
          <p>Hello {{approverName}},</p>
          <p>Request <strong>{{requestNumber}}</strong> requires your approval.</p>
          <p><a href="{{requestUrl}}">View Request</a></p>
        `,
        fr: `
          <h2>Approbation Requise</h2>
          <p>Bonjour {{approverName}},</p>
          <p>La demande <strong>{{requestNumber}}</strong> nécessite votre approbation.</p>
          <p><a href="{{requestUrl}}">Voir la demande</a></p>
        `,
      },
    };

    return templates[type]?.[language] || templates[type]?.['en'] || '';
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return Object.keys(data).reduce((result, key) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
    }, template);
  }

  /**
   * Map database row to Notification object
   */
  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      requestId: row.request_id,
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    };
  }
}

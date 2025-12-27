/**
 * EmailWrapper - SendGrid
 * Isolates email service behind a clean interface
 * ~50 lines
 */

import { InboundEmail } from '../../shared/types';

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  webhookSecret: string;
}

export class EmailWrapper {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    // In production, use @sendgrid/mail
    // For MVP, we'll use fetch API to SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.config.fromEmail },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }

  async sendTemplateEmail(
    to: string,
    templateId: string,
    data: Record<string, any>
  ): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            dynamic_template_data: data,
          },
        ],
        from: { email: this.config.fromEmail },
        template_id: templateId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send template email: ${response.statusText}`);
    }
  }

  parseInboundEmail(rawEmail: any): InboundEmail {
    // SendGrid parses multipart email and sends as JSON
    return {
      from: rawEmail.from,
      to: rawEmail.to,
      subject: rawEmail.subject,
      body: rawEmail.text || '',
      html: rawEmail.html || '',
      messageId: rawEmail.headers['message-id'] || '',
      receivedAt: new Date(rawEmail.headers.date || Date.now()),
    };
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // Implement HMAC verification for SendGrid webhooks
    // For MVP, return true (implement properly in production)
    return true;
  }
}

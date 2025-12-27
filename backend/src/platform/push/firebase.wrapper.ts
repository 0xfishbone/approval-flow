/**
 * PushWrapper - Firebase Cloud Messaging
 * Isolates push notifications behind a clean interface
 * ~50 lines
 */

export interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class PushWrapper {
  private config: FirebaseConfig;
  private accessToken: string | null = null;

  constructor(config: FirebaseConfig) {
    this.config = config;
  }

  async sendPush(
    deviceToken: string,
    message: PushMessage
  ): Promise<void> {
    // In production, use firebase-admin SDK
    // For MVP, use FCM REST API
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${this.config.projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: deviceToken,
            notification: {
              title: message.title,
              body: message.body,
              image: message.imageUrl,
            },
            data: message.data || {},
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send push notification: ${response.statusText}`);
    }
  }

  async sendToTopic(topic: string, message: PushMessage): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${this.config.projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            topic,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data || {},
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send to topic: ${response.statusText}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    // In production, use OAuth2 to get access token from service account
    // For MVP, return placeholder (implement with firebase-admin in production)
    if (this.accessToken) return this.accessToken;

    // Simplified: In production, use google-auth-library
    // const auth = new GoogleAuth({ credentials: this.config });
    // this.accessToken = await auth.getAccessToken();

    return 'mock-access-token-for-mvp';
  }
}

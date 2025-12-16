/**
 * Notification Service - Multi-channel notification system
 */

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
}

export enum NotificationType {
  STRATEGY_SIGNAL = 'STRATEGY_SIGNAL',
  TRADE_EXECUTED = 'TRADE_EXECUTED',
  TRADE_REPLICATED = 'TRADE_REPLICATED',
  STRATEGY_ERROR = 'STRATEGY_ERROR',
  PRICE_ALERT = 'PRICE_ALERT',
  RISK_LIMIT_REACHED = 'RISK_LIMIT_REACHED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  channels: NotificationChannel[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  read: boolean;
}

export interface NotificationPreferences {
  userId: string;
  strategyId?: string;
  channels: NotificationChannel[];
  types: NotificationType[];
  emailAddress?: string;
  webhookUrl?: string;
}

export class NotificationService {
  private preferences: Map<string, NotificationPreferences[]> = new Map();
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Send notification through configured channels
   */
  async send(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      createdAt: new Date(),
      read: false,
    };

    // Store notification
    if (!this.notifications.has(notification.userId)) {
      this.notifications.set(notification.userId, []);
    }
    this.notifications.get(notification.userId)!.push(fullNotification);

    // Get user preferences
    const userPrefs = this.getUserPreferences(notification.userId, notification.data?.strategyId);

    // Send through each channel
    for (const channel of notification.channels) {
      if (this.shouldSendToChannel(channel, notification.type, userPrefs)) {
        await this.sendToChannel(channel, fullNotification, userPrefs);
      }
    }
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel,
    notification: Notification,
    preferences: NotificationPreferences[]
  ): Promise<void> {
    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.sendInApp(notification);
        break;
      
      case NotificationChannel.EMAIL:
        await this.sendEmail(notification, preferences);
        break;
      
      case NotificationChannel.WEBHOOK:
        await this.sendWebhook(notification, preferences);
        break;
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // In-app notifications are already stored in this.notifications
    // They will be retrieved via getNotifications()
    console.log(`In-app notification sent to user ${notification.userId}`);
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    notification: Notification,
    preferences: NotificationPreferences[]
  ): Promise<void> {
    const emailPref = preferences.find(p => p.emailAddress);
    
    if (!emailPref?.emailAddress) {
      console.warn(`No email address configured for user ${notification.userId}`);
      return;
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Email notification sent to ${emailPref.emailAddress}:`, {
      subject: notification.title,
      body: notification.message,
    });

    // Example integration:
    // await emailClient.send({
    //   to: emailPref.emailAddress,
    //   subject: notification.title,
    //   html: this.formatEmailTemplate(notification),
    // });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(
    notification: Notification,
    preferences: NotificationPreferences[]
  ): Promise<void> {
    const webhookPref = preferences.find(p => p.webhookUrl);
    
    if (!webhookPref?.webhookUrl) {
      console.warn(`No webhook URL configured for user ${notification.userId}`);
      return;
    }

    try {
      const response = await fetch(webhookPref.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          timestamp: notification.createdAt.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }

      console.log(`Webhook notification sent to ${webhookPref.webhookUrl}`);
    } catch (error) {
      console.error(`Failed to send webhook notification:`, error);
    }
  }

  /**
   * Check if notification should be sent to channel
   */
  private shouldSendToChannel(
    channel: NotificationChannel,
    type: NotificationType,
    preferences: NotificationPreferences[]
  ): boolean {
    if (preferences.length === 0) {
      // Default: send all notifications to in-app
      return channel === NotificationChannel.IN_APP;
    }

    return preferences.some(
      pref => pref.channels.includes(channel) && pref.types.includes(type)
    );
  }

  /**
   * Get user preferences
   */
  private getUserPreferences(userId: string, strategyId?: string): NotificationPreferences[] {
    const allPrefs = this.preferences.get(userId) || [];
    
    if (strategyId) {
      // Return strategy-specific preferences if available
      const strategyPrefs = allPrefs.filter(p => p.strategyId === strategyId);
      if (strategyPrefs.length > 0) {
        return strategyPrefs;
      }
    }

    // Return global preferences
    return allPrefs.filter(p => !p.strategyId);
  }

  /**
   * Set notification preferences
   */
  setPreferences(preferences: NotificationPreferences): void {
    if (!this.preferences.has(preferences.userId)) {
      this.preferences.set(preferences.userId, []);
    }

    const userPrefs = this.preferences.get(preferences.userId)!;
    
    // Remove existing preferences for same strategy
    const filtered = userPrefs.filter(p => p.strategyId !== preferences.strategyId);
    filtered.push(preferences);
    
    this.preferences.set(preferences.userId, filtered);
  }

  /**
   * Get user notifications
   */
  getNotifications(userId: string, unreadOnly: boolean = false): Notification[] {
    const notifications = this.notifications.get(userId) || [];
    
    if (unreadOnly) {
      return notifications.filter(n => !n.read);
    }
    
    return notifications;
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    notifications.forEach(n => n.read = true);
  }

  /**
   * Delete notification
   */
  deleteNotification(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId);
    if (!notifications) return;

    const filtered = notifications.filter(n => n.id !== notificationId);
    this.notifications.set(userId, filtered);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format email template
   */
  private formatEmailTemplate(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .priority-${notification.priority.toLowerCase()} { border-left: 4px solid #EF4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content priority-${notification.priority.toLowerCase()}">
              <p>${notification.message}</p>
              ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ''}
              <p><small>Sent at ${notification.createdAt.toLocaleString()}</small></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

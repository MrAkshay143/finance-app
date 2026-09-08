import { io, Socket } from 'socket.io-client';

export interface SocketManagerOptions {
  url?: string;
  getAccessToken?: () => string | null | Promise<string | null>;
}

export class FinanceSocketManager {
  private notificationsSocket: Socket | null = null;
  private dashboardSocket: Socket | null = null;
  private baseUrl: string;

  constructor(private options: SocketManagerOptions = {}) {
    this.baseUrl = options.url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');
  }

  async connectNotifications(onNotification: (data: any) => void, onUnreadCount?: (count: number) => void): Promise<Socket> {
    if (this.notificationsSocket?.connected) {
      return this.notificationsSocket;
    }

    const token = this.options.getAccessToken ? await this.options.getAccessToken() : null;

    this.notificationsSocket = io(`${this.baseUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
    });

    this.notificationsSocket.on('notification', onNotification);
    if (onUnreadCount) {
      this.notificationsSocket.on('unread_count', onUnreadCount);
    }

    return this.notificationsSocket;
  }

  async connectDashboard(onRefresh: (data?: any) => void): Promise<Socket> {
    if (this.dashboardSocket?.connected) {
      return this.dashboardSocket;
    }

    const token = this.options.getAccessToken ? await this.options.getAccessToken() : null;

    this.dashboardSocket = io(`${this.baseUrl}/dashboard`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
    });

    this.dashboardSocket.on('refresh', onRefresh);

    return this.dashboardSocket;
  }

  disconnectAll(): void {
    if (this.notificationsSocket) {
      this.notificationsSocket.disconnect();
      this.notificationsSocket = null;
    }
    if (this.dashboardSocket) {
      this.dashboardSocket.disconnect();
      this.dashboardSocket = null;
    }
  }
}

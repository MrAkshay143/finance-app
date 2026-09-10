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

    const getToken = this.options.getAccessToken;

    this.notificationsSocket = io(`${this.baseUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: async (cb: (data: any) => void) => {
        try {
          const token = getToken ? await getToken() : null;
          cb({ token });
        } catch {
          cb({});
        }
      },
      autoConnect: true,
    });

    this.notificationsSocket.on('notification', onNotification);
    this.notificationsSocket.on('notification:new', onNotification);
    if (onUnreadCount) {
      this.notificationsSocket.on('unread_count', (val: any) => {
        const count = typeof val === 'number' ? val : (val?.count ?? val?.unreadCount ?? 0);
        onUnreadCount(count);
      });
      this.notificationsSocket.on('notification:unread-count', (val: any) => {
        const count = typeof val === 'number' ? val : (val?.count ?? val?.unreadCount ?? 0);
        onUnreadCount(count);
      });
    }

    return this.notificationsSocket;
  }

  async connectDashboard(onRefresh: (data?: any) => void): Promise<Socket> {
    if (this.dashboardSocket?.connected) {
      return this.dashboardSocket;
    }

    const getToken = this.options.getAccessToken;

    this.dashboardSocket = io(`${this.baseUrl}/dashboard`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: async (cb: (data: any) => void) => {
        try {
          const token = getToken ? await getToken() : null;
          cb({ token });
        } catch {
          cb({});
        }
      },
      autoConnect: true,
    });

    this.dashboardSocket.on('dashboard:refresh', onRefresh);
    this.dashboardSocket.on('sync:event', onRefresh);
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

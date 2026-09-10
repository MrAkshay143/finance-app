import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt.js';
import { isDenylisted } from '../lib/tokenDenylist.js';
import { logger } from '../lib/logger.js';
import { activeSocketConnections } from '../lib/metrics.js';

let ioInstance: SocketIOServer | null = null;

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

export function setSocketServer(io: SocketIOServer | null): void {
  ioInstance = io;
}

// Verify Bearer JWT access token during Socket.IO handshake
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    let token: string | undefined = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return next(new Error('UNAUTHENTICATED'));
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      return next(new Error('UNAUTHENTICATED'));
    }

    if (payload.jti) {
      const denylisted = await isDenylisted(payload.jti);
      if (denylisted) {
        return next(new Error('UNAUTHENTICATED'));
      }
    }

    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  } catch (err: any) {
    logger.debug({ err: err?.message }, 'Socket.IO handshake authentication failed');
    next(new Error('UNAUTHENTICATED'));
  }
}

// Initialize Socket.IO namespaces, auth middleware, and room subscriptions
export function initSocketGateway(io: SocketIOServer): void {
  ioInstance = io;

  // Root namespace
  io.use(socketAuthMiddleware);
  io.on('connection', (socket) => {
    activeSocketConnections.inc({ namespace: '/' });
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug({ userId, socketId: socket.id }, 'Socket connected to root namespace');
    }
    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: '/' });
      logger.debug({ socketId: socket.id }, 'Socket disconnected from root namespace');
    });
  });

  // /notifications namespace per Plan/architecture.md §6
  const notificationsNs = io.of('/notifications');
  notificationsNs.use(socketAuthMiddleware);
  notificationsNs.on('connection', (socket) => {
    activeSocketConnections.inc({ namespace: '/notifications' });
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug({ userId, socketId: socket.id }, 'Socket connected to /notifications namespace');
    }
    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: '/notifications' });
      logger.debug({ socketId: socket.id }, 'Socket disconnected from /notifications');
    });
  });

  // /dashboard namespace per Plan/architecture.md §6
  const dashboardNs = io.of('/dashboard');
  dashboardNs.use(socketAuthMiddleware);
  dashboardNs.on('connection', (socket) => {
    activeSocketConnections.inc({ namespace: '/dashboard' });
    const userId = socket.data.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      logger.debug({ userId, socketId: socket.id }, 'Socket connected to /dashboard namespace');
    }
    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: '/dashboard' });
      logger.debug({ socketId: socket.id }, 'Socket disconnected from /dashboard');
    });
  });
}

// Push notification event to user room across active sessions
export function emitNotification(userId: string, notification: any): void {
  if (!ioInstance) return;
  try {
    const room = `user:${userId}`;
    const payload = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
    };
    ioInstance.of('/notifications').to(room).emit('notification:new', payload);
    ioInstance.of('/notifications').to(room).emit('notification', payload);
  } catch (err: any) {
    logger.warn({ err: err?.message, userId }, 'Failed to emit notification via Socket.IO');
  }
}

// Push updated unread notification count to user room
export function emitUnreadCount(userId: string, unreadCount: number): void {
  if (!ioInstance) return;
  try {
    const room = `user:${userId}`;
    const payload = { count: unreadCount, unreadCount };
    ioInstance.of('/notifications').to(room).emit('notification:unread-count', payload);
    ioInstance.of('/notifications').to(room).emit('unread_count', payload);
  } catch (err: any) {
    logger.warn({ err: err?.message, userId }, 'Failed to emit unread count via Socket.IO');
  }
}

// Emit dashboard refresh signal to active user sessions
export function emitDashboardRefresh(userId: string, data: any = { refreshedAt: new Date().toISOString() }): void {
  if (!ioInstance) return;
  try {
    const room = `user:${userId}`;
    ioInstance.of('/dashboard').to(room).emit('dashboard:refresh', data);
    ioInstance.of('/dashboard').to(room).emit('refresh', data);
  } catch (err: any) {
    logger.warn({ err: err?.message, userId }, 'Failed to emit dashboard refresh via Socket.IO');
  }
}

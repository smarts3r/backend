import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';

let io: SocketIOServer | null = null;
const adminSockets = new Map<string, Socket>();

export const initializeSocketIO = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Verify user exists and is admin
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, email: true },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.data.user?.email}`);

    socket.on('admin-join', () => {
      if (socket.data.user?.role === 'ADMIN') {
        adminSockets.set(socket.id, socket);
        console.log(`Admin joined: ${socket.data.user.email}`);
      }
    });

    socket.on('disconnect', () => {
      adminSockets.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitNewOrder = (order: any) => {
  if (!io) return;
  
  adminSockets.forEach((socket) => {
    socket.emit('new-order', order);
  });
};

export const emitOrderStatusChange = (orderId: string | number, status: string) => {
  if (!io) return;
  
  adminSockets.forEach((socket) => {
    socket.emit('order-status-changed', { orderId: String(orderId), status });
  });
};

export const emitStatsUpdate = (stats: any) => {
  if (!io) return;
  
  adminSockets.forEach((socket) => {
    socket.emit('stats-update', stats);
  });
};

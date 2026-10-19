import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { User } from '../models/User.js';

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId).populate('roleId');

      if (!user || !user.active) {
        return next(new Error('User unauthorized'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials'));
    }
  });

  io.on('connection', (socket) => {
    logger.info({ userId: socket.user?._id, username: socket.user?.username }, 'Socket client connected');

    // Join role room
    if (socket.user?.roleId?.code) {
      socket.join(`role:${socket.user.roleId.code}`);
    }

    socket.on('disconnect', () => {
      logger.info({ userId: socket.user?._id }, 'Socket client disconnected');
    });
  });

  return io;
}

export function emitEvent(eventName, data) {
  if (io) {
    io.emit(eventName, data);
  }
}

export function getIO() {
  return io;
}

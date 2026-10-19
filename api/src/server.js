import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './services/socketService.js';

async function startServer() {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    initSocket(server);

    server.listen(config.port, () => {
      logger.info(`Nagfani Foods ERP API Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

startServer();

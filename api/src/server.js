import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './services/socketService.js';

import { User } from './models/User.js';
import { seedDatabase } from './scripts/seed.js';

async function startServer() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database empty on startup. Automatically seeding initial users, masters, items and BOMs...');
      await seedDatabase(false);
      logger.info('Auto-seed completed successfully.');
    }

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

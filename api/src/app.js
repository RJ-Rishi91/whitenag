import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import partyRoutes from './routes/partyRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import manufacturingRoutes from './routes/manufacturingRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Nagfani Foods ERP API',
      timestamp: new Date().toISOString()
    });
  });

  // REST API prefix
  const apiPrefix = '/api/v1';

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/roles`, roleRoutes);
  app.use(`${apiPrefix}`, masterRoutes);
  app.use(`${apiPrefix}/items`, itemRoutes);
  app.use(`${apiPrefix}/parties`, partyRoutes);
  app.use(`${apiPrefix}/orders`, orderRoutes);
  app.use(`${apiPrefix}/stock`, stockRoutes);
  app.use(`${apiPrefix}/purchases`, purchaseRoutes);
  app.use(`${apiPrefix}`, manufacturingRoutes);
  app.use(`${apiPrefix}`, billingRoutes);
  app.use(`${apiPrefix}/payments`, paymentRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/reports`, reportRoutes);
  app.use(`${apiPrefix}/search`, searchRoutes);
  app.use(`${apiPrefix}/sync`, syncRoutes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

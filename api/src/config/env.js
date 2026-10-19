import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nagmani_erp?replicaSet=rs0',
  jwtSecret: process.env.JWT_SECRET || 'nagfani_super_secret_jwt_key_2026_food_erp',
  jwtExpires: process.env.JWT_EXPIRES || '12h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  connectorApiKey: process.env.CONNECTOR_API_KEY || 'nagfani_connector_api_key_secure_2026',
  nodeEnv: process.env.NODE_ENV || 'development'
};

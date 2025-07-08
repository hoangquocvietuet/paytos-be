import * as dotenv from 'dotenv';

dotenv.config();

function loadConfig() {
  const config = {
    app: {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
    },
    database: {
      url:
        process.env.DATABASE_URL || 'mysql://root:root@localhost:3307/paytos',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  };

  return config;
}

export const env = loadConfig();

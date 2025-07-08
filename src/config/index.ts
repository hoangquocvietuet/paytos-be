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
  };

  return config;
}

export const env = loadConfig();

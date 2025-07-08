import * as dotenv from 'dotenv';

dotenv.config();

function loadConfig() {
  const config = {
    app: {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
    },
    database: {
      url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/u4s',
    },
    auth: {
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key-for-development',
      },
      encryption: {
        key: process.env.ENCRYPTION_KEY,
      },
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    pinata: {
      pinataJwt: process.env.PINATA_JWT,
    },
    chain: {
      rpc_url: process.env.RPC_URL || '',
    },
    private_key: process.env.PRIVATE_KEY || '',
  };

  return config;
}

export const env = loadConfig();

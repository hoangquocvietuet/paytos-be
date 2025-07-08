import { NestFactory } from '@nestjs/core';

import { json, urlencoded } from 'express';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) =>
  console.error('Application failed to start:', error),
);

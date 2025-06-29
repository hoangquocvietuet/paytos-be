import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AptosSignatureMiddleware } from './middleware/aptos-signature.middleware.js';
import { json, urlencoded } from 'express/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));
  app.use(new AptosSignatureMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

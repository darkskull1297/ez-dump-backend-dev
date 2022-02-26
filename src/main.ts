import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'body-parser';
import expressListRoutes from 'express-list-routes';
import cloneBuffer from 'clone-buffer';
import admin from 'firebase-admin';

import { AppModule } from './app.module';
import { setupOwnerDocs } from './swagger-modules/owner';
import { setupDriverDocs } from './swagger-modules/driver';
import { setupContractorDocs } from './swagger-modules/contractor';
import { setupDispatcherDocs } from './swagger-modules/dispatcher';
import { setupGeneralDocs } from './swagger-modules/general';
import { setupAdminDocs } from './swagger-modules/admin';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'origin',
      'authorization',
      'content-type',
      'x-requested-with',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(
    json({
      verify: (req: any, res, buf) => {
        if (req.headers['stripe-signature'] && Buffer.isBuffer(buf)) {
          req.rawBody = cloneBuffer(buf);
        }
        return true;
      },
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('EZ Dump Truck API')
    .setDescription('API Backend for EZ Dump Truck Apps')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    include: [AppModule],
  });
  SwaggerModule.setup('api', app, document);

  setupOwnerDocs(app);
  setupDriverDocs(app);
  setupContractorDocs(app);
  setupDispatcherDocs(app);
  setupAdminDocs(app);
  setupGeneralDocs(app);

  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.get<string>('base.port'));

  const server = app.getHttpServer();
  const router = server._events.request._router;
  console.log(expressListRoutes({}, 'API:', router));

  const firebaseParams = {
    type: process.env.TYPE,
    projectId: process.env.PROJECT_ID,
    privateKeyId: process.env.PRIVATE_KEY_ID,
    privateKey: process.env.PRIVATE_KEY,
    clientEmail: process.env.CLIENT_EMAIL,
    clientId: process.env.CLIENT_ID,
    authUri: process.env.AUTH_URI,
    tokenUri: process.env.TOKEN_URI,
    authProviderX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL,
    clientC509CertUrl: process.env.CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(firebaseParams),
    databaseURL: 'https://leafy-tenure-287119.firebaseio.com',
  });
}
bootstrap();

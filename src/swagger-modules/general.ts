import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { NotificationModule } from '../notification/notification.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Driver API')
  .setDescription('API Endpoints for the EZ Dump Truck Driver App')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupGeneralDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      S3Module,
      NotificationModule
    ],
  });
  SwaggerModule.setup('general/api', app, document);
}

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AuthOwnerModule } from '../auth/controllers/owner/auth-owner.module';
import { UserOwnerModule } from '../user/controllers/owner/user-owner.module';
import { JobOwnerModule } from '../jobs/controllers/owner/job-owner.module';
import { TruckOwnerModule } from '../trucks/controllers/owner/truck-owner.module';
import { InvoiceOwnerModule } from '../invoices/controllers/owner/invoice-owner.module';
import { GeolocationOwnerModule } from '../geolocation/controllers/owner/geolocation-owner.module';
import { TimerOwnerModule } from '../timer/controllers/owner/timer-owner.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Owner API')
  .setDescription('API Endpoints for the EZ Dump Truck Owner App')
  .setVersion('1.0')
  .addTag('auth', 'Authentication Methods for Owners')
  .addTag('user', 'Endpoints for managing Owner Profile')
  .addTag('truck', 'Truck Methods for Owners')
  .addTag('jobs', 'Job Methods for Owners')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupOwnerDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      TimerOwnerModule,
      AuthOwnerModule,
      TruckOwnerModule,
      UserOwnerModule,
      JobOwnerModule,
      InvoiceOwnerModule,
      GeolocationOwnerModule,
    ],
  });
  SwaggerModule.setup('owner/api', app, document);
}

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { TruckAdminModule } from '../trucks/controllers/admin/truck-admin.module';
import { AuthAdminModule } from '../auth/controllers/admin/auth-admin.module';
import { UserAdminModule } from '../user/controllers/admin/user-admin.module';
import { JobAdminModule } from '../jobs/controllers/admin/job-admin.module';
import { InvoiceAdminModule } from '../invoices/controllers/admin/invoice-admin.module';
import { GeolocationAdminModule } from '../geolocation/controllers/admin/geolocation-admin.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Admin API')
  .setDescription('API Endpoints for the EZ Dump Truck Admin Dashboard')
  .setVersion('1.0')
  .addTag('auth', 'Authentication Methods for Admins')
  .addTag('truck', 'Truck Methods for Admins')
  .addTag('user', 'User Methods for Admins')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupAdminDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      AuthAdminModule,
      UserAdminModule,
      TruckAdminModule,
      JobAdminModule,
      InvoiceAdminModule,
      GeolocationAdminModule,
    ],
  });
  SwaggerModule.setup('admin/api', app, document);
}

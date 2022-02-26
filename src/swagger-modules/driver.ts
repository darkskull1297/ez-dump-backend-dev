import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AuthDriverModule } from '../auth/controllers/driver/auth-driver.module';
import { UserDriverModule } from '../user/controllers/driver/user-driver.module';
import { JobDriverModule } from '../jobs/controllers/driver/job-driver.module';
import { TimerDriverModule } from '../timer/controllers/driver/timer-driver.module';
import { GeolocationDriverModule } from '../geolocation/controllers/driver/geolocation-driver.module';
import { ProblemsDriverModule } from '../problems/controllers/driver/problems-driver.module';
import { InvoiceDriverModule } from '../invoices/controllers/driver/invoice-driver.module';
import { TruckDriverModule } from '../trucks/controllers/driver/truck-driver.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Driver API')
  .setDescription('API Endpoints for the EZ Dump Truck Driver App')
  .setVersion('1.0')
  .addTag('auth', 'Authentication Methods for Drivers')
  .addTag('user', 'Endpoints for managing Driver Profile')
  .addTag('jobs', "Endpoints for managing Driver's jobs")
  .addTag('timer', "Endpoints for managing Driver's timer")
  .addTag('geolocation', "Endpoints for managing Driver's geolocation")
  .addTag('problems', "Endpoints for managing Driver's problems report")
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupDriverDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      AuthDriverModule,
      UserDriverModule,
      JobDriverModule,
      TimerDriverModule,
      GeolocationDriverModule,
      ProblemsDriverModule,
      InvoiceDriverModule,
      TruckDriverModule,
    ],
  });
  SwaggerModule.setup('driver/api', app, document);
}

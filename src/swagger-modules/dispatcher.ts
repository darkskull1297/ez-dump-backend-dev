import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { UserDispatcherModule } from '../user/controllers/dispatcher/user-dispatcher.module';
import { GeneralJobDispatcherModule } from '../general-jobs/controllers/dispatcher/general-job-dispatcher.module';
import { JobDispatcherModule } from '../jobs/controllers/dispatcher/job-dispatcher.module';
import { GeolocationDispatcherModule } from '../geolocation/controllers/dispatcher/geolocation-dispatcher.module';
import { InvoiceDispatcherModule } from '../invoices/controllers/dispatcher/invoice-dispatcher.module';
import { BillDispatcherModule } from '../bill/controllers/dispatcher/bill-dispatcher.module';
import { CustomerDispatcherModule } from '../customer/controllers/dispatcher/customer-dispatcher.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Dispatcher API')
  .setDescription('API Endpoints for the EZ Dump Truck Dispatcher App')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupDispatcherDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      UserDispatcherModule,
      GeneralJobDispatcherModule,
      JobDispatcherModule,
      GeolocationDispatcherModule,
      InvoiceDispatcherModule,
      BillDispatcherModule,
      CustomerDispatcherModule,
    ],
  });
  SwaggerModule.setup('dispatcher/api', app, document);
}

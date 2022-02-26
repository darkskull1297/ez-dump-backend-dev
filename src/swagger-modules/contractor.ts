import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { AuthContractorModule } from '../auth/controllers/contractor/auth-contractor.module';
import { JobContractorModule } from '../jobs/controllers/contractor/job-contractor.module';
import { InvoiceContractorModule } from '../invoices/controllers/contractor/invoice-contractor.module';
import { UserContractorModule } from '../user/controllers/contractor/user-contractor.module';
import { GeolocationContractorModule } from '../geolocation/controllers/contractor/geolocation-contractor.module';
import { GeneralJobContractorModule } from '../general-jobs/controllers/contractor/general-job-contractor.module';
import { CustomerContractorModule } from '../customer/controllers/contractor/customer-contractor.module';
import { BillContractorModule } from '../bill/controllers/contractor/bill-contractor.module';

const options = new DocumentBuilder()
  .setTitle('EZ Dump Truck Contractor API')
  .setDescription('API Endpoints for the EZ Dump Truck Contractor App')
  .setVersion('1.0')
  .addTag('auth', 'Authentication Methods for Contractors')
  .addTag('general-job', 'Endpoints for managing general job')
  .addTag('jobs')
  .addTag('contractor')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'authorization',
  )
  .build();

export function setupContractorDocs(app: INestApplication): void {
  const document = SwaggerModule.createDocument(app, options, {
    include: [
      AuthContractorModule,
      GeneralJobContractorModule,
      JobContractorModule,
      InvoiceContractorModule,
      UserContractorModule,
      GeolocationContractorModule,
      CustomerContractorModule,
      BillContractorModule,
    ],
  });
  SwaggerModule.setup('contractor/api', app, document);
}

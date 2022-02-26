import { Module } from '@nestjs/common';
import { GeolocationDriverModule } from './controllers/driver/geolocation-driver.module';
import { GeolocationCommonModule } from './geolocation-common.module';
import { GeolocationOwnerModule } from './controllers/owner/geolocation-owner.module';
import { GeolocationContractorModule } from './controllers/contractor/geolocation-contractor.module';
import { GeolocationAdminModule } from './controllers/admin/geolocation-admin.module';
import { GeolocationDispatcherModule } from './controllers/dispatcher/geolocation-dispatcher.module';
import { GeolocationForemanModule } from './controllers/foreman/geolocation-foreman.module';

@Module({
  imports: [
    GeolocationCommonModule,
    GeolocationDriverModule,
    GeolocationOwnerModule,
    GeolocationContractorModule,
    GeolocationAdminModule,
    GeolocationDispatcherModule,
    GeolocationForemanModule,
  ],
  exports: [GeolocationCommonModule],
})
export class GeolocationModule {}

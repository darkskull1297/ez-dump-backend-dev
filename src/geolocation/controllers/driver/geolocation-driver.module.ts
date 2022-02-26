import { Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationDriverController } from './geolocation-driver.controller';

@Module({
  imports: [GeolocationCommonModule],
  controllers: [GeolocationDriverController],
})
export class GeolocationDriverModule {}

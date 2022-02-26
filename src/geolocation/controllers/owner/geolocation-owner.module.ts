import { Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationOwnerController } from './geolocation-owner.controller';

@Module({
  imports: [GeolocationCommonModule],
  controllers: [GeolocationOwnerController],
})
export class GeolocationOwnerModule {}

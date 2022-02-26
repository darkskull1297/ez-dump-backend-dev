import { forwardRef, Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationForemanController } from './geolocation-foreman.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeolocationCommonModule, forwardRef(() => UserModule)],
  controllers: [GeolocationForemanController],
})
export class GeolocationForemanModule {}

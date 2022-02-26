import { forwardRef, Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationAdminController } from './geolocation-admin.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeolocationCommonModule, forwardRef(() => UserModule)],
  controllers: [GeolocationAdminController],
})
export class GeolocationAdminModule {}

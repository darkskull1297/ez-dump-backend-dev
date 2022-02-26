import { forwardRef, Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationDispatcherController } from './geolocation-dispatcher.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeolocationCommonModule, forwardRef(() => UserModule)],
  controllers: [GeolocationDispatcherController],
})
export class GeolocationDispatcherModule {}

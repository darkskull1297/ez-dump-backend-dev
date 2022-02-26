import { forwardRef, Module } from '@nestjs/common';
import { GeolocationCommonModule } from '../../geolocation-common.module';
import { GeolocationContractorController } from './geolocation-contractor.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [GeolocationCommonModule, forwardRef(() => UserModule)],
  controllers: [GeolocationContractorController],
})
export class GeolocationContractorModule {}

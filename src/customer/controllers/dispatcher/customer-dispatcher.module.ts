import { forwardRef, Module } from '@nestjs/common';
import { CustomerDispatcherController } from './customer-dispatcher.controller';
import { CustomerCommonModule } from '../../customer-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [CustomerCommonModule, forwardRef(() => UserModule)],
  controllers: [CustomerDispatcherController],
})
export class CustomerDispatcherModule {}

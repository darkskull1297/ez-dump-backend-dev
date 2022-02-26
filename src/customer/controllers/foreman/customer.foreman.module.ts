import { forwardRef, Module } from '@nestjs/common';
import { CustomerForemanController } from './customer-foreman.controller';
import { CustomerCommonModule } from '../../customer-common.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [CustomerCommonModule, forwardRef(() => UserModule)],
  controllers: [CustomerForemanController],
})
export class CustomerForemanModule {}

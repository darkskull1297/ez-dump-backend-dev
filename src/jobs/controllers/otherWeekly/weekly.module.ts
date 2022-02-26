import { forwardRef, Module } from '@nestjs/common';
import { WeeklyController } from './weekly.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { InvoicesModule } from '../../../invoices/invoices.module';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [
    JobsCommonModule,
    forwardRef(() => InvoicesModule),
    forwardRef(() => UserModule),
  ],
  controllers: [WeeklyController],
})
export class WeeklyModule {}

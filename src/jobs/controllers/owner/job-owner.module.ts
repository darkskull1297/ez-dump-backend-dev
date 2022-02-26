import { forwardRef, Module } from '@nestjs/common';
import { JobOwnerController } from './job-owner.controller';
import { JobsCommonModule } from '../../jobs-common.module';
import { UserModule } from '../../../user/user.module';
import { InvoicesModule } from '../../../invoices/invoices.module';

@Module({
  imports: [
    JobsCommonModule,
    forwardRef(() => UserModule),
    forwardRef(() => InvoicesModule),
  ],
  controllers: [JobOwnerController],
})
export class JobOwnerModule {}

import { forwardRef, Module } from '@nestjs/common';
import { InvoicesCommonModule } from '../../invoices-common.module';
import { InvoiceDispatcherController } from './invoice-dispatcher.controller';
import { UserModule } from '../../../user/user.module';

@Module({
  imports: [InvoicesCommonModule, forwardRef(() => UserModule)],
  controllers: [InvoiceDispatcherController],
})
export class InvoiceDispatcherModule {}

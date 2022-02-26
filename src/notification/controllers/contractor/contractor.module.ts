import { Module, forwardRef } from '@nestjs/common';
import { NotificationModule } from '../../notification.module';
import { ContractorNotificationsController } from './contractor.controller';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [ContractorNotificationsController],
})
export class ContractorNotificationsModule {}

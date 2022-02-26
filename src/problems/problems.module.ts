import { UserModule } from './../user/user.module';
import { NotificationModule } from './../notification/notification.module';
import { Module, forwardRef } from '@nestjs/common';
import { ProblemsCommonModule } from './problems-common.module';
import { ProblemsDriverModule } from './controllers/driver/problems-driver.module';

@Module({
  imports: [ProblemsCommonModule, ProblemsDriverModule],
  exports: [ProblemsCommonModule],
})
export class ProblemsModule {}

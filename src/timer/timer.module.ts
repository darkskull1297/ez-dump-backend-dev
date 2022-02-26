import { Module } from '@nestjs/common';
import { TimerCommonModule } from './timer-common.module';
import { TimerDriverModule } from './controllers/driver/timer-driver.module';
import { S3Module } from '../s3/s3.module';
import { TimerOwnerModule } from './controllers/owner/timer-owner.module';

@Module({
  imports: [TimerCommonModule, TimerDriverModule, TimerOwnerModule, S3Module],
  exports: [TimerCommonModule],
})
export class TimerModule {}

import { Module } from '@nestjs/common';

import { TimerOwnerController } from './timer-owner.controller';
import { TimerCommonModule } from '../../timer-common.module';

@Module({
  imports: [TimerCommonModule],
  controllers: [TimerOwnerController],
})
export class TimerOwnerModule {}

import { Module } from '@nestjs/common';

import { TimerDriverController } from './timer-driver.controller';
import { TimerCommonModule } from '../../timer-common.module';

@Module({
  imports: [TimerCommonModule],
  controllers: [TimerDriverController],
})
export class TimerDriverModule {}

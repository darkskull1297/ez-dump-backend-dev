import { Module } from '@nestjs/common';
import { ProblemsCommonModule } from '../../problems-common.module';
import { ProblemsDriverController } from './problems-driver.controller';

@Module({
  imports: [ProblemsCommonModule],
  controllers: [ProblemsDriverController],
})
export class ProblemsDriverModule {}

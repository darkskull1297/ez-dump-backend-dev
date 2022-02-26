import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SwitchJobRepo } from './switch-job.repository';
import { SwitchJob } from './switch-job.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([SwitchJob]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [SwitchJobRepo],
  exports: [PassportModule, TypeOrmModule, SwitchJobRepo],
})
export class SwitchJobModule {}

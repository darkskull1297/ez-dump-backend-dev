import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { Settings } from './settings.model';
import { SettingsRepo } from './settings.repository';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settings]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CompanyModule,
  ],
  providers: [SettingsRepo, SettingsService],
  exports: [SettingsRepo, SettingsService, PassportModule, TypeOrmModule],
})
export class SettingsCommonModule {}

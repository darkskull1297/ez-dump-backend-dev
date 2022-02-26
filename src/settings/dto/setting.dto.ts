import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Settings } from '../settings.model';

export class SettingsDTO {
  @ApiPropertyOptional({ description: 'Setting Id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Setting Name' })
  @IsString()
  setting: string;

  @ApiProperty({ description: 'Setting Value' })
  @IsString()
  value: string;

  toModel?(): Omit<Settings, 'id' | 'createdAt' | 'updatedAt' | 'company'> {
    return {
      setting: this.setting,
      value: this.value,
    };
  }

  static fromModel(settings: Settings): SettingsDTO {
    const { id, setting, value } = settings;

    return {
      id,
      setting,
      value,
    };
  }
}

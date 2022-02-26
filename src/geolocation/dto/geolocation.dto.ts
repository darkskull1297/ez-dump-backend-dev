import { IsDate, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Geolocation } from '../geolocation.model';
import { GeolocationType } from '../geolocation-type';

export class GeolocationDTO {
  @ApiProperty({ description: 'Date' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({
    description: 'Type',
    nullable: true,
    enum: GeolocationType,
    type: 'enum',
  })
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Latitude' })
  @IsLatitude()
  lat: string;

  @ApiPropertyOptional({ description: 'Register by' })
  @IsOptional()
  registerBy?: string;

  @ApiProperty({ description: 'Longitude' })
  @IsLongitude()
  long: string;

  @ApiPropertyOptional({ description: 'Date', readOnly: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Speed', readOnly: true })
  @IsOptional()
  speed?: number;

  @ApiPropertyOptional({ description: 'Stationary time in minutes' })
  @IsOptional()
  stationaryMinutes?: number;

  toModel?(): Omit<
  Geolocation,
  'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
  > {
    return {
      date: this.date,
      lat: this.lat,
      long: this.long,
      registerBy: this.registerBy,
      speed: this.speed,
      stationaryMinutes: this.stationaryMinutes,
    };
  }

  static fromModel(geolocation: Geolocation): GeolocationDTO {
    const {
      lat,
      long,
      date,
      type,
      registerBy,
      stationaryMinutes,
    } = geolocation;
    return {
      date,
      lat,
      long,
      type,
      registerBy,
      stationaryMinutes,
    };
  }
}

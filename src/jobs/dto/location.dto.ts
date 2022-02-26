import {
  IsOptional,
  IsBoolean,
  IsString,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../../location/location.model';

export class LocationDTO {
  @ApiPropertyOptional({ description: "Location's address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: "Location's latitude" })
  @IsLatitude()
  lat: string;

  @ApiProperty({ description: "Location's longitude" })
  @IsLongitude()
  long: string;

  @ApiProperty({ description: "Location's longitude" })
  @IsBoolean()
  @IsOptional()
  switching?: boolean;

  toModel?(): Location {
    return {
      address: this.address,
      lat: this.lat,
      long: this.long,
    };
  }

  static fromModel?(location: Location): LocationDTO {
    const { address, lat, long } = location || {};
    return { address, lat, long };
  }
}

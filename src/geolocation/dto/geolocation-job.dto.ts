import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Geolocation } from '../geolocation.model';
import { Job } from '../../jobs/job.model';
import { GeolocationDTO } from './geolocation.dto';

export class GeolocationJobDTO {
  @ApiProperty({ description: 'Job', type: Job })
  @Type(() => Job)
  @ValidateNested()
  job: Job;

  @ApiProperty({ description: 'Geolocations', type: [Geolocation] })
  @IsOptional()
  @Type(() => GeolocationDTO)
  @IsArray()
  geolocations: GeolocationDTO[];

  static fromModel(geolocations: Geolocation[], job: Job): GeolocationJobDTO {
    return {
      job,
      geolocations,
    };
  }
}

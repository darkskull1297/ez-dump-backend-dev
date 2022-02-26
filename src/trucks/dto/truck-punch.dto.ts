import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LocationDTO } from '../../jobs/dto/location.dto';

export class TruckPunchDTO {
  @ApiPropertyOptional({ description: 'Total active trucks' })
  @IsOptional()
  punchInAddress: LocationDTO;

  @ApiPropertyOptional({ description: 'Total active trucks' })
  @IsOptional()
  punchOutAddress: LocationDTO;

  @ApiPropertyOptional({ description: 'Total inactive trucks' })
  @IsOptional()
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Total trucks' })
  @IsOptional()
  @IsString()
  driverId: string;

  @ApiPropertyOptional({ description: 'Total trucks' })
  @IsOptional()
  @IsString()
  truckId: string;
}

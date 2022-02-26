import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ReviewTruckDTO {
  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsNumber()
  stars: number;

  @ApiPropertyOptional({ description: 'Review comment' })
  @IsOptional()
  @IsString()
  comment: string;

  @ApiProperty({ description: 'Truck Id' })
  @IsString()
  truckId: string;
}

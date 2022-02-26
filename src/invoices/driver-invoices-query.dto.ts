import { IsOptional, IsDate, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDTO } from '../common/pagination.dto';

export class DriverInvoicesQueryDTO extends PaginationDTO {
  @ApiPropertyOptional({ required: false, default: new Date() })
  @IsOptional()
  @IsDate()
  @Transform((_, obj) => new Date(obj.from))
  from?: Date;

  @ApiPropertyOptional({ required: false, default: new Date() })
  @IsOptional()
  @IsDate()
  @Transform((_, obj) => new Date(obj.to))
  to?: Date;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  truckId?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  materialId?: string;
}

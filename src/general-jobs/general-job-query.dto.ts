import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDTO } from '../common/pagination.dto';

export class GeneralJobQueryDTO extends PaginationDTO {
  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;
}

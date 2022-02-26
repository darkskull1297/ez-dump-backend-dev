import { IsInt, IsPositive, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PaginationDTO {
  @ApiPropertyOptional({ default: 0, required: false })
  @IsInt()
  @IsOptional()
  @Transform((_, obj) => Number(obj.skip))
  skip?: number;

  @ApiPropertyOptional({ default: 10, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Transform((_, obj) => Number(obj.count))
  count?: number;
}

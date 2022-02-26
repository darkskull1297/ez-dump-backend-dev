import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

class AssignationsObjectDTO {
  assignationId: string;
  categoryId: string;
  truckId: string;
}

export class DeleteOrClockOutJobAssignationsDTO {
  @ApiProperty({ description: 'Assignations to delete or clock out' })
  @IsArray()
  assignations: AssignationsObjectDTO[];
}

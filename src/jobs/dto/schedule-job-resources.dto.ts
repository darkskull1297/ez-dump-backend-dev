import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { UserDTO } from '../../user/dto/user.dto';
import { TruckDTO } from '../../trucks/dto/truck.dto';
import { User } from '../../user/user.model';
import { Truck } from '../../trucks/truck.model';

export class ScheduleJobResourcesDTO {
  @ApiProperty({ description: 'Drivers', type: [UserDTO] })
  @Type(() => UserDTO)
  @IsArray()
  @ValidateNested({ each: true })
  drivers: UserDTO[];

  @ApiProperty({ description: 'Trucks', type: [TruckDTO] })
  @Type(() => TruckDTO)
  @IsArray()
  @ValidateNested({ each: true })
  trucks: TruckDTO[];

  static fromModel(drivers: User[], trucks: Truck[]): ScheduleJobResourcesDTO {
    return {
      drivers: drivers.map(driver => UserDTO.fromModel(driver)),
      trucks: trucks.map(truck => TruckDTO.fromModel(truck)),
    };
  }
}

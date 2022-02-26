import { PartialType } from '@nestjs/swagger';
import { TruckDTO } from './truck.dto';

export class UpdateTruckDTO extends PartialType(TruckDTO) {}

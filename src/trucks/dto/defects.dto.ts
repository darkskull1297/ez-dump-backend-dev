import { IsDate, IsString } from 'class-validator';

export class DefectsDTO {
  @IsString()
  driver: string;

  @IsString()
  defect: string;

  @IsDate()
  dateCreated: Date;

  @IsDate()
  lastUpdated: Date;
}

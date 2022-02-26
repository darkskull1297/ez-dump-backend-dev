import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class NotificationDTO {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  submitted: Date;

  @IsBoolean()
  isChecked: boolean;

  @IsNumber()
  priority: number;

  @IsString()
  userId?: string;

  @IsString()
  link?: string;
}

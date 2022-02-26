import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsInstance,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Problem } from '../problem.model';
import { LocationDTO } from '../../jobs/dto/location.dto';
import { UserDTO } from '../../user/dto/user.dto';
import { User } from '../../user/user.model';

export class ProblemDTO {
  @ApiPropertyOptional({ description: 'Problem id' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Subject of the problem' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Description of the problem' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Location where the problem was generated' })
  @Type(() => LocationDTO)
  @ValidateNested()
  @IsInstance(LocationDTO)
  location: LocationDTO;

  @ApiProperty({ description: 'Date when the problem happened' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({
    description: 'Driver who generated the problem report',
  })
  @IsOptional()
  @Type(() => UserDTO)
  @ValidateNested()
  @IsInstance(UserDTO)
  user?: UserDTO;

  toModel?(
    user: User,
  ): Omit<Problem, 'id' | 'createdAt' | 'updatedAt' | 'job'> {
    return {
      subject: this.subject,
      description: this.description,
      location: this.location.toModel(),
      date: this.date,
      user,
    };
  }

  static fromModel(problem: Problem): ProblemDTO {
    const { id, subject, description, location, date, user } = problem;
    return {
      id,
      subject,
      description,
      location: LocationDTO.fromModel(location),
      date,
      user: UserDTO.fromModel(user),
    };
  }
}

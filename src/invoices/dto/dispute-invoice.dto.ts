import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UserDTO } from '../../user/dto/user.dto';
import { DisputeInvoice } from '../dispute-invoice.model';
import { DriverJobInvoice } from '../driver-job-invoice.model';
import { OwnerJobInvoice } from '../owner-job-invoice.model';
import { DisputeInvoiceStatus } from '../dispute-invoice-status';
import {DisputeLoads} from '../dispute-loads.model';

export class DisputeInvoiceDTO {
  @ApiPropertyOptional({ description: 'Dispute invoice id', readOnly: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Result of dispute' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: 'Resolution of dispute' })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiPropertyOptional({ description: 'Reasons of dispute' })
  @IsString()
  @IsOptional()
  reasons?: string;

  @ApiPropertyOptional({ description: 'Request by role of dispute' })
  @IsString()
  @IsOptional()
  requestByRole?: string;

  @ApiPropertyOptional({ description: 'Requirements of dispute' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Request by',
    type: UserDTO,
    readOnly: true,
  })
  @Type(() => UserDTO)
  @ValidateNested()
  requestBy: UserDTO;

  @ApiPropertyOptional({
    description: 'Dispute number (only returned)',
    readOnly: true,
  })
  disputeNumber?: number;

  @ApiProperty({
    description: 'Dispute Driver Invoice',
    type: DriverJobInvoice,
  })
  @Type(() => DriverJobInvoice)
  @ValidateNested()
  driverJobInvoice?: DriverJobInvoice;

  @ApiProperty({
    description: 'Dispute Driver Invoice',
    type: DriverJobInvoice,
  })
  @Type(() => DriverJobInvoice)
  @IsOptional()
  previousDriverInvoice?: DriverJobInvoice;

  @ApiProperty({ description: 'Dispute Driver Invoice', type: OwnerJobInvoice })
  @Type(() => OwnerJobInvoice)
  @ValidateNested()
  ownerJobInvoice?: OwnerJobInvoice;

  @ApiPropertyOptional({
    description: "Job's status",
    enum: DisputeInvoiceStatus,
    readOnly: true,
    default: DisputeInvoiceStatus.STARTED,
  })
  @IsOptional()
  @IsEnum(DisputeInvoiceStatus)
  status?: DisputeInvoiceStatus;

  @ApiPropertyOptional({
    description: 'Resulting evidence of dispute',
    type: Array,
  })
  @IsOptional()
  evidences?: string[];

  @ApiPropertyOptional({
    description: 'Resume of the dispute solved',
    type: Array,
  })
  @IsOptional()
  resultResume?: string[];

  @ApiProperty({
    description: 'Dispute Loads',
    type: Array
  })
  disputeLoads: DisputeLoads[]

  static fromModel(disputeInvoice: DisputeInvoice): DisputeInvoiceDTO {
    const {
      id,
      result,
      resolution,
      reasons,
      requirements,
      requestBy,
      disputeNumber,
      driverJobInvoice,
      ownerJobInvoice,
      requestByRole,
      status,
      evidences,
      resultResume,
      disputeLoads
    } = disputeInvoice;
    return {
      id,
      result,
      resolution,
      reasons,
      requirements,
      requestBy: requestBy ? UserDTO.fromModel(requestBy) : null,
      requestByRole,
      disputeNumber,
      driverJobInvoice,
      ownerJobInvoice,
      status,
      evidences,
      resultResume,
      disputeLoads,
    };
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';

import { AnaliticsService } from './analitics.service';
import { CurrentUser } from '../user/current-user.decorator';
import { Owner } from '../user/owner.model';
import { Contractor } from '../user/contractor.model';
import { UserRole } from '../user/user.model';
import { FailureStringResponse } from '../common/response.model';
import { HasRole } from '../auth/has-role.guard';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard('jwt'))
@Controller('analitics')
export class AnaliticsOwnerController {
  constructor(private readonly analiticsService: AnaliticsService) {}

  @Get('owner')
  @UseGuards(HasRole(UserRole.OWNER))
  async getOwnerAnalitics(@CurrentUser() user: Owner): Promise<any> {
    const response = await this.analiticsService.getOwnerAnalitics(user);
    return response;
  }

  @Get('contractor')
  // @UseGuards(HasRole(UserRole.CONTRACTOR))
  async getContractorAnalitics(@CurrentUser() user: Contractor): Promise<any> {
    const response = await this.analiticsService.getContractorAnalitics(user);
    return response;
  }
}

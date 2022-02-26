import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { AuthCommonController } from '../../auth-common.controller';
import { User, UserRole } from '../../../user/user.model';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { RegisterContractorDTO } from '../../dto/register-contractor.dto';
import { HasRole } from '../../has-role.guard';
import { RegisterDispatcherDTO } from './dto/register-dispatcher.dto';
import { RegisterForemanDTO } from './dto/register-foreman.dto';
import { CurrentUser } from '../../../user/current-user.decorator';

@Controller('contractor/auth')
export class AuthContractorController extends AuthCommonController(
  UserRole.CONTRACTOR,
) {
  @ApiOperation({
    summary: 'Register new owner',
    description:
      "Creates a new owner without verifying email. Sends a verification email to owner's email address.",
  })
  @ApiCreatedResponse({
    description: 'Message requesting email verification',
    type: SuccessStringResponse,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    type: FailureStringResponse,
  })
  @Post('register')
  async register(@Body() user: RegisterContractorDTO): Promise<string> {
    await this.authService.registerContractor(user.toModel());
    return 'A verification email has been sent';
  }

  @ApiOperation({
    summary: 'Register Dispatcher',
    description:
      'Creates a dispatcher account and associates it to the owner that called this endpoint. Sends an email to dispatcher with their account credentials',
  })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
  @Post('register-dispatcher')
  async registerDispatcher(
    @Body() dispatcher: RegisterDispatcherDTO,
      @CurrentUser() owner: User,
  ): Promise<string> {
    await this.authService.registerDispatcher(dispatcher, owner);
    return `An email has been sent to ${dispatcher.email}`;
  }

  @ApiOperation({
    summary: 'Register Foreman',
    description:
      'Creates a foreman account and associates it to the owner that called this endpoint. Sends an email to foreman with their account credentials',
  })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
  @Post('register-foreman')
  async registerForeman(
    @Body() foreman: RegisterForemanDTO,
      @CurrentUser() owner: User,
  ): Promise<string> {
    await this.authService.registerForeman(foreman, owner);
    return `An email has been sent to ${foreman.email}`;
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthCommonController } from '../../auth-common.controller';
import { UserRole, User } from '../../../user/user.model';
import { RegisterDriverDTO } from './dto/register-driver.dto';
import { HasRole } from '../../has-role.guard';
import { CurrentUser } from '../../../user/current-user.decorator';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { RegisterOwnerDTO } from '../../dto/register-owner.dto';

@Controller('owner/auth')
export class AuthOwnerController extends AuthCommonController(UserRole.OWNER) {
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
  async register(@Body() user: RegisterOwnerDTO): Promise<string> {
    await this.authService.registerOwner(user.toModel());
    return 'A verification email has been sent';
  }

  @ApiOperation({
    summary: 'Register Driver',
    description:
      'Creates a driver account and associates it to the owner that called this endpoint. Sends an email to driver with their account credentials',
  })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard(), HasRole(UserRole.OWNER))
  @Post('register-driver')
  async registerDriver(
    @Body() driver: RegisterDriverDTO,
      @CurrentUser() owner: User,
  ): Promise<string> {
    await this.authService.registerDriver(driver, owner);
    return `An email has been sent to ${driver.email}`;
  }
}

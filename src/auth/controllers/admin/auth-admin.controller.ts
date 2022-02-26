import { Body, Controller, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import {
  ApiAcceptedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthCommonController } from '../../auth-common.controller';
import { UserRole } from '../../../user/user.model';
import { HasRole } from '../../has-role.guard';
import { SetAs } from './dto/set-as.dto';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { IsNotSupportGuard } from './is-not-support.guard';
import { LoginAs } from './dto/login-as-dto';

const IsAdmin = HasRole(UserRole.ADMIN);

@Controller('admin/auth')
export class AuthAdminController extends AuthCommonController(UserRole.ADMIN, {
  disableResendVerif: true,
  disableVerifyEmail: true,
}) {
  @ApiOperation({
    summary: 'Set User as Admin',
    description: "Sets a User's role as ADMIN and automatically verfies email",
  })
  @ApiAcceptedResponse({
    description: 'Confirmation message',
    type: SuccessStringResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Not logged in',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Logged in User is not Admin or is Support (Readonly Admin)',
    type: FailureStringResponse,
  })
  @ApiNotFoundResponse({
    description: 'User with specified email does not exist',
    type: FailureStringResponse,
  })
  @UseGuards(AuthGuard(), IsAdmin, IsNotSupportGuard)
  @Patch('set-as-admin')
  async setAsAdmin(@Body() { email }: SetAs): Promise<string> {
    await this.authService.setAsAdmin(email);
    return `User with email ${email} set as Admin`;
  }

  @ApiOperation({
    summary: 'Set User as Support',
    description:
      "Sets a User's role as ADMIN and automatically verfies email, but sets readonly as true. user.readonly only allows a admin to use endpoints that don't modify content",
  })
  @ApiAcceptedResponse({
    description: 'Confirmation message',
    type: SuccessStringResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Not logged in',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Logged in User is not Admin or is Support (Readonly Admin)',
    type: FailureStringResponse,
  })
  @ApiNotFoundResponse({
    description: 'User with specified email does not exist',
    type: FailureStringResponse,
  })
  @UseGuards(AuthGuard(), IsAdmin, IsNotSupportGuard)
  @Patch('set-as-support')
  async setAsSupport(@Body() { email }: SetAs): Promise<string> {
    await this.authService.setAsSupport(email);
    return `User with email ${email} set as readonly Admin`;
  }

  @ApiOperation({
    summary: 'Login as an owner',
    description:
      'Allow an admin to login as an owner by email to use his account.',
  })
  @ApiAcceptedResponse({
    description: "Return an owner account's JWT for Bearer auth.",
    type: SuccessStringResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Attempting to use endpoints with the wrong role',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Attempting to use endpoints with the wrong role',
    type: FailureStringResponse,
  })
  @ApiNotFoundResponse({
    description: 'User with specified email does not exist',
    type: FailureStringResponse,
  })
  @Post('login-as-owner')
  async loginAsOwner(
    @Body() { email }: LoginAs,
      @Req() req: Request,
  ): Promise<string> {
    const userAgent = req.get('User-Agent');
    return this.authService.loginAsRole(email, UserRole.OWNER, userAgent);
  }

  @ApiOperation({
    summary: 'Login as a contractor',
    description:
      'Allow an admin to login as a contractor by email to use his account.',
  })
  @ApiAcceptedResponse({
    description: "Return a contractor account's JWT for Bearer auth.",
    type: SuccessStringResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'Attempting to use endpoints with the wrong role',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Attempting to use endpoints with the wrong role',
    type: FailureStringResponse,
  })
  @ApiNotFoundResponse({
    description: 'User with specified email does not exist',
    type: FailureStringResponse,
  })
  @Post('login-as-contractor')
  async loginAsContractor(
    @Body() { email }: LoginAs,
      @Req() req: Request,
  ): Promise<string> {
    const userAgent = req.get('User-Agent');
    return this.authService.loginAsRole(email, UserRole.CONTRACTOR, userAgent);
  }
}

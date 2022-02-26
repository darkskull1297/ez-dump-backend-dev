import {
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Patch,
  Res,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiAcceptedResponse,
  ApiUnauthorizedResponse,
  ApiProperty,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { UserRole, User } from '../user/user.model';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';

import { CurrentUser } from '../user/current-user.decorator';
import {
  SuccessResponse,
  FailureStringResponse,
  SuccessStringResponse,
} from '../common/response.model';
import { ResendVerificationDTO } from './dto/resend-verification.dto';
import { asTitle, ConditionalDecorator } from '../util';
import { AuthCommon } from './auth-common.interface';
import { ChangePasswordDTO } from './dto/change-password.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { Owner } from '../user/owner.model';
import { UserMeDTO } from '../user/dto/user-me.dto';
import { Contractor } from '../user/contractor.model';
import { DriverDTO } from '../user/dto/driver-dto';
import { Driver } from '../user/driver.model';

class SuccessUserResponse extends SuccessResponse<User> {
  @ApiProperty({ description: 'User details' })
  data: User;
}

interface AuthCommonControllerOptions {
  disableRegister?: boolean;
  disableLogin?: boolean;
  disableMe?: boolean;
  disableVerifyEmail?: boolean;
  disableResendVerif?: boolean;
  disableChangePassword?: boolean;
  disableForgotPassword?: boolean;
  disableResetPassword?: boolean;
}

export function AuthCommonController(
  userRole: UserRole,
  options: AuthCommonControllerOptions = {},
): AuthCommon {
  const roleStr = UserRole[userRole].toLowerCase();
  const roleStrTitle = asTitle(roleStr);

  @ApiTags('auth')
  @ApiInternalServerErrorResponse({
    description: 'Server-side issue',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Attempting to use endpoints with the wrong role',
    type: FailureStringResponse,
  })
  abstract class AuthCommonControllerHost {
    constructor(protected readonly authService: AuthService) {}

    @ConditionalDecorator(
      !options.disableLogin,
      ApiOperation({
        summary: `Login verified ${roleStrTitle}`,
        description: `Returns the ${roleStr}'s JWT for Bearer auth. Will not return token if ${roleStr} is not verified`,
      }),
    )
    @ConditionalDecorator(
      !options.disableLogin,
      ApiAcceptedResponse({
        description: 'Bearer Auth JWT',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableLogin,
      ApiUnauthorizedResponse({
        description: 'Invalid credentials',
        type: FailureStringResponse,
      }),
    )
    // @ConditionalDecorator(!options.disableLogin, Post('login'))
    @ConditionalDecorator(true, Post('login'))
    async login(
      @Body() { email, password }: LoginDTO,
        @Req() req: Request,
    ): Promise<string> {
      const userAgent = req.get('User-Agent');
      const response = await this.authService.login(
        email,
        password,
        userRole,
        userAgent,
      );
      return response;
    }

    @ConditionalDecorator(
      !options.disableMe,
      ApiOperation({
        summary: `Current ${roleStrTitle}`,
        description: `Returns the details for the currently logged in ${roleStrTitle}`,
      }),
    )
    @ConditionalDecorator(!options.disableMe, ApiBearerAuth('authorization'))
    @ConditionalDecorator(
      !options.disableMe,
      ApiAcceptedResponse({
        description: `${roleStrTitle} Details`,
        type: SuccessUserResponse,
      }),
    )
    @ConditionalDecorator(!options.disableMe, UseGuards(AuthGuard()))
    @ConditionalDecorator(!options.disableMe, Get('me'))
    async me(
      @CurrentUser() user: User,
        @Req() req: Request,
    ): Promise<UserMeDTO> {
      const token = req.headers.authorization.replace('Bearer ', '');

      if (user.role !== UserRole.OWNER)
        await this.authService.validateUser(token);

      if (user.role === UserRole.OWNER) {
        const { verifiedByAdmin } = user as Owner;
        return UserMeDTO.fromModel(user, verifiedByAdmin);
      }
      if (user.role === UserRole.CONTRACTOR) {
        const { verifiedByAdmin } = user as Contractor;
        return UserMeDTO.fromModel(user, verifiedByAdmin);
      }

      if (user.role === UserRole.DRIVER) {
        return DriverDTO.fromModel(user as Driver);
      }

      return UserMeDTO.fromModel(user, true);
    }

    @ConditionalDecorator(
      !options.disableVerifyEmail,
      ApiOperation({
        summary: 'Verify Email',
        description: 'Endpoint that is called from the verification email.',
      }),
    )
    @ConditionalDecorator(
      !options.disableVerifyEmail,
      ApiAcceptedResponse({
        description: 'Verification Message',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableVerifyEmail,
      ApiUnauthorizedResponse({
        description: 'Invalid token',
        type: FailureStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableVerifyEmail,
      Get('verify-email/:token'),
    )
    async verifyEmail(
      @Param('token') token: string,
        @Res() response: Response,
    ): Promise<void> {
      const url = this.authService.getAdminUrl();
      try {
        await this.authService.verifyEmail(token, userRole);
        response.redirect(`${url}/login?emailVerified=true`);
      } catch (error) {
        response.redirect(`${url}/login?emailVerified=false`);
      }
    }

    @ConditionalDecorator(
      !options.disableResendVerif,
      ApiOperation({
        summary: 'Resend Verification',
        description: `Resends verification email is ${roleStr} is not already verified`,
      }),
    )
    @ConditionalDecorator(
      !options.disableResendVerif,
      ApiCreatedResponse({
        description: 'Email sent verification',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableResendVerif,
      ApiBadRequestResponse({
        description: 'Email already verified',
        type: FailureStringResponse,
      }),
    )
    @ConditionalDecorator(!options.disableResendVerif, Post('resend-verif'))
    async resendVerification(
      @Body() { email }: ResendVerificationDTO,
    ): Promise<string> {
      return this.authService.resendVerification(email);
    }

    @ConditionalDecorator(
      !options.disableChangePassword,
      ApiOperation({
        summary: 'Change Password',
        description: `Used to change a logged in ${roleStr}'s password`,
      }),
    )
    @ConditionalDecorator(
      !options.disableChangePassword,
      ApiAcceptedResponse({
        description: 'Bearer Auth JWT',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableChangePassword,
      ApiUnauthorizedResponse({
        description: 'Not logged in',
        type: FailureStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableChangePassword,
      ApiBearerAuth('authorization'),
    )
    @ConditionalDecorator(
      !options.disableChangePassword,
      UseGuards(AuthGuard()),
    )
    @ConditionalDecorator(
      !options.disableChangePassword,
      Patch('change-password'),
    )
    async changePassword(
      @CurrentUser() user: User,
        @Body() { oldPassword, newPassword }: ChangePasswordDTO,
    ): Promise<string> {
      return this.authService.changePassword(user, oldPassword, newPassword);
    }

    @ConditionalDecorator(
      !options.disableForgotPassword,
      ApiOperation({
        summary: 'Forgot Password',
        description: 'Endpoint that is called when user forgot password.',
      }),
    )
    @ConditionalDecorator(
      !options.disableForgotPassword,
      ApiAcceptedResponse({
        description: 'Verification Message',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableForgotPassword,
      Post('forgot-password'),
    )
    async forgotPassword(
      @Body() { email }: ForgotPasswordDTO,
    ): Promise<string> {
      await this.authService.forgotPassword(email, userRole);
      return 'Email with link to change password has been sent';
    }

    @ConditionalDecorator(
      !options.disableForgotPassword,
      ApiOperation({
        summary: 'Forgot Password',
        description: 'Endpoint that is called when user forgot password.',
      }),
    )
    @ConditionalDecorator(
      !options.disableForgotPassword,
      ApiAcceptedResponse({
        description: 'Verification Message',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableForgotPassword,
      Post('forgot-password/app'),
    )
    async forgotPasswordApp(
      @Body() { email }: ForgotPasswordDTO,
    ): Promise<string> {
      await this.authService.forgotPassword(email, userRole, 'app');
      return 'Email with a new temporary password has been sent';
    }

    @ConditionalDecorator(
      !options.disableResetPassword,
      ApiOperation({
        summary: 'Reset Password',
        description: 'Reset password',
      }),
    )
    @ConditionalDecorator(
      !options.disableResetPassword,
      ApiAcceptedResponse({
        description: 'Verification Message',
        type: SuccessStringResponse,
      }),
    )
    @ConditionalDecorator(
      !options.disableResetPassword,
      Post('reset-password/:token'),
    )
    async resetPassword(
      @Param('token') token: string,
        @Body() { newPassword }: ChangePasswordDTO,
    ): Promise<string> {
      await this.authService.resetPassword(token, newPassword);
      return 'Email with link to change password has been sent';
    }
  }

  return AuthCommonControllerHost as any;
}

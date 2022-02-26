import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, } from '@nestjs/swagger';

import { AuthGuard } from '@nestjs/passport';
import { AuthCommonController } from '../../auth-common.controller';
import { UserRole } from '../../../user/user.model';
import { HasRole } from '../../has-role.guard';
import { RegisterForemanDTO } from '../contractor/dto/register-foreman.dto';
import { CurrentUser } from '../../../user/current-user.decorator';
import { Dispatcher } from '../../../user/dispatcher.model';

@Controller('dispatcher/auth')
export class AuthDispatcherController extends AuthCommonController(
  UserRole.DISPATCHER,
) {
  @ApiOperation({
    summary: 'Register Foreman',
    description:
      'Creates a foreman account and associates it to the owner that called this endpoint. Sends an email to foreman with their account credentials',
  })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard(), HasRole(UserRole.DISPATCHER))
  @Post('register-foreman')
  async registerForeman(
    @Body() foreman: RegisterForemanDTO,
      @CurrentUser() user: Dispatcher,
  ): Promise<string> {
    const contractor = await this.authService.getUser(
      (await user.contractorCompany.contractor).id,
    );
    await this.authService.registerForeman(foreman, contractor);
    return `An email has been sent to ${foreman.email}`;
  }
}

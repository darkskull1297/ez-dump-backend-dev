import { Controller, UseGuards, Patch, Body, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '../../user.model';
import { CurrentUser } from '../../current-user.decorator';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserService } from '../../user.service';
import { UserDTO } from '../../dto/user.dto';
import { ContractorCompanyDTO } from '../../../company/dto/contractor-company.dto';

@ApiTags('user')
@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.FOREMAN))
@Controller('foreman/user')
export class UserForemanController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get all active drivers',
    description: 'Returns all active drivers, for sending a difussion message',
  })
  @Get('all-drivers/active')
  async getAllActiveDrivers(@CurrentUser() user: User): Promise<any[]> {
    const drivers = await this.userService.getAllDriversForContractorCompany(
      user,
    );

    return drivers.map(driver => {
      const obj = {
        jobId: '',
        id: driver.id,
      };
      driver.assignations.forEach(assignation => {
        obj.jobId = assignation.scheduledJob.job.id;
      });
      return obj;
    });
  }

  @ApiOperation({
    summary: 'Update Foreman',
    description:
      'Allows an foreman to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Foreman profile',
    type: UserDTO,
  })
  @Patch('/:id')
  async updateSelf(
    @CurrentUser() { id }: User,
      @Body() body: any,
  ): Promise<UserDTO> {
    // console.log('foreman',id)
    // console.log('body',body)
    const user = await this.userService.updateUserForeman(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get the user company profile info',
    description: 'Allows a contractor to view company profile',
  })
  @Get('/company')
  async getProfile(@CurrentUser() user: User): Promise<ContractorCompanyDTO> {
    const company = await this.userService.getContractorCompanyDetails(user);
    return ContractorCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Logout user from admin dashboard',
    description: 'Allows the admin to logout user from a device',
  })
  @ApiAcceptedResponse({
    description: 'Successfully logged out',
    type: String,
  })
  @Patch(':id/logout')
  async logoutUserFromAdmin(@Param('id') id: string): Promise<string> {
    return this.userService.logoutUser(id);
  }

  @Get('is-disable/:id')
  async GetUser(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserDisabled(id);
  }

  @Get('is-restricted/:id')
  async getIsRestricted(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserRestricted(id);
  }
}

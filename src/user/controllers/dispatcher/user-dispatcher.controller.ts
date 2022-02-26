import {
  Controller,
  UseGuards,
  Query,
  Patch,
  Body,
  Param,
  Get,
  Delete,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiAcceptedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '../../user.model';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserService } from '../../user.service';
import { UserDTO } from '../../dto/user.dto';
import { CurrentUser } from '../../current-user.decorator';
import { Foreman } from '../../foreman.model';
import { ForemanDTO } from '../../dto/foreman-dto';
import { UpdateUserDTO } from '../../dto/user-update.dto';

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
@UseGuards(AuthGuard(), HasRole(UserRole.DISPATCHER))
@Controller('dispatcher/user')
export class UserDispatcherController {
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
    summary: 'Get messages with user data',
    description: 'Get messages with user data',
  })
  @Post('/messages')
  async getMessagesUsers(@Body() { messages }: any): Promise<any> {
    const response = await this.userService.getMessagesWithUsers(messages);
    return response;
  }

  @ApiOperation({
    summary: 'Get the Foremans that work for the Contractor of Dispatcher',
    description: 'Allows a Dispatcher to view the details of the Foremans',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "Foreman's Profiles",
    type: [ForemanDTO],
  })
  @Get('/foremans')
  async ForemanList(
    @Query('skip') skip = 0,
    @Query('count') count = 10,
    @CurrentUser() user: User,
  ): Promise<ForemanDTO[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const foremans = await this.userService.getContractorForemans(contractor, {
      skip,
      count,
    });
    return Promise.all(
      foremans.map(foreman => ForemanDTO.fromModel(foreman as Foreman)),
    );
  }

  @ApiOperation({
    summary: 'Remove User',
    description: 'Allows a Dispatcher to remove one of its user',
  })
  @ApiAcceptedResponse({
    description: 'Deleted',
    type: Boolean,
  })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.userService.removeUser(id);
  }

  @ApiOperation({
    summary: 'Update User',
    description: 'Allows a Dispatcher to update another user profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update User Information',
    type: UserDTO,
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
      @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateDisptacher(id, body);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Dispatcher',
    description:
      'Allows a Dispatcher to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Dispatcher Information',
    type: UserDTO,
  })
  @Patch('account/:id')
  async updateAccount(
    @Param('id') id: string,
      @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateAccount(id, body);
    return UserDTO.fromModel(user);
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

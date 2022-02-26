import { Controller, Body, Patch, UseGuards, Get, Param } from '@nestjs/common';
import {
  PickType,
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '../../user.model';
import { UpdateUserDTO } from '../../dto/user-update.dto';
import { CurrentUser } from '../../current-user.decorator';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserService } from '../../user.service';
import { UserDTO } from '../../dto/user.dto';
import { Owner } from '../../owner.model';
import { ForemanDTO } from '../../dto/foreman-dto';
import { DispatcherDTO } from '../../dto/dispatcher-dto';
import { Contractor } from '../../contractor.model';

class UpdateDriverDTO extends PickType<any, string>(UpdateUserDTO, [
  'name',
  'profileImg',
  'deviceID',
] as const) {}

@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.DRIVER))
@ApiTags('user')
@Controller('driver/user')
export class UserDriverController {
  constructor(public readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Update Driver',
    description: 'Allows a driver to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Driver profile',
    type: UserDTO,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
    type: FailureStringResponse,
  })
  @ApiForbiddenResponse({
    description: 'Invalid Role',
    type: FailureStringResponse,
  })
  @Patch()
  async update(
    @CurrentUser() { id }: User,
      @Body() body: UpdateDriverDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(
      id,
      body as any,
      body.deviceID,
    );
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get image upload url',
    description: 'Returns the url to upload a medical card image',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: SuccessStringResponse,
  })
  @Get('image')
  getUpdateProfileImageUrl(@CurrentUser() { id }: User): Promise<string> {
    return this.userService.getUpdateProfileImageLink(id);
  }

  @ApiOperation({
    summary: 'Get info for sqlite',
    description: 'Returns user info for sqlite and offline login',
  })
  @Get('/info/:email')
  async getDriverInfo(@Param('email') email: string): Promise<UserDTO> {
    console.log('USER EMAIL HERE', email);

    const user = await this.userService.getDriverInfoForOfflineProfile(email);

    if (!user) return null;

    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get owner',
    description: 'Returns the driver owner',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: Owner,
  })
  @Get('owner/:driverId')
  getOwnerFromDriver(@Param('driverId') driverId: string): Promise<Owner> {
    return this.userService.getOwnerFromDriver(driverId);
  }

  @ApiOperation({
    summary: 'Get contractor',
    description: 'Returns the driver contractor',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: Contractor,
  })
  @Get('contractor/:jobId')
  getContractorFromDriver(@Param('jobId') jobId: string): Promise<Contractor> {
    return this.userService.getContractorFromDriver(jobId);
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

  @ApiOperation({
    summary: 'Get the foremans that work for contractor',
    description: 'Allows a driver to get contractor foremans',
  })
  @ApiAcceptedResponse({
    description: "foreman's profiles",
    type: [ForemanDTO],
  })
  @Get('/contractor/foremans/:contractorId')
  async foremanList(
    @Param('contractorId') contractorId: string,
  ): Promise<ForemanDTO[]> {
    const foremans = await this.userService.getContractorForemansFromDriver(
      contractorId,
    );
    return Promise.all(foremans.map(foreman => ForemanDTO.fromModel(foreman)));
  }

  @ApiOperation({
    summary: 'Get the dispatchers that work for the contractor',
    description: 'Allows a driver to view the details of the dispatchers',
  })
  @ApiAcceptedResponse({
    description: "Dispatcher's profiles",
    type: [DispatcherDTO],
  })
  @Get('/contractor/dispatchers/:contractorId')
  async dispatcherList(
    @Param('contractorId') contractorId: string,
  ): Promise<DispatcherDTO[]> {
    const dispatchers = await this.userService.getContractorDispatchersFromDriver(
      contractorId,
    );
    return Promise.all(
      dispatchers.map(dispatcher => DispatcherDTO.fromModel(dispatcher)),
    );
  }

  @ApiOperation({
    summary: 'Get the admins',
    description: 'Allows a driver to get admins',
  })
  @ApiAcceptedResponse({
    description: 'Admins',
    type: [UserDTO],
  })
  @Get('/admin')
  async adminList(): Promise<UserDTO[]> {
    const admins = await this.userService.getAdminsFromDriver();
    return Promise.all(admins.map(dispatcher => UserDTO.fromModel(dispatcher)));
  }

  @Get('is-disable/:id')
  async GetUser(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserDisabled(id);
  }

  @Get('is-restricted/:id')
  async getIsRestricted(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserRestricted(id);
  }

  @ApiOperation({
    summary: 'Get Driver info',
    description: 'Allows a driver to get user info for offline utilities',
  })
  @ApiAcceptedResponse({
    description: 'Info',
    type: [User],
  })
  @Get('/info/:email')
  dminList(@Param('email') email: string): Promise<User> {
    return this.userService.getDriverInfoForOfflineProfile(email);
  }
}

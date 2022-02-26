import {
  Controller,
  UseGuards,
  Get,
  Query,
  Delete,
  Param,
  Patch,
  Body,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiAcceptedResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '../../user.model';
import { HasRole } from '../../../auth/has-role.guard';
import { IsNotSupportGuard } from '../../../auth/controllers/admin/is-not-support.guard';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { UserService } from '../../user.service';
import { UserDTO } from '../../dto/user.dto';
import { UpdateUserDTO } from '../../dto/user-update.dto';
import { OwnerDTO } from '../../dto/owner-dto';
import { OwnerCompanyDTO } from '../../../company/dto/owner-company.dto';
import { Owner } from '../../owner.model';
import { Contractor } from '../../contractor.model';
import { ContractorDTO } from '../../dto/contractor-dto';
import { ContractorCompanyDTO } from '../../../company/dto/contractor-company.dto';
import { DispatcherDTO } from '../../dto/dispatcher-dto';
import { Dispatcher } from '../../dispatcher.model';
import { DriverDTO } from '../../dto/driver-dto';
import { Driver } from '../../driver.model';
import { OwnerPriorityDTO } from '../../dto/owner-priority-dto';
import { OwnerUpdateDTO } from '../../dto/owner-update-dto';
import { ContractorUpdateDTO } from '../../dto/contractor-update-dto';
import { DispatcherUpdateDTO } from '../../dto/dispatcher-update-dto';
import { ForemanUpdateDTO } from '../../dto/foreman-update-dto';
import { DriverUpdateDTO } from '../../dto/driver-update.dto';
import { TruckDTO } from '../../../trucks/dto/truck.dto';
import { TruckService } from '../../../trucks/truck.service';
import { UpdateTruckDTO } from '../../../trucks/dto/update-truck.dto';
import { CurrentUser } from '../../current-user.decorator';

@ApiTags('user')
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiBearerAuth('authorization')
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@Controller('admin/user')
export class UserAdminController {
  constructor(
    private readonly userService: UserService,
    private readonly truckService: TruckService,
  ) {}

  @ApiOperation({
    summary: 'get associate users',
    description: 'Allows admin to get associated users',
  })
  @Get('associated')
  async getAssociateUsers(): Promise<
  { contractor: Contractor; owner: Owner }[]
  > {
    const response = await this.userService.getAssociateUsers();
    return response;
  }

  @ApiOperation({
    summary: 'Get all active drivers',
    description: 'Returns all active drivers, for sending a difussion message',
  })
  @Get('all-drivers/active')
  async getAllActiveDrivers(): Promise<any[]> {
    const drivers = await this.userService.getAllActiveDrivers();

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
    summary: 'delete associate users',
    description: 'Allows admin to delete associated users',
  })
  @Delete('associated/:contractorId/:ownerId')
  async deleteAssociateUsers(
    @Param('contractorId') contractorId: string,
      @Param('ownerId') ownerId: string,
  ): Promise<boolean> {
    const response = await this.userService.removeAssociateUsers(
      contractorId,
      ownerId,
    );
    return response;
  }

  @ApiOperation({
    summary: 'associate users',
    description: 'Allows admin to associate users',
  })
  @ApiOkResponse({
    description: 'Success',
    type: Boolean,
  })
  @Post('associated')
  async associateUsers(
    @Body()
      { contractorId, ownerId }: { contractorId: string; ownerId: string },
  ): Promise<boolean> {
    console.log('HERE', contractorId, ownerId);
    const response = await this.userService.associateUsers(
      contractorId,
      ownerId,
    );
    return response;
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
    summary: 'Update Contractor information',
    description: 'Allows admin to update contractor information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @Patch('/contractor/:id')
  async changeContractorInformation(
    @Param('id') id: string,
      @Body() body: ContractorUpdateDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get all foremans',
    description: "Get all foreman information with its company",
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('foremans')
  async getAllForemans(): Promise<any> {
    const data = await this.userService.getAllForemans();
    data.map((foreman, index) => {
      let status = foreman.isRestricted
        ? 'Restricted'
        : foreman.isDisable
        ? 'Disabled'
        : 'Active';

      data[index].status = status;
    })

    return data;
  }

  @ApiOperation({
    summary: 'Get the users that drive for the logged user',
    description: 'Allows an owner to view the details of the drivers',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "Owner's profiles",
    type: [OwnerDTO],
  })
  @Get('owners')
  async getOwners(): Promise<OwnerDTO[]> {
    const owners = await this.userService.getAllOwnersForAdmin();
    return owners.map(owner => OwnerDTO.fromModel(owner as Owner));
  }

  @ApiOperation({
    summary: 'Get all contractors',
    description: 'Gets all contractors',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "Contractor's profiles",
    type: [ContractorDTO],
  })
  @Get('contractors')
  async getContractors(): Promise<ContractorDTO[]> {
    const contractors = await this.userService.getAllContractors();
    return Promise.all(
      contractors.map(contractor =>
        ContractorDTO.fromModel(contractor as Contractor),
      ),
    );
  }

  @ApiOperation({
    summary: 'Get all dispatchers',
    description: 'Allows an admin to view all the dispatchers',
  })
  @ApiAcceptedResponse({
    description: "Dispatchers' profiles",
    type: [DispatcherDTO],
  })
  @Get('dispatchers')
  async getDispatchers(): Promise<DispatcherDTO[]> {
    const dispatchers = await this.userService.getAllDispatchers();
    return Promise.all(
      dispatchers.map(dispatcher =>
        DispatcherDTO.fromModel(dispatcher as Dispatcher),
      ),
    );
  }

  @ApiOperation({
    summary: 'Get all drivers',
    description: 'Allows an admin to view all drivers',
  })
  @ApiAcceptedResponse({
    description: "Driver's profiles",
    type: [DriverDTO],
  })
  @Get('drivers')
  async getDrivers(): Promise<DriverDTO[]> {
    const drivers = await this.userService.getAllDriversWithCompany();
    return Promise.all(
      drivers.map(driver => DriverDTO.fromModel(driver as Driver)),
    );
  }

  @ApiOperation({
    summary: 'Get the user with the requested id',
    description: 'Allows an admin to view the details of any user',
  })
  @ApiAcceptedResponse({
    description: 'User profile',
    type: UserDTO,
  })
  @Get(':id')
  async get(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get list of all users',
  })
  @ApiOkResponse({
    description: 'Returns list of users profiles',
    type: [UserDTO],
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: UserRole,
    description: 'Used to filter by specific role',
  })
  @Get()
  async list(
    @Query('skip') skip = 0,
    @Query('count') count = 10,
    @Query('type') type?: UserRole,
  ): Promise<UserDTO[]> {
    const users = await this.userService.getAll(type ? { role: type } : {}, {
      skip,
      count,
    });
    return users.map(user => UserDTO.fromModel(user));
  }

  @ApiOperation({
    summary: 'Update User',
    description: 'Allows an Admin to update another user profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update User Information',
    type: UserDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
      @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Remove User',
    description: 'Allows an admin to remove a driver',
  })
  @ApiAcceptedResponse({
    description: 'Remove user',
    type: Boolean,
  })
  @UseGuards(IsNotSupportGuard)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.userService.removeUser(id);
  }

  @ApiOperation({
    summary: 'Get the user company profile info with the requested id',
    description: 'Allows an admin to view company profile',
  })
  @ApiAcceptedResponse({
    description: 'User company profile',
    type: UserDTO,
  })
  @Get('/owner/:id/company')
  async getProfile(@Param('id') id: string): Promise<OwnerCompanyDTO> {
    const user = await this.userService.getUser(id);
    const company = await this.userService.getUserCompanyDetails(user);
    return OwnerCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Get the user company profile info with the requested id',
    description: 'Allows an admin to view company profile',
  })
  @ApiAcceptedResponse({
    description: 'User company profile',
    type: UserDTO,
  })
  @Get('/contractor/:id/company')
  async getContractorCompany(
    @Param('id') id: string,
  ): Promise<ContractorCompanyDTO> {
    const user = await this.userService.getUser(id);
    const company = await this.userService.getContractorCompanyDetails(user);
    return ContractorCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Verfiy Owner',
    description: 'Allows an admin to verify a owner',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:id/verify')
  async verifyOwner(@Param('id') id: string): Promise<string> {
    await this.userService.verifyOwner(id);
    return 'Owner verified';
  }

  @ApiOperation({
    summary: 'Unverify Owner',
    description: 'Allows an admin to decline a owner',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:id/un-verify')
  async declineOwner(@Param('id') id: string): Promise<string> {
    await this.userService.unVerifyOwner(id);
    return 'Owner unverified';
  }

  @ApiOperation({
    summary: 'Verfiy Contractor',
    description: 'Allows an admin to verify a contractor',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/contractor/:id/verify')
  async verifyContractor(@Param('id') id: string): Promise<string> {
    await this.userService.verifyContractor(id);
    return 'Contractor verified';
  }

  @ApiOperation({
    summary: 'Unverify Contractor',
    description: 'Allows an admin to decline a contractor',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/contractor/:id/un-verify')
  async declineContractor(@Param('id') id: string): Promise<string> {
    await this.userService.unVerifyContractor(id);
    return 'Contractor unverified';
  }

  @ApiOperation({
    summary: 'Set owner priority',
    description: 'Allows an admin to set an owner priority',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:id/priority')
  async setOwnerPriority(
    @Param('id') id: string,
      @Body() { priority }: OwnerPriorityDTO,
  ): Promise<string> {
    await this.userService.changeOwnerPriority(id, priority);
    return 'Owner priority changed';
  }

  // @ApiOperation({
  //   summary: 'Set owner discount',
  //   description: 'Allows an admin to set an owner discount',
  // })
  // @ApiOkResponse({
  //   description: 'Message',
  //   type: String,
  // })
  // @UseGuards(IsNotSupportGuard)
  // @Patch('/owner/:id/discount')
  // async setOwnerDiscount(@Param('id') id: string): Promise<string> {
  //   await this.userService.changeOwnerDiscount(id);
  //   return 'Owner discount changed';
  // }

  // @ApiOperation({
  //   summary: 'Set contractor discount',
  //   description: 'Allows an admin to set an contractor discount',
  // })
  // @ApiOkResponse({
  //   description: 'Message',
  //   type: String,
  // })
  // @UseGuards(IsNotSupportGuard)
  // @Patch('/contractor/:id/discount')
  // async setContractorDiscount(@Param('id') id: string): Promise<string> {
  //   await this.userService.changeContractorDiscount(id);
  //   return 'Owner discount changed';
  // }

  @ApiOperation({
    summary: 'Get the Owner information',
    description: 'Allows admin to retrieve owner information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: UserDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/owner/:id')
  async getOwnerInformation(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Owner information',
    description: 'Allows admin to update owner information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:id')
  async changeOwnerInformation(
    @Param('id') id: string,
      @Body() body: OwnerUpdateDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get the Contractor information',
    description: 'Allows admin to retrieve contractor information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: UserDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/contractor/:id')
  async getContractorInformation(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get the Dispatcher information',
    description: 'Allows admin to retrieve dispatcher information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: UserDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/dispatcher/:id')
  async getDispatcherInformation(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Dispatcher information',
    description: 'Allows admin to update dispatcher information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/dispatcher/:id')
  async changeDispatcherInformation(
    @Param('id') id: string,
      @Body() body: DispatcherUpdateDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get the Foreman information',
    description: 'Allows admin to retrieve foreman information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: UserDTO,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/foreman/:id')
  async getForemanInformation(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Foreman information',
    description: 'Allows admin to update foreman information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/foreman/:id')
  async changeForemanInformation(
    @Param('id') id: string,
      @Body() body: ForemanUpdateDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Get Driver information',
    description: 'Allows admin to retrieve Driver information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/driver/:id')
  async getDriverInformation(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Driver information',
    description: 'Allows admin to update Driver information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/driver/:id')
  async changeDriverInformation(
    @Param('id') id: string,
      @Body() body: DriverUpdateDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(id, body as any);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Disable Driver',
    description: 'Allows an Admin to disable a Driver',
  })
  @ApiAcceptedResponse({
    description: 'Disabled Driver',
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('driver/:id/disable')
  async disableDriver(@Param('id') id: string): Promise<any> {
    return this.userService.disableDriver(id);
  }

  @ApiOperation({
    summary: 'Get truck information',
    description: 'Allows admin to retrieve truck information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Get('/truck/:id')
  async getTruckInformation(@Param('id') id: string): Promise<TruckDTO> {
    const truck = await this.truckService.get(id);
    return TruckDTO.fromModel(truck);
  }

  @ApiOperation({
    summary: 'Update truck information',
    description: 'Allows admin to update truck information',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/truck/:id')
  async changeTruckInformation(
    @Param('id') id: string,
      @Body() body: UpdateTruckDTO,
  ): Promise<TruckDTO> {
    const truck = await this.truckService.updateTruck(id, body as any);
    return TruckDTO.fromModel(truck);
  }

  @ApiOperation({
    summary: 'Logout user from admin dashboard',
    description: 'Allows the admin to logout user from a device',
  })
  @ApiOkResponse({
    description: 'Successfully logged out',
    type: String,
  })
  @Patch(':id/logout')
  async logoutUserFromAdmin(@Param('id') id: string): Promise<string> {
    return this.userService.logoutUser(id);
  }

  @ApiOperation({
    summary: 'Disable Owner',
    description: 'disable user owner',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Post('owner/is-disable/:id/:isDisable')
  async disableOwner(
    @Param('id') id: string,
      @Param('isDisable') isDisable: boolean,
      @CurrentUser() user: User,
  ): Promise<string> {
    return this.userService.isDisableOwner(id, isDisable, user);
  }

  @ApiOperation({
    summary: 'Restrict Owner',
    description: 'Restrict Owner and its sub-users',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Post('owner/is-restricted/:id/:isRestricted')
  async restrictOwner(
    @Param('id') id: string,
      @Param('isRestricted') isRestricted: boolean,
      @CurrentUser() user: User,
  ): Promise<string> {
    return this.userService.isRestrictOwner(id, isRestricted, user);
  }

  @ApiOperation({
    summary: 'Disable contractor',
    description: 'Disable contractor and its sub-users',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Post('contractor/is-disable/:id/:isDisable')
  async disableContractor(
    @Param('id') id: string,
      @Param('isDisable') isDisable: boolean,
  ): Promise<string> {
    return this.userService.isDisableContractor(id, isDisable);
  }

  @ApiOperation({
    summary: 'Restrict Contractor',
    description: 'Restrict Contractor and its sub-users',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Post('contractor/is-restricted/:id/:isRestricted')
  async restrictContractor(
    @Param('id') id: string,
      @Param('isRestricted') isRestricted: boolean,
  ): Promise<string> {
    return this.userService.isRestrictContractor(id, isRestricted);
  }

  @ApiOperation({
    summary: 'Get User Disable',
    description: 'Return if user is disabled or not',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Get('is-disable/:id')
  async GetUser(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserDisabled(id);
  }

  @ApiOperation({
    summary: 'Get User Restricted',
    description: 'Return if user is restricted or not',
  })
  @ApiOkResponse({
    description: 'Successfully',
    type: String,
  })
  @Get('is-restricted/:id')
  async getIsRestricted(@Param('id') id: string): Promise<boolean> {
    return this.userService.getIsUserRestricted(id);
  }
}

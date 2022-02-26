import {
  Controller,
  UseGuards,
  Get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Query,
  Patch,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
  PickType,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import Stripe from 'stripe';
import { DriverDTO } from '../../dto/driver-dto';
import { UpdateUserDTO } from '../../dto/user-update.dto';
import { DocumentNotFoundException } from '../../../common/exceptions/document-not-found.exception';
import { User, UserRole } from '../../user.model';
import { CurrentUser } from '../../current-user.decorator';
import {
  FailureStringResponse,
  SuccessStringResponse,
} from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { OwnsModelGuard } from '../../../common/owns-model.guard';
import { UserService } from '../../user.service';
import { UserDTO } from '../../dto/user.dto';
import { Driver } from '../../driver.model';
import { OwnerCompanyDTO } from '../../../company/dto/owner-company.dto';
import { Owner } from '../../owner.model';
import { OwnerDriverTotalsDTO } from '../../dto/owner-driver-totals.dto';
import { dataProfile, search } from './dataProfile';

// TODO: DRY a little bit
const OwnsDriverOrOwner = OwnsModelGuard(User, 'id', async (repo, id, user) => {
  const driver = await repo.findOne(id);
  if (!driver) {
    throw new DocumentNotFoundException('Driver', id);
  }
  if (driver.role === UserRole.OWNER) {
    return user.id === driver.id;
  }
  const owner = await (driver as Driver).drivingFor.owner;
  return user.id === owner.id;
});

const OwnerDriver = OwnsModelGuard(Driver, 'id', async (repo, id, user) => {
  const driver = await repo.findOne(id);
  if (!driver) {
    throw new DocumentNotFoundException('Driver', id);
  }
  const owner = await driver.drivingFor.owner;
  return user.id === owner.id;
});

class UpdateOwnerDTO extends PickType<any, string>(UpdateUserDTO, [
  'name',
  'profileImg',
  'deviceID',
  'phoneNumber',
] as const) {}

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
@UseGuards(AuthGuard(), HasRole(UserRole.OWNER))
@Controller('owner/user')
export class UserOwnerController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get the users that drive for the logged user',
    description: 'Allows an owner to view the details of the drivers',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "Drivers' profiles",
    type: [DriverDTO],
  })
  @Get('drivers')
  async list(
    @Query('skip') skip,
      @Query('count') count,
      @CurrentUser() user: User,
  ): Promise<DriverDTO[]> {
    const drivers = await this.userService.getOwnerDrivers(user, {
      skip,
      count,
    });
    return drivers.map(driver => DriverDTO.fromModel(driver as Driver));
  }

  @ApiOperation({
    summary: 'Get all active drivers',
    description: 'Returns all active drivers, for sending a difussion message',
  })
  @Get('all-drivers/active')
  async getAllActiveDrivers(@CurrentUser() user: User): Promise<any[]> {
    const drivers = await this.userService.getAllActiveDriversForOwnerCompany(
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
    summary: 'Get driver profile',
    description: 'Allows an owner to get a driver ',
  })
  @ApiAcceptedResponse({
    description: 'Get driver',
    type: DriverDTO,
  })
  @UseGuards(OwnsDriverOrOwner)
  @Get('driver/:id')
  async getDriver(
    @Param('id') id: string,
      @CurrentUser() user: User,
  ): Promise<DriverDTO> {
    const driver = await this.userService.getDriver(id, user);
    return DriverDTO.fromModel(driver as Driver);
  }

  @ApiOperation({
    summary: 'Update driver profile',
    description: 'Allows an owner to update a driver ',
  })
  @ApiAcceptedResponse({
    description: 'Updated Driver',
    type: DriverDTO,
  })
  @UseGuards(OwnsDriverOrOwner)
  @Patch('driver/:id')
  async updateDriver(
    @Param('id') id: string,
      @Body() body: DriverDTO,
  ): Promise<DriverDTO> {
    const driver = await this.userService.updateDriver(id, body);
    return DriverDTO.fromModel(driver as Driver);
  }

  @ApiOperation({
    summary: 'Disable Driver',
    description: 'Allows an Owner to disable one of its Drivers',
  })
  @ApiAcceptedResponse({
    description: 'Disabled Driver',
  })
  @UseGuards(OwnsDriverOrOwner)
  @Patch('driver/:id/disable')
  async disableDriver(@Param('id') id: string): Promise<any> {
    return this.userService.disableDriver(id);
  }

  @ApiOperation({
    summary: 'Get image upload url',
    description: 'Returns the url to upload a profile image',
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
    summary: 'Get image upload url',
    description: 'Returns the url to upload a profile image',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: SuccessStringResponse,
  })
  @Get('image/:id')
  getUpdateSignatureDriverImageUrl(@Param('id') id: string): Promise<string> {
    return this.userService.getUpdateSignutareDriverImageLink(id);
  }

  @ApiOperation({
    summary: 'Get stripe account link for owner',
  })
  @ApiAcceptedResponse({
    description: 'Link',
    type: String,
  })
  @Get('stripe-account')
  async getStripeAccountLink(@CurrentUser() { id }: User): Promise<string> {
    return this.userService.getOwnerStripeAccountLink(id);
  }

  @ApiOperation({
    summary: 'Check if stripe account completed',
  })
  @ApiAcceptedResponse({
    description: 'Link',
    type: Boolean,
  })
  @Get('stripe-account/check')
  async checkStripeAccount(@CurrentUser() { id }: User): Promise<boolean> {
    return this.userService.checkStripeAccount(id);
  }

  @ApiOperation({
    summary: 'Check if stripe account completed',
  })
  @ApiAcceptedResponse({
    description: 'Link',
    type: Object,
  })
  @Get('stripe-account/detail')
  async detailStripeAccount(
    @CurrentUser() { id }: User,
  ): Promise<Stripe.Response<Stripe.Account>> {
    return this.userService.retrieveStripeAccount(id);
  }

  @ApiOperation({
    summary: 'Get the user company profile info with the requested id',
    description: 'Allows an owner to view company profile',
  })
  @ApiAcceptedResponse({
    description: 'User company profile',
    type: UserDTO,
  })
  @Get('/company')
  async getProfile(@CurrentUser() user: User): Promise<OwnerCompanyDTO> {
    const company = await this.userService.getUserCompanyDetails(user);
    return OwnerCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Update Company',
    description: 'Allows an owner to update a company',
  })
  @Patch('/company')
  async updateCompany(
    @CurrentUser() user: User,
      @Body() body: OwnerCompanyDTO,
  ): Promise<OwnerCompanyDTO> {
    const company = await this.userService.updateUserCompany(
      user,
      body.toModel(),
    );
    return OwnerCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Update Owner',
    description: 'Allows an Owner to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Owner Information',
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
    summary: 'Get the total count of drivers that drive for the user',
    description: 'Allows an owner to view the total of the drivers',
  })
  @ApiAcceptedResponse({
    description: "Driver's totals",
    type: OwnerDriverTotalsDTO,
  })
  @Get('all-totals')
  async getTotal(@CurrentUser() user: Owner): Promise<OwnerDriverTotalsDTO> {
    const activeDrivers = await this.userService.countActiveOwnerDrivers(user);
    const inactiveDrivers = await this.userService.countInactiveOwnerDrivers(
      user,
    );
    const total = activeDrivers + inactiveDrivers;
    return {
      active: activeDrivers,
      inactive: inactiveDrivers,
      total,
    };
  }

  @ApiOperation({
    summary: 'Get the user with the requested id',
    description: 'Allows an owner to view the details of itself or the drivers',
  })
  @ApiAcceptedResponse({
    description: 'User profile',
    type: UserDTO,
  })
  @UseGuards(OwnsDriverOrOwner)
  @Get(':id')
  async get(@Param('id') id: string): Promise<UserDTO> {
    const user = await this.userService.getUser(id);
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update Owner',
    description: 'Allows an owner to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Owner profile',
    type: UserDTO,
  })
  @Patch()
  async updateSelf(
    @CurrentUser() { id }: User,
      @Body() body: UpdateOwnerDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(
      id,
      body as any,
      body.deviceID,
    );
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Update User',
    description: 'Allows an Owner to update another user profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update User Information',
    type: UserDTO,
  })
  @UseGuards(OwnsDriverOrOwner)
  @Patch(':id')
  async update(
    @Param('id') id: string,
      @Body() body: UpdateOwnerDTO,
  ): Promise<UserDTO> {
    const user = await this.userService.updateUser(
      id,
      body as any,
      body.deviceID,
    );
    return UserDTO.fromModel(user);
  }

  @ApiOperation({
    summary: 'Remove User',
    description: 'Allows an owner to remove one of its drivers',
  })
  @ApiAcceptedResponse({
    description: 'Deleted',
    type: Boolean,
  })
  @UseGuards(OwnerDriver)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<boolean> {
    return this.userService.removeUser(id);
  }

  @Get('/company/data/profile')
  async getDataProfile(@CurrentUser() user: User): Promise<number> {
    const company = await this.userService.getUserCompanyDetails(user);
    const userInfo = await this.userService.getUser(user.id);
    let progress = 5;
    const values = dataProfile(company);
    if (
      userInfo.profileImg !==
      'https://www.nicepng.com/png/detail/73-730154_open-default-profile-picture-png.png'
    ) {
      progress += 5;
    }
    if (values.contacts.length > 0) {
      progress += 5;
    }
    progress += search(values.companyInfo);
    progress += search(values.jobInformation);
    progress += search(values.generalLiabilityInsurance);
    progress += search(values.autoLiabilityInsurance);
    progress += search(values.workersCompensationsInsurance);
    return progress;
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

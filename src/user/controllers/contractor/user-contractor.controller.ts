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
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '../../user.model';
import { CurrentUser } from '../../current-user.decorator';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserService } from '../../user.service';
import { Dispatcher } from '../../dispatcher.model';
import { DispatcherDTO } from '../../dto/dispatcher-dto';
import { Foreman } from '../../foreman.model';
import { ForemanDTO } from '../../dto/foreman-dto';
import { UpdateUserDTO } from '../../dto/user-update.dto';
import { UserDTO } from '../../dto/user.dto';
import { ContractorCompanyDTO } from '../../../company/dto/contractor-company.dto';
import { dataProfile } from './dataProfile';
import { StripeBankAccountDTO } from '../../../stripe/dto/stripe-bank-account.dto';
import { StripeBankAccountVerifyDTO } from '../../../stripe/dto/stripe-bank-account-verify.dto';

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
@UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
@Controller('contractor/user')
export class UserContractorController {
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
    summary: 'Update Company',
    description: 'Allows a contractor to update a company',
  })
  @Patch('company')
  async updateCompany(
    @CurrentUser() user: User,
      @Body() body: ContractorCompanyDTO,
  ): Promise<ContractorCompanyDTO> {
    const company = await this.userService.updateContractorCompany(
      user,
      body.toModel(),
    );
    return ContractorCompanyDTO.fromModel(company);
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
    summary: 'Get the dispatchers that work for the logged user',
    description: 'Allows a contractor to view the details of the dispatchers',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "Dispatcher's profiles",
    type: [DispatcherDTO],
  })
  @Get('/dispatchers')
  async list(
    @Query('skip') skip = 0,
    @Query('count') count = 10,
    @CurrentUser() user: User,
  ): Promise<DispatcherDTO[]> {
    const dispatchers = await this.userService.getContractorDispatchers(user, {
      skip,
      count,
    });
    return Promise.all(
      dispatchers.map(dispatcher =>
        DispatcherDTO.fromModel(dispatcher as Dispatcher),
      ),
    );
  }

  @ApiOperation({
    summary: 'Get the foremans that work for the logged user',
    description: 'Allows a contractor to view the details of the foremans',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: "foreman's profiles",
    type: [ForemanDTO],
  })
  @Get('/foremans')
  async ForemanList(
    @Query('skip') skip = 0,
    @Query('count') count = 10,
    @CurrentUser() user: User,
  ): Promise<ForemanDTO[]> {
    const foremans = await this.userService.getContractorForemans(user, {
      skip,
      count,
    });
    return Promise.all(
      foremans.map(foreman => ForemanDTO.fromModel(foreman as Foreman)),
    );
  }

  @ApiOperation({
    summary: 'Remove User',
    description: 'Allows a contractor to remove one of its user',
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
    description: 'Allows a Contractor to update another user profile settings',
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
    summary: 'Update Contractor',
    description:
      'Allows a Contractor to update some of their own profile settings',
  })
  @ApiAcceptedResponse({
    description: 'Update Contractor Information',
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
    summary: 'Get the user company profile info',
    description: 'Allows a contractor to view company profile',
  })
  @Get('/company')
  async getProfile(@CurrentUser() user: User): Promise<ContractorCompanyDTO> {
    const company = await this.userService.getContractorCompanyDetails(user);
    return ContractorCompanyDTO.fromModel(company);
  }

  @ApiOperation({
    summary: 'Get progress Profile',
    description: 'Progress Bar Profile',
  })
  @Get('/company/data/profile')
  async getDataProfile(@CurrentUser() user: User): Promise<number> {
    const userInfo = await this.userService.getUser(user.id);
    const bankAccounts = await this.userService.getContractorBankAccounts(
      user.id,
    );
    let progress = 10;
    const values = dataProfile(userInfo);

    if (
      values.userInfo.profileImg !==
      'https://www.nicepng.com/png/detail/73-730154_open-default-profile-picture-png.png'
    ) {
      progress += 10;
    }
    if (values.contacts.length > 0) {
      progress += 10;
    }
    if (bankAccounts.length > 0) {
      progress += 10;
    }
    if (values.insuranceNeeded.length > 0) {
      progress += 10;
    }
    for (const key in values.companyInfo) {
      if (Object.prototype.hasOwnProperty.call(values.companyInfo, key)) {
        const element = values.companyInfo[key];
        if (element !== '') {
          progress += 10;
        }
      }
    }
    return progress;
  }

  @ApiOperation({
    summary: 'Create a bank account token',
  })
  @ApiBearerAuth('authorization')
  @ApiAcceptedResponse({
    description: 'Confirm a new bank account',
    type: Boolean,
  })
  @Post('/stripe-account/bank')
  async getBankAccountToken(
    @Body() bank: StripeBankAccountDTO,
      @CurrentUser() { id }: User,
  ): Promise<boolean> {
    await this.userService.createContractorBankAccountToken(id, bank);
    return true;
  }

  @ApiOperation({
    summary: 'Verify bank account',
  })
  @ApiBearerAuth('authorization')
  @ApiAcceptedResponse({
    description: 'Verified bank account',
    type: Boolean,
  })
  @Post('/stripe-account/bank/:bankAccountId/verify')
  async verifyBankAccount(
    @Body()
      { firstDepositAmount, secondDepositAmount }: StripeBankAccountVerifyDTO,
      @CurrentUser() { id }: User,
      @Param('bankAccountId') bankAccountId: string,
  ): Promise<boolean> {
    await this.userService.verifyContractorBankAccount(id, bankAccountId, [
      firstDepositAmount,
      secondDepositAmount,
    ]);
    return true;
  }

  @ApiOperation({
    summary: 'List bank account for current contractor',
  })
  @ApiBearerAuth('authorization')
  @ApiAcceptedResponse({
    description: 'List bank account',
    type: String,
  })
  @Get('/stripe-account/bank')
  async listBankAccount(
    @CurrentUser() { id }: User,
  ): Promise<StripeBankAccountDTO[]> {
    const bankAccounts = await this.userService.getContractorBankAccounts(id);
    return bankAccounts.map(bankAccount =>
      StripeBankAccountDTO.fromModel(bankAccount),
    );
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

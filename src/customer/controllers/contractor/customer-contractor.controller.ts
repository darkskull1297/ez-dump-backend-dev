import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole, User } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { CustomerDto } from '../../dto/customer.dto';
import { Contractor } from '../../../user/contractor.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { PaginationDTO } from '../../../common/pagination.dto';
import { CustomerService } from '../../customer.service';

const IsContractorVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Contractor).verifiedByAdmin;
});

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
@ApiTags('customer')
@Controller('contractor/customer')
export class CustomerContractorController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Get customer jobs' })
  @ApiAcceptedResponse({
    description: 'Get customer jobs',
    type: CustomerDto,
    isArray: true,
  })
  @UseGuards(IsContractorVerified)
  @Get()
  async getCustomers(@CurrentUser() user: User): Promise<CustomerDto[]> {
    const customers = await this.customerService.findCustomers(user);

    return customers?.map(customer => CustomerDto.fromModel(customer));
  }

  @ApiOperation({ summary: 'Create a new customer job' })
  @ApiAcceptedResponse({
    description: 'Created customer job',
    type: CustomerDto,
  })
  @UseGuards(IsContractorVerified)
  @Post()
  async createCustomer(
    @Body() customer: CustomerDto,
      @CurrentUser() user: User,
  ): Promise<CustomerDto> {
    const newCustomer = await this.customerService.createCustomer(
      customer.toModel(),
      user,
    );
    return CustomerDto.fromModel(newCustomer);
  }

  @ApiOperation({ summary: 'Edit a new customer job' })
  @ApiAcceptedResponse({
    description: 'Edit customer job',
    type: CustomerDto,
  })
  @UseGuards(IsContractorVerified)
  @Patch('/:id')
  async editCustomer(
    @Body() customer: CustomerDto,
      @Param('id') jobId: string,
  ): Promise<CustomerDto> {
    const customerEdited = await this.customerService.editCustomer(
      customer.toModel(),
      jobId,
    );
    return CustomerDto.fromModel(customerEdited);
  }

  @ApiOperation({ summary: 'Get customer job' })
  @ApiAcceptedResponse({
    description: 'Get customer job',
    type: CustomerDto,
  })
  @UseGuards(IsContractorVerified)
  @Get('/:customerId')
  async getCustomer(
    @CurrentUser() user: User,
      @Param('customerId') customerId: string,
  ): Promise<CustomerDto> {
    const customer = await this.customerService.findCustomer(customerId, user);
    return CustomerDto.fromModel(customer);
  }

  @ApiOperation({ summary: 'Delete a customer' })
  @ApiAcceptedResponse({
    description: 'Customer deleted',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('/:customerId')
  async deleteCustomer(
    @Param('customerId') customerId: string,
  ): Promise<boolean> {
    return this.customerService.removeCustomer(customerId);
  }
}

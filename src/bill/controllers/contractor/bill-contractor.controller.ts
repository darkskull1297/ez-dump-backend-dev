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
  Put,
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
import { BillDto } from '../../dto/bill.dto';
import { Contractor } from '../../../user/contractor.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { PaginationDTO } from '../../../common/pagination.dto';
import { BillService } from '../../bill.service';

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
@ApiTags('bill')
@Controller('contractor/bill')
export class BillContractorController {
  constructor(private readonly billService: BillService) {}

  @ApiOperation({ summary: 'Get bills' })
  @ApiAcceptedResponse({
    description: 'Get bills',
    type: BillDto,
    isArray: true,
  })
  @UseGuards(IsContractorVerified)
  @Get()
  async getBills(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<BillDto[]> {
    const bills = await this.billService.findBills(user, {
      skip,
      count,
    });

    return bills?.map(bill => BillDto.fromModel(bill));
  }

  @ApiOperation({ summary: 'Create a new bill' })
  @ApiAcceptedResponse({
    description: 'Created bill',
    type: BillDto,
  })
  @UseGuards(IsContractorVerified)
  @Post()
  async createBill(
    @Body() bill: BillDto,
      @CurrentUser() user: User,
  ): Promise<BillDto> {
    const newBill = await this.billService.createBill(
      bill.toModel(),
      bill.invoices,
      user,
    );
    return BillDto.fromModel(newBill);
  }

  @ApiOperation({ summary: 'Edit a new bill' })
  @ApiAcceptedResponse({
    description: 'Edit bill',
    type: BillDto,
  })
  @UseGuards(IsContractorVerified)
  @Put('/:id')
  async editBill(
    @Body() bill: BillDto,
      @Param('id') billId: string,
  ): Promise<BillDto> {
    const billEdited = await this.billService.editBill(
      bill.toModel(),
      bill.invoices,
      billId,
    );
    return BillDto.fromModel(billEdited);
  }

  @ApiOperation({ summary: 'Get bill' })
  @ApiAcceptedResponse({
    description: 'Get bill',
    type: BillDto,
  })
  @UseGuards(IsContractorVerified)
  @Get('/:billId')
  async getBill(
    @CurrentUser() user: User,
      @Param('billId') billId: string,
  ): Promise<BillDto> {
    const bill = await this.billService.findBill(billId, user);
    // return BillDto.fromModel(bill);
    return bill;
  }

  @ApiOperation({ summary: 'Delete Bill' })
  @ApiAcceptedResponse({
    description: 'Delete bill',
    type: Boolean,
  })
  @UseGuards(IsContractorVerified)
  @Delete('/:billId')
  async deleteBill(@Param('billId') billId: string): Promise<boolean> {
    return this.billService.deleteBill(billId);
  }
}

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
import { Dispatcher } from '../../../user/dispatcher.model';
import { IsVerifiedGuard } from '../../../common/is-verified.guard';
import { PaginationDTO } from '../../../common/pagination.dto';
import { BillService } from '../../bill.service';
import { UserService } from '../../../user/user.service';

const IsDispatcherVerified = IsVerifiedGuard(User, async (repo, user) => {
  return (user as Dispatcher).verifiedEmail;
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
@UseGuards(AuthGuard(), HasRole(UserRole.DISPATCHER))
@ApiTags('bill')
@Controller('dispatcher/bill')
export class BillDispatcherController {
  constructor(
    private readonly billService: BillService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Get bills' })
  @ApiAcceptedResponse({
    description: 'Get bills',
    type: BillDto,
    isArray: true,
  })
  @UseGuards(IsDispatcherVerified)
  @Get()
  async getBills(
    @CurrentUser() user: User,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<BillDto[]> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const bills = await this.billService.findBills(contractor, { skip, count });
    return bills?.map(bill => BillDto.fromModel(bill));
  }

  @ApiOperation({ summary: 'Create a new bill' })
  @ApiAcceptedResponse({
    description: 'Created bill',
    type: BillDto,
  })
  @UseGuards(IsDispatcherVerified)
  @Post()
  async createBill(
    @Body() bill: BillDto,
      @CurrentUser() user: User,
  ): Promise<BillDto> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const newBill = await this.billService.createBill(
      bill.toModel(),
      bill.invoices,
      contractor,
    );
    return BillDto.fromModel(newBill);
  }

  @ApiOperation({ summary: 'Edit a new bill' })
  @ApiAcceptedResponse({
    description: 'Edit bill',
    type: BillDto,
  })
  @UseGuards(IsDispatcherVerified)
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
  @UseGuards(IsDispatcherVerified)
  @Get('/:billId')
  async getDispatcherBill(
    @CurrentUser() user: User,
      @Param('billId') billId: string,
  ): Promise<BillDto> {
    const contractor = await this.userService.getContractorByDispatcher(user);
    const bill = await this.billService.findBill(billId, contractor);
    // return BillDto.fromModel(bill);
    return bill;
  }

  @ApiOperation({ summary: 'Delete Bill' })
  @ApiAcceptedResponse({
    description: 'Delete bill',
    type: Boolean,
  })
  @UseGuards(IsDispatcherVerified)
  @Delete('/:billId')
  async deleteBill(@Param('billId') billId: string): Promise<boolean> {
    return this.billService.deleteBill(billId);
  }
}

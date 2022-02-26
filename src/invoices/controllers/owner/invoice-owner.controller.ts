import {
  Controller,
  UseGuards,
  Get,
  Query,
  Post,
  Param,
  Body,
  Patch,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { User, UserRole } from '../../../user/user.model';
import { CurrentUser } from '../../../user/current-user.decorator';
import { JobInvoiceService } from '../../job-invoice.service';
import { PaginationDTO } from '../../../common/pagination.dto';
import { Owner } from '../../../user/owner.model';
import { OwnerJobInvoiceDTO } from '../../dto/owner-job-invoice.dto';
import {
  DriverWeeklyInvoiceDTO,
  DriverWeeklyInvoicesDTO,
} from '../../dto/driver-weekly-invoice.dto';
import { DriverJobInvoiceService } from '../../driver-job-invoice.service';
import { InvoicesQueryDTO } from '../../invoices-query.dto';
import { OwnerInvoicesTotalsDTO } from '../../dto/owner-invoices-totals.dto';
import { DisputeInvoiceDTO } from '../../dto/dispute-invoice.dto';
import { DisputeInvoiceService } from '../../dispute-invoice.service';
import { IsNotSupportGuard } from '../../../auth/controllers/admin/is-not-support.guard';
import { OwnerJobInvoiceService } from '../../owner-job-invoice.service';
import { PaymentMethod } from '../../payment-method';

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
@ApiTags('invoices')
@Controller('owner/invoices')
export class InvoiceOwnerController {
  constructor(
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly driverJobInvoiceService: DriverJobInvoiceService,
    private readonly disputeInvoiceService: DisputeInvoiceService,
    private readonly ownerJobInvoiceService: OwnerJobInvoiceService,
  ) {}

  @ApiOperation({ summary: 'Get the dispute by ticket' })
  @ApiAcceptedResponse({
    description: 'Dispute Invoice',
    type: DisputeInvoiceDTO,
  })
  @Get('ticket-dispute/:ticketId')
  async getDisputeTicket(
    @Param('ticketId') ticketId: string,
  ): Promise<DisputeInvoiceDTO> {
    const dispute = await this.disputeInvoiceService.getDisputeByTicket(
      ticketId,
    );

    return DisputeInvoiceDTO.fromModel(dispute);
  }

  @ApiOperation({ summary: 'Get weekly invoices for driver' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: DriverWeeklyInvoiceDTO,
    isArray: true,
  })
  @Get('driver-weekly/:id')
  async DriverInvoices(
    @Param('id') invoiceId: string,
  ): Promise<DriverWeeklyInvoiceDTO[]> {
    const invoices = await this.driverJobInvoiceService.getAllWeeklyInvoiceForDriverFromOwner(
      invoiceId,
    );

    return invoices.map(invoice => DriverWeeklyInvoiceDTO.fromModel(invoice));
  }

  @ApiOperation({ summary: 'Get weekly invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: [DriverWeeklyInvoicesDTO],
    isArray: true,
  })
  @Get('driver-weekly')
  listWeekly(
    @CurrentUser() user: Owner,
      @Query() { skip, count }: PaginationDTO,
  ): Promise<any[]> {
    //    return this.driverJobInvoiceService.getWeeklyInvoicesForOwner(user, {
    return this.driverJobInvoiceService.getPayrollForOwner(user, {
      skip,
      count,
    });
  }

  @ApiOperation({ summary: 'Get weekly invoice' })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: DriverWeeklyInvoiceDTO,
  })
  @Get('driver-weekly/payroll/:weeklyInvoiceId')
  async getWeeklyInvoice(
    @CurrentUser() owner: Owner,
      @Param('weeklyInvoiceId') weeklyInvoiceId: string,
  ): Promise<DriverWeeklyInvoiceDTO> {
    const invoice = await this.driverJobInvoiceService.getWeeklyInvoicesForOwnerById(
      owner,
      weeklyInvoiceId,
    );
    console.info('Invoice generated: ', invoice);
    return DriverWeeklyInvoiceDTO.fromModel(invoice);
  }

  @ApiOperation({ summary: 'Get invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Invoices',
    type: OwnerJobInvoiceDTO,
    isArray: true,
  })
  @Get()
  async list(
    @CurrentUser() user: Owner,
      @Query() { skip, count, isPaid }: InvoicesQueryDTO,
  ): Promise<OwnerJobInvoiceDTO[]> {
    const invoices = await this.jobInvoiceService.getOwnerInvoices(user, {
      skip,
      count,
      isPaid,
    });
    return invoices.map(invoice => OwnerJobInvoiceDTO.fromModel(invoice));
  }

  @ApiOperation({ summary: 'Get totals' })
  @ApiAcceptedResponse({
    description: 'Total profits',
    type: OwnerInvoicesTotalsDTO,
  })
  @Get('all-totals')
  async getTotals(
    @CurrentUser() owner: Owner,
  ): Promise<OwnerInvoicesTotalsDTO> {
    const ownerProfits = await this.jobInvoiceService.getOwnerProfits(owner);
    const ownerUnpaidProfits = await this.jobInvoiceService.getOwnerUnpaidProfits(
      owner,
    );

    const ownerDriverPaid = await this.driverJobInvoiceService.getOwnerMoneyPaidToDrivers(
      owner,
    );
    const ownerDriverUnpaid = await this.driverJobInvoiceService.getOwnerMoneyUnpaidToDrivers(
      owner,
    );
    return {
      totalProfits: ownerProfits,
      unpaidProfits: ownerUnpaidProfits,
      paidToDrivers: ownerDriverPaid,
      unpaidToDrivers: ownerDriverUnpaid,
    };
  }

  @ApiOperation({ summary: 'Get Invoice' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: OwnerJobInvoiceDTO,
  })
  @Get(':id')
  async getInvoice(
    @CurrentUser() owner: Owner,
      @Param('id') invoiceId: string,
  ): Promise<OwnerJobInvoiceDTO> {
    const invoice = await this.jobInvoiceService.getInvoiceForOwner(
      owner,
      invoiceId,
    );
    const data = OwnerJobInvoiceDTO.fromModel(invoice);

    const fillFinished = new Promise((resolve, _) => {
      data.driverInvoices.forEach(
        async (driverInvoice, index, driverInvoiceArray) => {
          const finishedBy = await this.jobInvoiceService.getFinsihedByAssignation(
            driverInvoice.driver.id,
            data.job.id,
          );
          driverInvoiceArray[index].finishedBy = { ...finishedBy[0] };
          if (index === driverInvoiceArray.length - 1) resolve(data);
        },
      );
    });

    return fillFinished.then(() => {
      return {
        ...data,
        contractorCompanyName: invoice.contractorCompanyName,
        ownerCompanyName: invoice.ownerCompanyName,
        ownerCompanyPhoneNumber: invoice.ownerCompanyPhoneNumber,
      };
    });
  }

  @ApiOperation({
    summary: 'Verify Owner Invoice',
    description: 'Allows an owner to verify an owner job invoice',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:ownerInvoice/accept')
  async acceptJobOwnerInvoice(
    @CurrentUser() owner: Owner,
      @Param('ownerInvoice')
      id: string,
  ): Promise<string> {
    await this.ownerJobInvoiceService.acceptOwnerInvoiceForOwner(owner, id);
    return 'Owner job invoice accepted';
  }

  @ApiOperation({
    summary: 'Verify Driver job invoice',
    description: 'Allows an owner to verify an driver job invoice',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/driver/:driverJobInvoiceId/accept')
  async acceptJobDriverInvoice(
    @CurrentUser() owner: Owner,
      @Param('driverJobInvoiceId')
      id: string,
  ): Promise<string> {
    await this.driverJobInvoiceService.acceptDriverInvoiceForOwner(owner, id);
    return 'Driver job invoice accepted';
  }

  @ApiOperation({ summary: 'Mark weekly invoice as paid' })
  @ApiAcceptedResponse({
    description: 'Paid',
    type: Boolean,
  })
  @Post('/driver-paid/:invoiceId')
  async markOwnerPaid(@Param('invoiceId') invoiceId: string): Promise<boolean> {
    await this.driverJobInvoiceService.markInvoicePaid(invoiceId);
    return true;
  }

  @ApiOperation({ summary: 'Apply for cash advance' })
  @ApiAcceptedResponse({ type: String })
  @Post('cash-advance/:id')
  async applyForCashAdvance(
    @CurrentUser() user: Owner,
      @Param('id') invoiceId: string,
  ): Promise<string> {
    await this.jobInvoiceService.requestCashAdvance(user, invoiceId);
    return 'Your request for cash advance was sent';
  }

  @ApiOperation({ summary: 'Get Dispute Invoice Contractor' })
  @ApiOkResponse({
    description: 'Dispute Invoice Contractor',
    type: DisputeInvoiceDTO,
  })
  @Get('dispute/:id')
  async getDisputeInvoice(
    @CurrentUser() owner: Owner,
      @Param('id') disputeInvoiceId: string,
  ): Promise<DisputeInvoiceDTO> {
    const disputeInvoice = await this.disputeInvoiceService.getDisputeInvoiceForOwner(
      owner,
      disputeInvoiceId,
    );
    return DisputeInvoiceDTO.fromModel(disputeInvoice);
  }

  @ApiAcceptedResponse({
    description: 'Dispute Job Invoice',
    type: DisputeInvoiceDTO,
  })
  @ApiOperation({ summary: 'Create dispute job invoice' })
  @Post('dispute/contractor/:ownerInvoiceId')
  async createDisputeJobInvoice(
    @Body() disputeInvoice: DisputeInvoiceDTO,
      @CurrentUser() user: User,
      @Param('ownerInvoiceId') ownerInvoiceId: string,
  ): Promise<DisputeInvoiceDTO> {
    const newDisputeInvoice = await this.disputeInvoiceService.createDisputeOwnerForOwner(
      disputeInvoice,
      user,
      ownerInvoiceId,
    );
    return DisputeInvoiceDTO.fromModel(newDisputeInvoice);
  }

  @ApiAcceptedResponse({
    description: 'Dispute Driver Invoice',
    type: DisputeInvoiceDTO,
  })
  @ApiOperation({ summary: 'Create dispute driver invoice' })
  @Post('dispute/driver/:driverInvoiceId')
  async createDisputeDriverInvoice(
    @Body() disputeInvoice: DisputeInvoiceDTO,
      @CurrentUser() user: User,
      @Param('driverInvoiceId') driverInvoiceId: string,
  ): Promise<DisputeInvoiceDTO> {
    const newDisputeInvoice = await this.disputeInvoiceService.createDisputeDriverForOwner(
      disputeInvoice,
      user,
      driverInvoiceId,
    );
    return DisputeInvoiceDTO.fromModel(newDisputeInvoice);
  }

  @ApiOperation({
    summary: 'Pay driver tickets',
    description: 'Pay driver tickets by weekly period',
  })
  @ApiOkResponse({
    description: 'Success',
    type: Boolean,
  })
  @Post('week-work/pay')
  async payDriverTickets(
    @Body('params')
      params: {
        tickets: string[];
        orderNumber: string;
        accountNumber: string;
        paidWith: PaymentMethod;
      },
  ): Promise<void> {
    await this.driverJobInvoiceService.payDriverTicket(
      params.tickets,
      params.accountNumber,
      params.orderNumber,
      params.paidWith,
    );
  }

  @ApiOperation({
    summary: 'Edit driver ticket information',
    description:
      'Edit driver ticket information, both acc number and order number',
  })
  @ApiOkResponse({
    description: 'Success',
    type: Boolean,
  })
  @Patch('week-work/pay')
  async editPaidTicket(
    @Body('params')
      params: {
        tickets: string[];
        orderNumber: string;
        accountNumber: string;
      },
  ): Promise<void> {
    await this.driverJobInvoiceService.editPaidTicket(
      params.tickets,
      params.accountNumber,
      params.orderNumber,
    );
  }
}

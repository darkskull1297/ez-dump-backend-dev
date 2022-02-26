import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Post,
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
import { JobInvoiceDTO } from '../../dto/job-invoice.dto';
import { Contractor } from '../../../user/contractor.model';
import { DriverJobInvoiceTicketDTO } from '../../dto/driver-job-invoice-ticket.dto';
import { InvoicesQueryDTO } from '../../invoices-query.dto';
import { ContractorInvoicesTotalsDTO } from '../../dto/contractor-invoices-totals.dto';
import { DisputeInvoiceDTO } from '../../dto/dispute-invoice.dto';
import { DisputeInvoiceService } from '../../dispute-invoice.service';
import { IsNotSupportGuard } from '../../../auth/controllers/admin/is-not-support.guard';
import { OwnerJobInvoiceService } from '../../owner-job-invoice.service';
import { DriverJobInvoiceService } from '../../driver-job-invoice.service';
import { DriverInvoicesQueryDTO } from '../../driver-invoices-query.dto';
import { BillsTicketsFiltered } from '../../dto/bills-tickets-filtered.dto';
import { DriverJobInvoice } from '../../driver-job-invoice.model';
import { ManualPaymentDTO } from '../../dto/manual-payment.dto';
import { ManualPaymentService } from '../../manual-payment.service';
import { ManualPaymentUpdateDto } from '../../dto/manual-payment-update.dto';
import { LateFeeInvoiceDTO } from '../../dto/late-fee-invoice.dto';

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
@ApiTags('invoices')
@Controller('contractor/invoices')
export class InvoiceContractorController {
  constructor(
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly ownerJobInvoiceService: OwnerJobInvoiceService,
    private readonly driverJobInvoiceService: DriverJobInvoiceService,
    private readonly disputeInvoiceService: DisputeInvoiceService,
    private readonly manualPaymentService: ManualPaymentService,
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

    if (!dispute) return new DisputeInvoiceDTO();

    return DisputeInvoiceDTO.fromModel(dispute);
  }

  @ApiOperation({ summary: 'Get Invoice manual payment info ' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: ManualPaymentDTO,
  })
  @Get('manualPayment/:id')
  async getManualPaymentInfo(
    @Param('id') invoiceId: string,
  ): Promise<ManualPaymentDTO[]> {
    const manualPayment = await this.manualPaymentService.getManualPaymentsByInvoice(
      invoiceId,
    );

    if (!manualPayment) return [];

    return manualPayment.map(payment => {
      return ManualPaymentDTO.fromModel(payment);
    });
  }

  @ApiOperation({ summary: 'Get invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean })
  @ApiAcceptedResponse({
    description: 'Invoices',
    type: JobInvoiceDTO,
    isArray: true,
  })
  @Get()
  async list(
    @CurrentUser() user: Contractor,
      @Query() { skip, count, isPaid }: InvoicesQueryDTO,
  ): Promise<JobInvoiceDTO[]> {
    const invoices = await this.jobInvoiceService.getContractorInvoices(user, {
      skip,
      count,
      isPaid,
    });
    return Promise.all(
      invoices.map(async invoice => JobInvoiceDTO.fromModel(invoice)),
    );
  }

  @ApiOperation({ summary: 'Get driver invoices ( Tickets )' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: Date })
  @ApiQuery({ name: 'to', required: false, type: Date })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Invoices',
    type: DriverJobInvoiceTicketDTO,
    isArray: true,
  })
  @Get('driver')
  async listDriverInvoices(
    @CurrentUser() user: Contractor,
      @Query()
      {
        skip,
        count,
        from,
        to,
        projectId,
        customerId,
        truckId,
        materialId,
      }: DriverInvoicesQueryDTO,
  ): Promise<DriverJobInvoiceTicketDTO[]> {
    const invoices = await this.driverJobInvoiceService.getDriverInvoicesForContractor(
      user,
      {
        skip,
        count,
        from,
        to,
        customerId,
        projectId,
        truckId,
      },
    );
    return Promise.all(
      invoices.map(async invoice =>
        DriverJobInvoiceTicketDTO.fromModel(invoice),
      ),
    );
  }

  @ApiOperation({ summary: 'Update manual payment information' })
  @ApiOkResponse({
    description: 'Manual Payment id',
    type: String,
  })
  @Patch('manualPayment/:id')
  async updateManualPayment(
    @Param('id') invoiceId: string,
      @Body() manualPaymentUpdateDto: ManualPaymentUpdateDto,
  ): Promise<string> {
    return this.manualPaymentService.update(
      invoiceId,
      manualPaymentUpdateDto,
      'Contractor',
    );
  }

  @ApiOperation({ summary: 'Get totals' })
  @ApiAcceptedResponse({
    description: 'Totals',
    type: ContractorInvoicesTotalsDTO,
  })
  @Get('all-totals')
  async getTotal(
    @CurrentUser() user: Contractor,
  ): Promise<ContractorInvoicesTotalsDTO> {
    const totalAmountPaidInvoices = await this.jobInvoiceService.getTotalAmountPaidContractorInvoices(
      user,
    );
    const totalAmountUnPaidInvoices = await this.jobInvoiceService.getTotalAmountUnPaidContractorInvoices(
      user,
    );
    return {
      totalPaid: totalAmountPaidInvoices,
      totalUnpaid: totalAmountUnPaidInvoices,
    };
  }

  @ApiOperation({ summary: 'Get Invoice' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: JobInvoiceDTO,
  })
  @Get(':id')
  async getInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('id') invoiceId: string,
  ): Promise<any> {
    const invoice = await this.jobInvoiceService.getInvoiceForContractor(
      contractor,
      invoiceId,
    );
    const data = await JobInvoiceDTO.fromModel(invoice);

    const fillFinished = new Promise((resolve, _) => {
      data.ownerInvoices.forEach(ownerInvoice => {
        ownerInvoice.driverInvoices.forEach(
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
    });

    return fillFinished.then(async () => {
      const ownerInvoices: any = await Promise.all(
        data.ownerInvoices.map((ownerInvoice: any) => ({
          ...ownerInvoice,
          ownerCompany: invoice.ownerInvoices.find(
            (aux: any) => aux.id === ownerInvoice.id,
          ).ownerCompany,
        })),
      );
      return {
        ...data,
        ownerInvoices,
      };
    });
  }

  @ApiOperation({
    summary: 'Verify Job Invoice',
    description: 'Allows a contractor to verify a job invoice',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/:id/accept')
  async acceptJobInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('id')
      id: string,
  ): Promise<string> {
    await this.jobInvoiceService.acceptInvoiceForContractor(contractor, id);
    return 'Job invoice accepted';
  }

  @ApiOperation({
    summary: 'Verify Owner Invoice',
    description: 'Allows a contractor to verify an owner job invoice',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/owner/:ownerInvoice/accept')
  async acceptJobOwnerInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('ownerInvoice')
      id: string,
  ): Promise<string> {
    await this.ownerJobInvoiceService.acceptOwnerInvoiceForContractor(
      contractor,
      id,
    );
    return 'Owner job invoice accepted';
  }

  @ApiOperation({
    summary: 'Verify Driver job invoice',
    description: 'Allows a contractor to verify an driver job invoice',
  })
  @ApiOkResponse({
    description: 'Message',
    type: String,
  })
  @UseGuards(IsNotSupportGuard)
  @Patch('/driver/:driverJobInvoiceId/accept')
  async acceptJobDriverInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('driverJobInvoiceId')
      id: string,
  ): Promise<string> {
    await this.driverJobInvoiceService.acceptDriverInvoiceForContractor(
      contractor,
      id,
    );
    return 'Driver job invoice accepted';
  }

  @ApiOperation({ summary: 'Get payment intent' })
  @ApiAcceptedResponse({ description: 'Client secret', type: String })
  @Get('payment-intent/:invoiceId')
  getPaymentIntentSecret(
    @Param('invoiceId') invoiceId: string,
  ): Promise<string> {
    return this.jobInvoiceService.getPaymentIntentSecret(invoiceId);
  }

  @ApiOperation({ summary: 'Pay Invoice by Card' })
  @Post('pay-invoice/:invoiceId')
  payInvoiceByCard(
    @Param('invoiceId') invoiceId: string,
      @Body() data: { cardToken: string },
      @CurrentUser() contractor: Contractor,
  ): Promise<void> {
    return this.jobInvoiceService.payByCard(
      contractor,
      invoiceId,
      data.cardToken,
    );
  }

  @ApiOperation({ summary: 'Pay Invoice by Card' })
  @Post('pay-invoice/bank/:invoiceId')
  payInvoiceByBank(
    @Param('invoiceId') invoiceId: string,
      @Body() data: { bankId: string },
  ): Promise<void> {
    return this.jobInvoiceService.payByBank(invoiceId, data.bankId);
  }

  @ApiOperation({ summary: 'Pay Invoice by Check' })
  @Post('pay-invoice/manually/:invoiceId')
  payInvoiceManually(
    @Param('invoiceId') invoiceId: string,
      @Body()
      data: { paymentMethod: string; orderNumber: string; accountNumber: string },
  ): Promise<void> {
    return this.jobInvoiceService.markContractorInvoicePaidManually(
      invoiceId,
      data.paymentMethod,
      data.orderNumber,
      data.accountNumber,
    );
  }

  @ApiOperation({ summary: 'Pay Invoice by ACH' })
  @Post('pay-invoice/manually/ACH/:invoiceId')
  payInvoiceManuallyACH(
    @Param('invoiceId') invoiceId: string,
      @Body()
      data: { paymentMethod: string; orderNumber: string; accountNumber: string },
  ): Promise<void> {
    return this.jobInvoiceService.markContractorInvoicePaidManually(
      invoiceId,
      data.paymentMethod,
      data.orderNumber,
      data.accountNumber,
    );
  }

  @ApiOperation({ summary: 'Pay invoice with bank account' })
  @ApiAcceptedResponse({ description: 'Result', type: Boolean })
  @Post('payment-bank/:invoiceId')
  async payInvoiceByBankAccount(
    @Param('invoiceId') invoiceId: string,
      @CurrentUser() contractor: Contractor,
  ): Promise<boolean> {
    await this.jobInvoiceService.payByBankAccount(contractor, invoiceId);
    return true;
  }

  @ApiOperation({ summary: 'Get Dispute Invoice' })
  @ApiOkResponse({
    description: 'Dispute Invoice',
    type: DisputeInvoiceDTO,
  })
  @Get('dispute/:id')
  async getDisputeInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('id') disputeInvoiceId: string,
  ): Promise<DisputeInvoiceDTO> {
    const disputeInvoice = await this.disputeInvoiceService.getDisputeInvoiceForContractor(
      contractor,
      disputeInvoiceId,
    );
    return DisputeInvoiceDTO.fromModel(disputeInvoice);
  }

  @ApiAcceptedResponse({
    description: 'Invoice Dispute Driver',
    type: DisputeInvoiceDTO,
  })
  @ApiOperation({ summary: 'Create dispute invoice' })
  @Post('dispute/driver/:invoiceDriverId')
  async createDisputeInvoiceDriver(
    @Body() disputeInvoice: DisputeInvoiceDTO,
      @CurrentUser() contractor: Contractor,
      @Param('invoiceDriverId') invoiceDriverId: string,
  ): Promise<DisputeInvoiceDTO> {
    const newDisputeInvoice = await this.disputeInvoiceService.createDisputeDriverForContractor(
      disputeInvoice,
      contractor,
      invoiceDriverId,
    );
    return DisputeInvoiceDTO.fromModel(newDisputeInvoice);
  }

  @ApiAcceptedResponse({
    description: 'Dispute Invoice Owner',
    type: DisputeInvoiceDTO,
  })
  @ApiOperation({ summary: 'Create dispute invoice owner' })
  @Post('dispute/owner/:invoiceOwnerId')
  async createDisputeInvoiceOwner(
    @Body() disputeInvoice: DisputeInvoiceDTO,
      @CurrentUser() user: User,
      @Param('invoiceOwnerId') invoiceOwnerId: string,
  ): Promise<DisputeInvoiceDTO> {
    const newDisputeInvoice = await this.disputeInvoiceService.createDisputeOwnerForContractor(
      disputeInvoice,
      user,
      invoiceOwnerId,
    );
    return DisputeInvoiceDTO.fromModel(newDisputeInvoice);
  }

  @ApiAcceptedResponse({
    description: 'Get Filters for bills',
    type: DisputeInvoiceDTO,
  })
  @ApiOperation({ summary: 'Get Filters for bills' })
  @Get('bills/filters')
  async billsFilters(
    @CurrentUser() user: User,
      @Query()
      {
        customerId,
        projectId,
        material,
        truckId,
        startDate,
        endDate,
      }: {
        customerId: string;
        projectId: string;
        material: string;
        truckId: string;
        startDate: string;
        endDate: string;
      },
  ): Promise<BillsTicketsFiltered> {
    const parsedMaterial = JSON.parse(material);
    const parsedTrucks = JSON.parse(truckId);
    const response = await this.driverJobInvoiceService.getContractorBillsFilters(
      {
        user,
        customerId,
        projectId,
        material: parsedMaterial,
        truckId: parsedTrucks,
        startDate,
        endDate,
      },
    );
    return response;
  }

  @ApiOperation({ summary: 'Get invoices for tickets' })
  @ApiAcceptedResponse({
    description: 'Get invoices for tickets',
    type: DriverJobInvoice,
  })
  @Get('bills/tickets')
  async invoicesForBills(
    @Query()
      {
        customerId,
        projectId,
        material,
        truckId,
        startDate,
        endDate,
      }: {
        customerId: string;
        projectId: string;
        material: string;
        truckId: string;
        startDate: string;
        endDate: string;
      },
  ): Promise<DriverJobInvoice[]> {
    const parsedMaterial = JSON.parse(material);
    const parsedTrucks = JSON.parse(truckId);
    const response = await this.driverJobInvoiceService.getInvoicesForBills({
      customerId,
      projectId,
      material: parsedMaterial,
      truckId: parsedTrucks,
      startDate,
      endDate,
    });

    return response;
  }
}

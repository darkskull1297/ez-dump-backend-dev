import {
  Controller,
  UseGuards,
  Get,
  Query,
  Patch,
  Param,
  Body,
  Put,
  Post,
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
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole } from '../../../user/user.model';
import { JobInvoiceService } from '../../job-invoice.service';
import { PaginationDTO } from '../../../common/pagination.dto';
import { OwnerJobInvoiceDTO } from '../../dto/owner-job-invoice.dto';
import { JobInvoiceDTO } from '../../dto/job-invoice.dto';
import { DriverWeeklyInvoiceDTO } from '../../dto/driver-weekly-invoice.dto';
import { DriverJobInvoiceService } from '../../driver-job-invoice.service';
import { InvoicesQueryDTO } from '../../invoices-query.dto';
import { ReviewCashAdvanceDTO } from '../../dto/review-cash-advance.dto';
import { DisputeInvoiceService } from '../../dispute-invoice.service';
import { DisputeInvoiceDTO } from '../../dto/dispute-invoice.dto';
import { DisputeInvoice } from '../../dispute-invoice.model';
import { DisputeInvoiceQueryDTO } from '../../dto/dispute-invoice-query.dto';
import { DriverJobInvoice } from '../../driver-job-invoice.model';
import { DisputeInvoiceSolvedDTO } from '../../dto/dispute-invoice-solved.dto';
import { ManualPaymentService } from '../../manual-payment.service';
import { ManualPaymentDTO } from '../../dto/manual-payment.dto';
import { ManualPaymentUpdateDto } from '../../dto/manual-payment-update.dto';
import { DisputeLoads } from '../../dispute-loads.model';
import { DisputeLoadsRepo } from '../../dispute-loads.repository';

@ApiUnauthorizedResponse({
  description: 'Invalid token',
  type: FailureStringResponse,
})
@ApiForbiddenResponse({
  description: 'Invalid Role',
  type: FailureStringResponse,
})
@ApiBearerAuth('authorization')
@UseGuards(AuthGuard(), HasRole(UserRole.ADMIN))
@ApiTags('invoices')
@Controller('admin/invoices')
export class InvoiceAdminController {
  constructor(
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly manualPaymentService: ManualPaymentService,
    private readonly driverInvoiceService: DriverJobInvoiceService,
    private readonly disputeInvoiceService: DisputeInvoiceService,
    private readonly disputeLoadsRepo: DisputeLoadsRepo,
  ) {}

  @ApiOperation({ summary: 'Get disputes' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Disputes',
    type: DisputeInvoiceDTO,
    isArray: true,
  })
  @Get('dispute')
  async listDisputes(
    @Query() { skip, count }: DisputeInvoiceQueryDTO,
  ): Promise<DisputeInvoice[]> {
    const disputes = await this.disputeInvoiceService.getDisputesForAdmin({
      skip,
      count,
    });
    return disputes;
  }

  @ApiOperation({ summary: 'Get dispute owner invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Disputes Contractor Invoice',
    type: DisputeInvoiceDTO,
    isArray: true,
  })
  @Get('dispute/owner')
  async listDisputeOwnerInvoice(
    @Query() { skip, count }: DisputeInvoiceQueryDTO,
  ): Promise<DisputeInvoice[]> {
    const disputes = await this.disputeInvoiceService.getDisputesOwnerInvoiceForAdmin(
      {
        skip,
        count,
      },
    );
    return disputes;
  }

  @ApiOperation({ summary: 'Mark dispute invoice solved' })
  @ApiAcceptedResponse({
    description: 'Dispute Solved',
    type: Boolean,
  })
  @Post('/dispute-solved/:disputeId')
  async markDisputeSolved(
    @Param('disputeId') disputeId: string,
      @Body() disputeInvoiceSolved: DisputeInvoiceSolvedDTO,
  ): Promise<boolean> {
    await this.disputeInvoiceService.markDisputeSolved(
      disputeId,
      disputeInvoiceSolved,
    );
    // await this.emailService.disputesolved('', '', '');
    return true;
  }

  @ApiOperation({ summary: 'Get dispute driver invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Disputes Driver Invoice',
    type: DisputeInvoiceDTO,
    isArray: true,
  })
  @Get('dispute/driver')
  async listDisputeDriverInvoice(
    @Query() { skip, count }: DisputeInvoiceQueryDTO,
  ): Promise<DisputeInvoice[]> {
    const disputes = await this.disputeInvoiceService.getDisputesDriverInvoiceForAdmin(
      {
        skip,
        count,
      },
    );
    return disputes;
  }

  @ApiOperation({ summary: 'Get dispute invoice' })
  @ApiAcceptedResponse({
    description: 'Dispute Invoice',
    type: DisputeInvoiceDTO,
  })
  @Get('dispute/:id')
  async getDisputeInvoice(
    @Param('id') disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    const disputes = await this.disputeInvoiceService.getDisputeInvoiceForAdmin(
      disputeInvoiceId,
    );
    return disputes;
  }

  @ApiOperation({ summary: 'Put discount to contractor invoices' })
  @Put('contractor/:invoiceId/discount')
  async setContractorInvoiceDiscount(
    @Body() { discountValue }: { discountValue: number },
      @Param('invoiceId') invoiceId: string,
  ): Promise<boolean> {
    const response = await this.jobInvoiceService.setContractorInvoiceDiscount({
      discountValue,
      invoiceId,
    });
    return response;
  }

  @ApiOperation({ summary: 'Get Driver Invoice by Id' })
  @ApiOkResponse({
    description: 'Driver Invoice',
    type: DriverJobInvoice,
  })
  @Get('driver/:id')
  async getDriverInvoice(
    @Param('id') invoiceId: string,
  ): Promise<DriverJobInvoice> {
    const invoice = await this.driverInvoiceService.getDriverInvoiceForAdmin(
      invoiceId,
    );

    return invoice;
  }

  @ApiOperation({ summary: 'Get weekly invoice' })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: DriverWeeklyInvoiceDTO,
  })
  @Get('driver-weekly/payroll/:weeklyInvoiceId')
  async getWeeklyInvoice(
    @Param('weeklyInvoiceId') weeklyInvoiceId: string,
  ): Promise<DriverWeeklyInvoiceDTO> {
    const invoice = await this.driverInvoiceService.getWeeklyInvoiceForDriverFromOwner(
      weeklyInvoiceId,
    );
    return DriverWeeklyInvoiceDTO.fromModel(invoice);
  }

  @ApiOperation({ summary: 'Get contractor invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Contractor Invoices',
    type: JobInvoiceDTO,
    isArray: true,
  })
  @Get('contractor')
  async listContractor(
    @Query() { skip, count, isPaid }: InvoicesQueryDTO,
  ): Promise<JobInvoiceDTO[]> {
    const invoices = await this.jobInvoiceService.getContractorInvoicesForAdmin(
      {
        skip,
        count,
        isPaid,
      },
    );
    return Promise.all(
      invoices.map(invoice => JobInvoiceDTO.fromModel(invoice)),
    );
  }

  @ApiOperation({ summary: 'Get weekly invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Weekly Invoices',
    type: DriverWeeklyInvoiceDTO,
    isArray: true,
  })
  @Get('driver')
  async listDriver(
    @Query() { skip, count }: PaginationDTO,
  ): Promise<DriverWeeklyInvoiceDTO[]> {
    const invoices = await this.driverInvoiceService.getWeeklyInvoicesForAdmin({
      skip,
      count,
    });

    return invoices.map(invoice => DriverWeeklyInvoiceDTO.fromModel(invoice));
  }

  @ApiOperation({ summary: 'Put discount to owner invoices' })
  @Put('owner/:invoiceId/discount')
  async setOwnerInvoiceDiscount(
    @Body() { discountValue }: { discountValue: number },
      @Param('invoiceId') invoiceId: string,
  ): Promise<boolean> {
    const response = await this.jobInvoiceService.setOwnerInvoiceDiscount({
      discountValue,
      invoiceId,
    });
    return response;
  }

  @ApiOperation({ summary: 'Get owner invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Owner Invoices',
    type: OwnerJobInvoiceDTO,
    isArray: true,
  })
  @Get('owner')
  async listOwner(
    @Query() { skip, count, isPaid }: InvoicesQueryDTO,
  ): Promise<OwnerJobInvoiceDTO[]> {
    const invoices = await this.jobInvoiceService.getOwnerInvoicesForAdmin({
      skip,
      count,
      isPaid,
    });

    // eslint-disable-next-line no-return-await
    return await Promise.all(
      invoices.map(async invoice => {
        const data = OwnerJobInvoiceDTO.fromModel(invoice);
        const companyName = await this.jobInvoiceService.getCompanyNameForOwner(
          data.owner.id,
        );
        const owner = {
          ...data.owner,
          company: companyName.companyCommonName,
        };
        return { ...data, owner };
      }),
    );
  }

  @ApiOperation({ summary: 'Get Contractor Invoice by Id' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: JobInvoiceDTO,
  })
  @Get('contractor/:id')
  async getContractorInvoice(
    @Param('id') invoiceId: string,
  ): Promise<JobInvoiceDTO> {
    const invoice = await this.jobInvoiceService.getContractorInvoiceForAdmin(
      invoiceId,
    );

    const data = await JobInvoiceDTO.fromModel(invoice);
    const fillFinished = new Promise(resolve => {
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
      return { ...data, ownerInvoices };
    });
  }

  @ApiOperation({ summary: 'Get Invoice manual payment info ' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: ManualPaymentDTO,
  })
  @Get('manualPayment/:id')
  async getManualPaymentsInfo(
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

  @ApiOperation({ summary: 'Get admin --> owner invoice' })
  @ApiOkResponse({
    description: 'Owner Invoice',
    type: OwnerJobInvoiceDTO,
  })
  @Get('owner/:id')
  async getAdminToOwnerInvoice(
    @Param('id') invoiceId: string,
  ): Promise<OwnerJobInvoiceDTO> {
    const invoice = await this.jobInvoiceService.getOwnerInvoiceForAdminById(
      invoiceId,
    );
    const data = OwnerJobInvoiceDTO.fromModel(invoice);

    const fillFinished = new Promise(resolve => {
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

  @ApiOperation({ summary: 'Set invoice as paid' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: ManualPaymentDTO,
  })
  @Patch('manualPayment/confirm/:id')
  async confirmManualPayment(
    @Param('id') paymentId: string,
  ): Promise<ManualPaymentDTO> {
    const manualPayment = await this.manualPaymentService.confirm(paymentId);

    return ManualPaymentDTO.fromModel(manualPayment);
  }

  @ApiOperation({ summary: 'Reject manual payment' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: ManualPaymentDTO,
  })
  @Patch('manualPayment/reject/:id')
  async rejectManualPayment(
    @Param('id') invoiceId: string,
      @Body('reason') reason: string,
  ): Promise<ManualPaymentDTO> {
    const manualPayment = await this.manualPaymentService.reject(
      invoiceId,
      reason,
    );
    return ManualPaymentDTO.fromModel(manualPayment);
  }

  @ApiOperation({ summary: 'Update manual payment information' })
  @ApiOkResponse({
    description: 'Manual Payment id',
    type: String,
  })
  @Patch('manualPayment/:id')
  async updateManualPayment(
    @Param('id') paymentId: string,
      @Body() manualPaymentUpdateDto: ManualPaymentUpdateDto,
  ): Promise<string> {
    return this.manualPaymentService.update(
      paymentId,
      manualPaymentUpdateDto,
      'Admin',
    );
  }

  @ApiOperation({ summary: 'Pay Invoice by Check' })
  @Post('pay-invoice/manually/:invoiceId')
  payInvoiceManually(
    @Param('invoiceId') invoiceId: string,
      @Body()
      data: { paymentMethod: string; orderNumber: number; accountNumber: number },
  ): Promise<void> {
    return this.jobInvoiceService.markAdminToOwnerInvoicePaidManually(
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
      data: { paymentMethod: string; achNumber: number; accountNumber: number },
  ): Promise<void> {
    return this.jobInvoiceService.markAdminToOwnerInvoicePaidManually(
      invoiceId,
      data.paymentMethod,
      data.achNumber,
      data.accountNumber,
    );
  }

  @ApiOperation({ summary: 'Get driver ticket loads' })
  @Get('driver-ticket/loads/:jobId/:truckId/:driverId/:categoryId')
  async getDriverTicketLoads(
    @Param('truckId') truckId: string,
      @Param('jobId') jobId: string,
      @Param('driverId') driverId: string,
      @Param('categoryId') categoryId: string,
  ): Promise<DisputeLoads[]> {
    return this.disputeInvoiceService.getLoadsForDispute(
      truckId,
      jobId,
      driverId,
      categoryId,
    );
  }

  @ApiOperation({ summary: 'Review cash advance request' })
  @ApiAcceptedResponse({
    type: String,
  })
  @Post('review-cash-advance/:invoiceId')
  async confirmCashAdvance(
    @Body() { confirm }: ReviewCashAdvanceDTO,
      @Param('invoiceId') invoiceId: string,
  ): Promise<string> {
    await this.jobInvoiceService.reviewCashAdvance(invoiceId, confirm);
    return `Cash advance ${confirm ? 'accepted' : 'rejected'}`;
  }

  @ApiOperation({ summary: 'Update or create load' })
  @Put('driver-ticket/loads')
  async updateLoadInformation(@Body('params') params: any): Promise<boolean> {
    return this.disputeLoadsRepo.updateOrCreateLoad(params);
  }

  @ApiOperation({ summary: 'Delete load' })
  @Delete('driver-ticket/loads/:loadId')
  async deleteLoad(@Param('loadId') loadId: string): Promise<boolean> {
    return this.disputeLoadsRepo.deleteLoad(loadId);
  }

  @ApiOperation({
    summary: 'Get image upload url',
    description: 'Returns the url to upload a medical card image',
  })
  @ApiAcceptedResponse({
    description: 'Url',
    type: String,
  })
  @Get('disputes/attachments/url')
  getUpdateProfileImageUrl(): Promise<string> {
    return this.disputeInvoiceService.getUploadImageUrl();
  }
}

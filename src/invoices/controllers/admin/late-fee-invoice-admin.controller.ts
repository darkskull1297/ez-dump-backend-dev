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

import { InjectEventEmitter } from 'nest-emitter';
import { FailureStringResponse } from '../../../common/response.model';
import { HasRole } from '../../../auth/has-role.guard';
import { UserRole } from '../../../user/user.model';
import { OwnerJobInvoiceDTO } from '../../dto/owner-job-invoice.dto';
import { DriverJobInvoiceService } from '../../driver-job-invoice.service';
import { InvoicesQueryDTO } from '../../invoices-query.dto';
import { ReviewCashAdvanceDTO } from '../../dto/review-cash-advance.dto';
import { DisputeInvoiceService } from '../../dispute-invoice.service';
import { EmailService } from '../../../email/email.service';
import { LateFeeManualPaymentDTO } from '../../dto/late-fee-manual-payment.dto';
import { ManualPaymentUpdateDto } from '../../dto/manual-payment-update.dto';
import { LateFeeInvoiceDTO } from '../../dto/late-fee-invoice.dto';
import { LateFeeInvoiceService } from '../../late-fee-invoice.service';
import { LateFeeManualPaymentService } from '../../late-fee-manual-payment.service';

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
@Controller('admin/late-fee-invoices')
export class LateFeeInvoiceAdminController {
  constructor(
    private readonly lateFeeInvoiceService: LateFeeInvoiceService,
    private readonly lateFeeManualPaymentService: LateFeeManualPaymentService,
    private readonly driverInvoiceService: DriverJobInvoiceService,
    private readonly disputeInvoiceService: DisputeInvoiceService,
    @InjectEventEmitter()
    private readonly emailService: EmailService,
  ) {}

  @ApiOperation({ summary: 'Put discount to contractor late fee invoices' })
  @Put('contractor/:invoiceId/discount')
  async setContractorInvoiceDiscount(
    @Body() { discountValue }: { discountValue: number },
      @Param('invoiceId') invoiceId: string,
  ): Promise<boolean> {
    const response = await this.lateFeeInvoiceService.setContractorInvoiceDiscount(
      {
        discountValue,
        invoiceId,
      },
    );
    return response;
  }

  @ApiOperation({ summary: 'Get contractor late fee invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'Contractor Invoices',
    type: LateFeeInvoiceDTO,
    isArray: true,
  })
  @Get('contractor')
  async listContractor(
    @Query() { skip, count, isPaid }: InvoicesQueryDTO,
  ): Promise<LateFeeInvoiceDTO[]> {
    const invoices = await this.lateFeeInvoiceService.getContractorInvoicesForAdmin(
      {
        skip,
        count,
        isPaid,
      },
    );
    return Promise.all(
      invoices.map(invoice => LateFeeInvoiceDTO.fromModel(invoice)),
    );
  }

  @ApiOperation({ summary: 'Get Contractor Invoice by Id' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: LateFeeInvoiceDTO,
  })
  @Get('contractor/:id')
  async getContractorInvoice(
    @Param('id') invoiceId: string,
  ): Promise<LateFeeInvoiceDTO> {
    const invoice = await this.lateFeeInvoiceService.getContractorInvoiceForAdmin(
      invoiceId,
    );

    const data = await LateFeeInvoiceDTO.fromModel(invoice);
    return { ...data };
  }

  @ApiOperation({ summary: 'Get Invoice manual payment info ' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: LateFeeManualPaymentDTO,
  })
  @Get('manualPayment/:id')
  async getManualPaymentsInfo(
    @Param('id') invoiceId: string,
  ): Promise<LateFeeManualPaymentDTO[]> {
    const manualPayment = await this.lateFeeManualPaymentService.getManualPaymentsByInvoice(
      invoiceId,
    );

    if (!manualPayment) return [];

    return manualPayment.map(payment => {
      return LateFeeManualPaymentDTO.fromModel(payment);
    });
  }

  @ApiOperation({ summary: 'Set invoice as paid' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: LateFeeManualPaymentDTO,
  })
  @Patch('manualPayment/confirm/:id')
  async confirmManualPayment(
    @Param('id') paymentId: string,
  ): Promise<LateFeeManualPaymentDTO> {
    const manualPayment = await this.lateFeeManualPaymentService.confirm(
      paymentId,
    );

    return LateFeeManualPaymentDTO.fromModel(manualPayment);
  }

  @ApiOperation({ summary: 'Reject manual payment' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: LateFeeManualPaymentDTO,
  })
  @Patch('manualPayment/reject/:id')
  async rejectManualPayment(
    @Param('id') invoiceId: string,
      @Body('reason') reason: string,
  ): Promise<LateFeeManualPaymentDTO> {
    const manualPayment = await this.lateFeeManualPaymentService.reject(
      invoiceId,
      reason,
    );

    return LateFeeManualPaymentDTO.fromModel(manualPayment);
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
    return this.lateFeeManualPaymentService.update(
      paymentId,
      manualPaymentUpdateDto,
    );
  }

  // @ApiOperation({ summary: 'Pay Invoice by Check' })
  // @Post('pay-invoice/manually/:invoiceId')
  // payInvoiceManually(
  //   @Param('invoiceId') invoiceId: string,
  //     @Body()
  //     data: { paymentMethod: string; orderNumber: number; accountNumber: number },
  // ): Promise<void> {
  //   return this.lateFeeInvoiceService.markAdminToOwnerInvoicePaidManually(
  //     invoiceId,
  //     data.paymentMethod,
  //     data.orderNumber,
  //     data.accountNumber,
  //   );
  // }

  // @ApiOperation({ summary: 'Pay Invoice by ACH' })
  // @Post('pay-invoice/manually/ACH/:invoiceId')
  // payInvoiceManuallyACH(
  //   @Param('invoiceId') invoiceId: string,
  //     @Body()
  //     data: { paymentMethod: string; achNumber: number; accountNumber: number },
  // ): Promise<void> {
  //   return this.lateFeeInvoiceService.markAdminToOwnerInvoicePaidManually(
  //     invoiceId,
  //     data.paymentMethod,
  //     data.achNumber,
  //     data.accountNumber,
  //   );
  // }

  //   @ApiOperation({ summary: 'Review cash advance request' })
  //   @ApiAcceptedResponse({
  //     type: String,
  //   })
  //   @Post('review-cash-advance/:invoiceId')
  //   async confirmCashAdvance(
  //     @Body() { confirm }: ReviewCashAdvanceDTO,
  //       @Param('invoiceId') invoiceId: string,
  //   ): Promise<string> {
  //     await this.lateFeeInvoiceService.reviewCashAdvance(invoiceId, confirm);
  //     return `Cash advance ${confirm ? 'accepted' : 'rejected'}`;
  //   }
}

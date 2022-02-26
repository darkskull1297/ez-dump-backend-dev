import {
  Controller,
  UseGuards,
  Get,
  Query,
  Param,
  Post,
  Body,
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
import { CurrentUser } from '../../../user/current-user.decorator';
import { LateFeeInvoiceService } from '../../late-fee-invoice.service';
import { Contractor } from '../../../user/contractor.model';
import { InvoicesQueryDTO } from '../../invoices-query.dto';
import { LateFeeInvoiceDTO } from '../../dto/late-fee-invoice.dto';
import { LateFeeManualPaymentDTO } from '../../dto/late-fee-manual-payment.dto';
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
@UseGuards(AuthGuard(), HasRole(UserRole.CONTRACTOR))
@ApiTags('late-fee-invoices')
@Controller('contractor/late-fee-invoices')
export class LateFeeInvoiceContractorController {
  constructor(
    private readonly lateFeeInvoiceService: LateFeeInvoiceService,
    private readonly lateFeeManualPaymentService: LateFeeManualPaymentService,
  ) {}

  @ApiOperation({ summary: 'Get Invoice manual payment info ' })
  @ApiOkResponse({
    description: 'Manual Payment',
    type: LateFeeManualPaymentDTO,
  })
  @Get('manualPayment/:id')
  async getManualPaymentInfo(
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

  @ApiOperation({ summary: 'Get Late Fee Invoices' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'count', required: false, type: Number })
  @ApiAcceptedResponse({
    description: 'LateFeeInvoices',
    type: LateFeeInvoiceDTO,
    isArray: true,
  })
  @Get()
  async listLateFeeInvoices(
    @CurrentUser() user: Contractor,
      @Query() { skip, count }: InvoicesQueryDTO,
  ): Promise<LateFeeInvoiceDTO[]> {
    const lateFeeInvoices = await this.lateFeeInvoiceService.getContractorLateFeeInvoices(
      user,
      {
        skip,
        count,
      },
    );
    return Promise.all(
      lateFeeInvoices.map(async invoice =>
        LateFeeInvoiceDTO.fromModel(invoice),
      ),
    );
  }

  @ApiOperation({ summary: 'Get Late Fee Invoice' })
  @ApiOkResponse({
    description: 'Late fee Invoice',
    type: LateFeeInvoiceDTO,
  })
  @Get(':id')
  async getInvoice(
    @CurrentUser() contractor: Contractor,
      @Param('id') invoiceId: string,
  ): Promise<any> {
    const invoice = await this.lateFeeInvoiceService.getInvoiceForContractor(
      contractor,
      invoiceId,
    );

    const data = await LateFeeInvoiceDTO.fromModel(invoice);
    return data;
  }

  @ApiOperation({ summary: 'Pay Invoice by Check' })
  @Post('pay-invoice/manually/:invoiceId')
  payInvoiceManually(
    @Param('invoiceId') invoiceId: string,
      @Body()
      data: { paymentMethod: string; orderNumber: string; accountNumber: string },
  ): Promise<void> {
    return this.lateFeeInvoiceService.markContractorInvoicePaidManually(
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
    return this.lateFeeInvoiceService.markContractorInvoicePaidManually(
      invoiceId,
      data.paymentMethod,
      data.orderNumber,
      data.accountNumber,
    );
  }
}

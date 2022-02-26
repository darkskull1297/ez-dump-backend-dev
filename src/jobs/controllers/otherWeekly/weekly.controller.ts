import {
  Controller,
  Get,
  Param,
  Res,
  Header,
  Post,
  Body,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import path from 'path';
import { JobInvoiceDTO } from '../../../invoices/dto/job-invoice.dto';
import { OwnerJobInvoiceDTO } from '../../../invoices/dto/owner-job-invoice.dto';
import { JobInvoiceService } from '../../../invoices/job-invoice.service';
import { UserRepo } from '../../../user/user.repository';
import { JobsService } from '../../jobs.service';
import { OwnerRepo } from '../../../user/owner.repository';
import { ContractorRepo } from '../../../user/contractor.repository';
import { UserService } from '../../../user/user.service';

@Controller('weekly')
export class WeeklyController {
  constructor(
    private readonly jobService: JobsService,
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepo,
    private readonly ownerRepo: OwnerRepo,
    private readonly contractorRepo: ContractorRepo,
  ) {}

  @Get('report-admin/:first/:last/:firstWeek/:lastWeek')
  async getWeeklyReportAdmin(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('firstWeek') firstWeek: string,
      @Param('lastWeek') lastWeek: string,
  ): Promise<any> {
    return this.jobService.getAdminWeeklyReport(
      firstDay,
      lastDay,
      firstWeek,
      lastWeek,
    );
  }

  @Get('report-contractor/:contractor/:first/:last')
  async getWeeklyReportContractor(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('contractor') contractorId: string,
  ): Promise<any> {
    return this.jobService.getContractorWeeklyReport(
      contractorId,
      firstDay,
      lastDay,
    );
  }

  @Get('report-dispatcher/:dispatcher/:first/:last')
  async getWeeklyReportDispatcher(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('dispatcher') dispatcherId: string,
  ): Promise<any> {
    const dispatcher = await this.userRepository.findById(dispatcherId);
    const contractor = await this.userService.getContractorByDispatcher(
      dispatcher,
    );
    return this.jobService.getContractorWeeklyReport(
      contractor.id,
      firstDay,
      lastDay,
    );
  }

  @Get('report-owner/:owner/:first/:last/:firstWeek/:lastWeek')
  async getWeeklyReportOwner(
    @Param('owner') ownerId: string,
      @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('firstWeek') firstWeek: string,
      @Param('lastWeek') lastWeek: string,
  ): Promise<any> {
    return this.jobService.getOwnerWeeklyReport(
      ownerId,
      firstDay,
      lastDay,
      firstWeek,
      lastWeek,
    );
  }

  @Get('print-admin/:first/:last')
  @Header('Content-type', 'application/pdf')
  async printAdmin(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Res() res,
  ): Promise<any> {
    const baseURL = 'https://admin.ezdumptruck.com/';
    const URL = `${baseURL}printAdmin/${firstDay}/${lastDay}`;
    console.log('URL', URL);
    await this.jobService.printWeekly(URL, false);
    const Ruta = path.join(__dirname, '..', '..', '..', '..', 'Weekly.pdf');
    console.log('Ruta', Ruta);

    res.download(Ruta);
  }

  @Get('print/:role/:id/:first/:last')
  @Header('Content-type', 'application/pdf')
  async printOwnerContractor(
    @Param('first') firstDay: string,
      @Param('last') lastDay: string,
      @Param('id') id: string,
      @Param('role') role: string,
      @Res() res,
  ): Promise<any> {
    const baseURL = 'https://admin.ezdumptruck.com/';
    let URL = '';
    if (role === 'contractor') {
      URL = `${baseURL}printContractor/${id}/${firstDay}/${lastDay}`;
    } else if (role === 'dispatcher') {
      URL = `${baseURL}printDispatcher/${id}/${firstDay}/${lastDay}`;
    } else if (role === 'owner') {
      URL = `${baseURL}printOwner/${id}/${firstDay}/${lastDay}`;
    }
    console.log('URL__________', URL);

    await this.jobService.printWeekly(URL, false);
    const Ruta = path.join(__dirname, '..', '..', '..', '..', 'Weekly.pdf');
    console.log('Ruta', Ruta);

    res.download(Ruta);
  }

  @Get('print-ticket/admin/:invoiceID/:role')
  @Header('Content-type', 'application/pdf')
  async printTicketsAdmin(
    @Param('invoiceID') invoiceId: string,
      @Param('role') role: string,
      @Res() res,
  ): Promise<any> {
    const URL = `http://ez-dump-reports.s3-website-us-east-1.amazonaws.com/ticket/${invoiceId}/${role}/admin`;
    await this.jobService.printWeekly(URL, false);
    const Ruta = path.join(__dirname, '..', '..', '..', '..', 'Weekly.pdf');

    (async () => setTimeout(() => res.download(Ruta), 2000))();
  }

  @Get('print-ticket/:invoiceIDFilter/:userID/:invoiceID/:role')
  @Header('Content-type', 'application/pdf')
  async printTickets(
    @Param('invoiceIDFilter') invoiceIDFilter: string,
      @Param('userID') userID: string,
      @Param('invoiceID') invoiceId: string,
      @Param('role') role: string,
      @Res() res,
  ): Promise<any> {
    const URL = `http://ez-dump-reports.s3-website-us-east-1.amazonaws.com/ticket/${userID}/${invoiceIDFilter}/${invoiceId}/${role}`;
    await this.jobService.printWeekly(URL, false);
    const Ruta = path.join(__dirname, '..', '..', '..', '..', 'Weekly.pdf');

    (async () => setTimeout(() => res.download(Ruta), 2000))();
  }

  @Get('report-filter-selects/:ID')
  async reportFilter(@Param('ID') contractorId: string): Promise<any> {
    const response = await this.jobService.getReportSelects(contractorId);
    return response;
  }

  @Post('pdf-tickets/:startDate/:endDate/:ID')
  @Header('Content-type', 'application/pdf')
  async pdfTicket(
    @Res() res,
      @Body()
      body: {
        owner?: string;
        jobs?: string[];
        trucks?: string[];
        materials?: string[];
      },
      @Param('startDate') start: string,
      @Param('endDate') end: string,
      @Param('ID') id: string,
  ): Promise<any> {
    const URL = `http://ez-dump-reports.s3-website-us-east-1.amazonaws.com/tickets-list/${start}/${end}/${id}/${JSON.stringify(
      body,
    )}`;

    console.log('URL', URL);
    await this.jobService.printWeekly(URL, true);
    const Ruta = path.join(__dirname, '..', '..', '..', '..', 'Weekly.pdf');

    res.download(Ruta);
  }

  @Post('csv-tickets/:startDate/:endDate/:ID')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async csvTicket(
    @Res() res,
      @Body()
      body: {
        owner?: string;
        jobs?: string[];
        trucks?: string[];
        materials?: string[];
      },
      @Param('startDate') start: string,
      @Param('endDate') end: string,
      @Param('ID') contractor: string,
  ): Promise<any> {
    await this.jobService.exportExcelService(body, start, end, contractor);
    const Ruta = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'excel-from-js.xlsx',
    );

    res.download(Ruta);
  }

  @Post('settlement/:startDate/:endDate/:contractor')
  async getSettlement(
    @Body()
      body: {
        owner?: string;
        jobs?: string[];
        trucks?: string[];
        materials?: string[];
      },
      @Param('startDate') start: string,
      @Param('endDate') end: string,
      @Param('contractor') contractor: string,
  ): Promise<any> {
    const response = await this.jobService.getSettlementData(
      body,
      start,
      end,
      contractor,
    );
    return response;
  }

  @ApiOperation({ summary: 'Get Invoice' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: JobInvoiceDTO,
  })
  @Get('invoicesC/:id/:userID')
  async getInvoiceContractor(
    @Param('userID') userID: string,
      @Param('id') invoiceId: string,
  ): Promise<JobInvoiceDTO> {
    const contractor = await this.userRepository.findById(userID);
    const companyName = await this.contractorRepo.getContractorCompanyName(
      userID,
    );
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

    return fillFinished.then(() => {
      return {
        ...data,
        ownerCompany: invoice.ownerCompany,
        CompanyName: companyName,
      };
    });
  }

  @ApiOperation({ summary: 'Get Invoice' })
  @ApiOkResponse({
    description: 'Job Invoice',
    type: OwnerJobInvoiceDTO,
  })
  @Get('invoices/:id/:userID')
  async getInvoice(
    @Param('id') invoiceId: string,
      @Param('userID') userID: string,
  ): Promise<OwnerJobInvoiceDTO> {
    const owner = await this.userRepository.findById(userID);
    const companyName = await this.ownerRepo.getOwnerCompany(userID);
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
        CompanyName: companyName,
      };
    });
  }

  @ApiOperation({ summary: 'Get inspection report data' })
  @Get('report/:id')
  async getReportData(@Param('id') inspectionNumber: number): Promise<any> {
    const data = await this.jobService.getInspectionReportData(
      inspectionNumber,
    );

    return data;
  }

  @Get('admin/contractor/:id')
  async getContractorInvoice(
    @Param('id') invoiceId: string,
  ): Promise<JobInvoiceDTO> {
    const invoice = await this.jobInvoiceService.getContractorInvoiceForAdmin(
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

    return fillFinished.then(() => {
      return { ...data, ownerCompany: invoice.ownerCompany };
    });
  }

  @Get('admin/owner/:id')
  async getOwnerInvoice(
    @Param('id') invoiceId: string,
  ): Promise<OwnerJobInvoiceDTO> {
    const invoice = await this.jobInvoiceService.getOwnerInvoiceForAdmin(
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
      return { ...data, contractorCompanyName: invoice.contractorCompanyName };
    });
  }
}

import { Injectable } from '@nestjs/common';

import { JobAssignation } from '../jobs/job-assignation.model';
import { JobCommodity } from '../jobs/job-commodity';

@Injectable()
export class JobInvoiceCalculator {
  calculator = {
    [JobCommodity.BY_HOUR]: this.calculateByHour,
    [JobCommodity.BY_TON]: this.calculateByTon,
    [JobCommodity.BY_LOAD]: this.calculateByLoad,
  };

  calculateAmount(
    price: number,
    commodity: JobCommodity,
    { tons, load }: { tons: number; load: number },
    hours: number,
  ): number {
    return this.calculator[commodity](price, { tons, load }, hours);
  }

  private calculateByHour(
    price: number,
    data: { tons: number; load: number },
    hours: number,
  ): number {
    return hours * price;
  }

  private calculateByTon(
    price: number,
    data: { tons: number; load: number },
  ): number {
    return data.tons * price;
  }

  private calculateByLoad(
    price: number,
    data: { tons: number; load: number },
  ): number {
    return data.load * price;
  }
}

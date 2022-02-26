import { Injectable } from '@nestjs/common';
import { AnaliticsOwnerRepository } from './analitics.repository';

@Injectable()
export class AnaliticsService {
  constructor(
    private readonly analiticsOwnerRepository: AnaliticsOwnerRepository,
  ) {}

  async getOwnerAnalitics(owner): Promise<any> {
    try {
      const {
        jobDetails,
        driversDetails,
        truckDetails,
        ownerInvoicesPaid,
        ownerInvoicesUnPaid,
      } = await this.analiticsOwnerRepository.getOwnerAnalitics(owner);

      return {
        jobDetails,
        driversDetails,
        truckDetails,
        ownerInvoicesPaid,
        ownerInvoicesUnPaid,
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getContractorAnalitics(contractor): Promise<any> {
    try {
      const res = await this.analiticsOwnerRepository.getContractorAnalitics(
        contractor,
      );
      return { ...res };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

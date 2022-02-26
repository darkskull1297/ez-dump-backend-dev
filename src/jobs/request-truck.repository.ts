import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { RequestTruck } from './request-truck.model';
import { RequestTruckDTO } from './dto/request-truck.dto';
import { GeneralJobRepo } from '../general-jobs/general-job.repository';
import { User } from '../user/user.model';
import { TruckCategoryRequestTruck } from '../trucks/truck-category-request-truck.model';
import { Foreman } from '../user/foreman.model';
import { JobStatus } from './job-status';
import { Dispatcher } from '../user/dispatcher.model';

@Injectable()
export class RequestTruckRepo extends BaseRepository<RequestTruck>(
  RequestTruck,
) {
  constructor(
    @InjectRepository(RequestTruck)
    private readonly requestTruckRepo: Repository<RequestTruck>,
    private readonly generalJobRepo: GeneralJobRepo,
  ) {
    super(requestTruckRepo);
  }

  async requestTruck(jobData: RequestTruckDTO, user: Foreman): Promise<any> {
    const generalJob = await this.generalJobRepo.findById(jobData.generalJob);

    const requestTruck = this.requestTruckRepo.create({
      ...jobData,
      generalJob,
      contractor: await user.contractorCompany.contractor,
      foreman: user,
      onSite: jobData.onSite,
      truckCategories: jobData.truckCategories.map(cat => {
        const category = new TruckCategoryRequestTruck();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.amount = cat.amount;
        category.payBy = cat.payBy;
        category.price = cat.price;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        return category;
      }),
    });

    await this.requestTruckRepo.save(requestTruck);

    return jobData;
  }

  async findContractorRequestedTrucks(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: any,
  ): Promise<RequestTruck[]> {
    const gid = generalJobId.generalJobId;
    const response = await this.requestTruckRepo
      .createQueryBuilder('requestTruck')
      .leftJoinAndSelect('requestTruck.generalJob', 'generalJob')
      .leftJoinAndSelect('requestTruck.contractor', 'contractor')
      .leftJoinAndSelect('requestTruck.truckCategories', 'truckCategories')
      .where('contractor.id = :id', { id: user.id })
      .andWhere('requestTruck.status = :status', {
        status: JobStatus.REQUESTED,
      })
      .andWhere('generalJob.id = :gid', { gid })
      .skip(skip)
      .take(count)
      .getMany();

    return response;
  }

  async deleteRequestedTruck(requestedTruckId: any): Promise<boolean> {
    const { id } = requestedTruckId;
    const requestedTruck = await this.requestTruckRepo.findOne({ id });
    await this.requestTruckRepo.remove(requestedTruck);
    return true;
  }

  async findContractorRequestedTrucksForeman(
    user: Foreman,
    { skip, count }: { skip: number; count: number },
    generalJobId: any,
  ): Promise<RequestTruck[]> {
    const gid = generalJobId.generalJobId;
    const contractor = await user.contractorCompany.contractor;

    const response = await this.requestTruckRepo
      .createQueryBuilder('requestTruck')
      .leftJoinAndSelect('requestTruck.generalJob', 'generalJob')
      .leftJoinAndSelect('requestTruck.contractor', 'contractor')
      .leftJoinAndSelect('requestTruck.foreman', 'foreman')
      .leftJoinAndSelect('requestTruck.truckCategories', 'truckCategories')
      .where('generalJob.id = :gid', { gid })
      .andWhere('contractor.id = :contractorId', {
        contractorId: contractor.id,
      })
      .andWhere('foreman.id = :foremanId', { foremanId: user.id })
      .orderBy('requestTruck.startDate', 'DESC')
      .skip(skip)
      .take(count)
      .getMany();

    return response;
  }

  async getTotals(user: User, generalJobId: string): Promise<number> {
    const response = await this.requestTruckRepo
      .createQueryBuilder('requestTruck')
      .leftJoinAndSelect('requestTruck.generalJob', 'generalJob')
      .leftJoinAndSelect('requestTruck.contractor', 'contractor')
      .leftJoinAndSelect('requestTruck.truckCategories', 'truckCategories')
      .where('contractor.id = :id', { id: user.id })
      .andWhere('requestTruck.status = :status', {
        status: JobStatus.REQUESTED,
      })
      .andWhere('generalJob.id = :gid', { gid: generalJobId })
      .getCount();

    return response;
  }

  async getDispatcherTotals(
    user: Dispatcher,
    generalJobId: string,
  ): Promise<number> {
    const contractor = await user.contractorCompany.contractor;

    const response = await this.requestTruckRepo
      .createQueryBuilder('requestTruck')
      .leftJoinAndSelect('requestTruck.generalJob', 'generalJob')
      .leftJoinAndSelect('requestTruck.contractor', 'contractor')
      .leftJoinAndSelect('requestTruck.truckCategories', 'truckCategories')
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('requestTruck.status = :status', {
        status: JobStatus.REQUESTED,
      })
      .andWhere('generalJob.id = :gid', { gid: generalJobId })
      .getCount();

    return response;
  }

  async getForemanTotals(user: Foreman, generalJobId: string): Promise<number> {
    const contractor = await user.contractorCompany.contractor;

    const response = await this.requestTruckRepo
      .createQueryBuilder('requestTruck')
      .leftJoinAndSelect('requestTruck.generalJob', 'generalJob')
      .leftJoinAndSelect('requestTruck.contractor', 'contractor')
      .leftJoinAndSelect('requestTruck.foreman', 'foreman')
      .leftJoinAndSelect('requestTruck.truckCategories', 'truckCategories')
      .where('contractor.id = :contractorId', { contractorId: contractor.id })
      .andWhere('foreman.id = :foremanId', { foremanId: user.id })
      .andWhere('generalJob.id = :gid', { gid: generalJobId })
      .getCount();

    return response;
  }
}

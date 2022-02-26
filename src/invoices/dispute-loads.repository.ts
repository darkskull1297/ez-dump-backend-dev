import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { DisputeLoads } from './dispute-loads.model';

@Injectable()
export class DisputeLoadsRepo extends BaseRepository<DisputeLoads>(
  DisputeLoads,
) {
  constructor(
    @InjectRepository(DisputeLoads)
    private readonly disputeLoadsRepo: Repository<DisputeLoads>,
  ) {
    super(disputeLoadsRepo);
  }

  async getLoadsForDispute(
    assignationId: string,
    jobId: string,
    truckId: string,
  ): Promise<DisputeLoads[]> {
    const data = await this.disputeLoadsRepo
      .createQueryBuilder('disputeLoads')
      .innerJoinAndSelect('disputeLoads.assignation', 'assignation')
      .innerJoin('disputeLoads.truck', 'truck')
      .innerJoin('disputeLoads.job', 'job')
      .where('assignation.id = :assignationId', { assignationId })
      .andWhere('job.id = :jobId', { jobId })
      .andWhere('truck.id = :truckId', { truckId })
      .getMany();

    return data;
  }

  async updateOrCreateLoad(load: DisputeLoads): Promise<boolean> {
    try {
      const newLoad = new DisputeLoads();

      for (const key in load) {
        newLoad[key] = load[key]
      }

      await this.disputeLoadsRepo.save(load);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  async deleteLoad(loadId: string): Promise<boolean> {
    try {
      await this.disputeLoadsRepo.delete({ id: loadId });
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}

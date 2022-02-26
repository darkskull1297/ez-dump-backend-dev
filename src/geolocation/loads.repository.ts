import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import { BaseRepository } from '../common/base.repository';
import { Loads } from './loads.model';
import { GeolocationType } from './geolocation-type';
import { GeofenceAction } from './geofence-type';
import { NotificationEventEmitter } from '../notification/notification.events';
import { Job } from '../jobs/job.model';
import { Truck } from '../trucks/truck.model';
import { JobAssignation } from '../jobs/job-assignation.model';

@Injectable()
export class LoadsRepo extends BaseRepository<Loads>(Loads) {
  constructor(
    @InjectRepository(Loads)
    private readonly loadsRepo: Repository<Loads>,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
  ) {
    super(loadsRepo);
  }

  async insertOrUpdateLoad(
    type: string,
    job: Job,
    truck: Truck,
    date: string,
    action: GeofenceAction,
    userID: string,
    assignation: JobAssignation,
  ): Promise<number> {
    const lastLoadTracked = await this.loadsRepo.query(
      `SELECT * FROM loads WHERE "jobId" = '${job.id}' AND "truckId" = '${truck.id}' ORDER BY "loadNumber" DESC LIMIT 1`,
    );
    let updateLoad = false;

    if (type === GeolocationType.LOAD_SITE) {
      const willCreateLoad =
        action === GeofenceAction.ENTER &&
        (lastLoadTracked.length === 0 ||
          (lastLoadTracked[0].load && lastLoadTracked[0].dump));

      if (willCreateLoad) {
        const lastLoadNumber =
          lastLoadTracked.length > 0 ? lastLoadTracked[0].loadNumber : 0;

        const newLoad = {
          load: true,
          loadArrival: new Date(date),
          job,
          truck,
          loadNumber: lastLoadNumber + 1,
          assignation,
        };
        updateLoad = true;
        await this.loadsRepo.save(newLoad);
      } else if (
        action === GeofenceAction.EXIT &&
        !lastLoadTracked[0].loadLeave
      ) {
        const leaveDate =
          new Date(date) < new Date(lastLoadTracked[0].loadArrival)
            ? moment(date).add(3, 'minutes')
            : new Date(date);

        lastLoadTracked[0].loadLeave = leaveDate;
        updateLoad = true;
        await this.loadsRepo.save(lastLoadTracked[0]);
      }
    } else if (type === GeolocationType.DUMP_SITE) {
      if (action === GeofenceAction.ENTER && !lastLoadTracked[0].dumpArrival) {
        lastLoadTracked[0].dump = true;
        lastLoadTracked[0].dumpArrival = new Date(date);
        updateLoad = true;
        await this.loadsRepo.save(lastLoadTracked[0]);
      } else if (
        action === GeofenceAction.EXIT &&
        !lastLoadTracked[0].dumpLeave &&
        lastLoadTracked[0].dump
      ) {
        const leaveDate =
          new Date(date) < new Date(lastLoadTracked[0].dumpArrival)
            ? moment(date).add(3, 'minutes')
            : new Date(date);

        lastLoadTracked[0].dumpLeave = leaveDate;
        updateLoad = true;
        await this.loadsRepo.save(lastLoadTracked[0]);
      }
    }

    if (updateLoad) {
      const loads = await this.loadsRepo.find({ job });

      this.eventEmitter.emit('updateLoad', {
        loads,
        jobId: job.id,
        userId: userID,
      });
    }

    return this.getLoadCounts(job, truck, assignation);
  }

  async getLoads(jobID: string, truckIDs: string[], driverInvoiceIDs: string[]): Promise<Loads[]> {
    const data = await this.loadsRepo
      .createQueryBuilder('loads')
      .leftJoinAndSelect('loads.job', 'job')
      .leftJoinAndSelect('loads.truck', 'truck')
      .leftJoinAndSelect('loads.assignation', 'assignation')
      .leftJoin('loads.driverInvoice', 'driverInvoice')
      .where('job.id = :jobId', { jobId: jobID })
      .andWhere('truck.id IN (:...truckIDs)', { truckIDs })
      .andWhere('driverInvoice.id IN (:...driverInvoiceIDs)' , { driverInvoiceIDs })
      .orderBy('"loadNumber"', 'ASC')
      .getMany();

    return data;
  }

  async getLoadsForDriver(
    jobID: string,
    truckID: string,
    assignationID: string,
  ): Promise<Loads[]> {
    const data = await this.loadsRepo
      .createQueryBuilder('loads')
      .leftJoinAndSelect('loads.truck', 'truck')
      .leftJoinAndSelect('loads.job', 'job')
      .leftJoinAndSelect('loads.assignation', 'assignation')
      .where('job.id = :jobId', { jobId: jobID })
      .andWhere('truck.id = :truckID', { truckID })
      .andWhere('assignation.id = :assignationID', { assignationID })
      .orderBy('"loadNumber"', 'ASC')
      .getMany();

    return data;
  }

  async checkCompletedLoads(jobID: string, truckID: string): Promise<boolean> {
    const data = await this.loadsRepo
      .createQueryBuilder('loads')
      .where('"jobId" = :jobId', { jobId: jobID })
      .andWhere('"truckId" = :truckID', { truckID })
      .orderBy('"loadNumber"', 'ASC')
      .getMany();

    const incompletedEntries = data.filter(load => {
      return load.ticket === null || load.tons === null;
    });

    return incompletedEntries.length === 0;
  }

  async updateLoads(loads: Loads[]): Promise<boolean> {
    try {
      loads.forEach(async load => {
        await this.loadsRepo.save(load);
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async countManualLoads(
    job: Job,
    truck: Truck,
    assignation: JobAssignation,
  ): Promise<number> {
    try {
      const lastLoadTracked = await this.loadsRepo.query(
        `SELECT * FROM loads WHERE "jobId" = '${job.id}' AND "truckId" = '${truck.id}' AND "assignationId" = '${assignation.id}' ORDER BY "loadNumber" DESC LIMIT 1`,
      );

      const newLoad = this.loadsRepo.create();
      newLoad.job = job;
      newLoad.loadNumber =
        lastLoadTracked.length > 0 ? lastLoadTracked[0].loadNumber + 1 : 1;
      newLoad.load = true;
      newLoad.loadArrival = new Date();
      newLoad.loadLeave = new Date();
      newLoad.dumpArrival = new Date();
      newLoad.dumpLeave = new Date();
      newLoad.dump = true;
      newLoad.truck = truck;
      newLoad.tons = 0;
      newLoad.ticket = '0';
      newLoad.assignation = assignation;
      await this.loadsRepo.save(newLoad);

      const loads = await this.loadsRepo.find({ job });

      this.eventEmitter.emit('updateLoad', {
        loads,
        jobId: job.id,
        userId: job.user.id,
      });

      return newLoad.loadNumber;
    } catch (error) {
      return -1;
    }
  }

  async getLoadCounts(
    job: Job,
    truck: Truck,
    assignation: JobAssignation,
  ): Promise<number> {
    const loadEntries = await this.loadsRepo.find({
      job,
      truck,
      assignation,
    });
    let loads = 0;
    loadEntries.forEach(loadEntry => {
      if (loadEntry.load && loadEntry.dump) loads += 1;
    });

    return loads;
  }

  async getLoadsByAssignation(assignationId: string): Promise<Loads[]> {
    const data = await this.loadsRepo.createQueryBuilder('loads')
      .innerJoin('loads.assignation', 'assignation')
      .where('assignation.id = :assignationId', { assignationId })
      .getMany();

    return data;
  }

}

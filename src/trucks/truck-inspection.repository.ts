import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { TruckInspection } from './truck-inspection.model';
import moment from 'moment';

type findInspectionData = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  reviewData: string;
  inspectionNumber: number;
  defects: number;
  owner: string;
  driver: string;
  truck: string;
  job: string;
  type: string;
};

@Injectable()
export class TruckInspectionRepo extends BaseRepository<TruckInspection> (
  TruckInspection
) {
  constructor(
    @InjectRepository(TruckInspection)
    private readonly truckInspectionRepo: Repository<TruckInspection>,
  ) {
    super(truckInspectionRepo);
  }

  async getOneInspectionBy(filter): Promise<any> {
    const inspection = await this.truckInspectionRepo.query(
    `
      SELECT
        *
      FROM
        truck_inspection
      WHERE
        "truckId" = $1
      AND
        "jobId" = $2 AND type = $3;
    `,
      [filter.truckId, filter.jobId, filter.type],
    );
    return inspection[0];
  }

  createInspection(inspection): Promise<TruckInspection> {
    return this.truckInspectionRepo.save(inspection);
  }

  public async getInspectionByNumber(id: number): Promise<findInspectionData> {
    const inspection = await this.getInspections(null, null, null, id);
    return inspection[0];
  }

  public async getInspectionsByOwnerId(
    ownerId: string,
  ): Promise<findInspectionData[]> {
    const inspections = this.getInspections(ownerId);
    return inspections;
  }

  public async findInspections(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<findInspectionData[]> {
    const inspections = this.getInspections(ownerId, start, end);
    return inspections;
  }

  public async findTruckInspections(
    truckId: string
  ): Promise<TruckInspection[]> {
    const query = this.truckInspectionRepo
      .createQueryBuilder('inspection')
      .where('inspection.truckId = :truckId', { truckId })
      .andWhere('inspection.createdAt BETWEEN :start AND :end', {
        start: moment().startOf('day'),
        end: moment().endOf('day'),
      });

    return query.getMany();
  }

  private async getInspections(
    ownerId?: string,
    start?: string,
    end?: string,
    id?: number,
  ): Promise<findInspectionData[]> {
    const startDate = start && new Date(start);
    const endDate = start && new Date(end);
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects,
        inspection."inspectionNumber", inspection.type, inspection.duration,
        inspection."locationLat", inspection."locationLong",
        STRING_AGG((owner.id || ',' || owner.name), ', ' ) as owner, 
        STRING_AGG((driver.id || ',' || driver.name), ', ') as driver, 
        STRING_AGG((truck.id || ',' || truck.number), ', ') as truck,
        STRING_AGG((job.id || ',' || job."orderNumber" || ',' || job.name), ', ') as job
      FROM
        truck_inspection inspection
        inner join public.user owner on owner.id = inspection."ownerId"
        inner join public.user driver on driver.id = inspection."driverId"
        inner join truck on truck.id = inspection."truckId"
        inner join job on job.id = inspection."jobId"
      WHERE
        (inspection."ownerId" = $1 OR inspection."inspectionNumber" = $2)
      AND
        (inspection."createdAt" BETWEEN $3 AND $4 OR ($3 IS NULL AND $4 IS NULL))
      GROUP BY
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects, inspection."inspectionNumber",
        inspection.type, inspection.duration, inspection."locationLat", inspection."locationLong";
    `,
      [ownerId, id, startDate, endDate],
    );
    return inspections;
  }

  async getLatestInspectionByDrivers(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<findInspectionData[]> {
    const startDate = start && new Date(start);
    const endDate = start && new Date(end);
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT DISTINCT ON (inspection."driverId")
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects,
        inspection."inspectionNumber", inspection.type, inspection.duration,
        inspection."locationLat", inspection."locationLong",
        STRING_AGG((owner.id || ',' || owner.name), ', ' ) as owner, 
        STRING_AGG((driver.id || ',' || driver.name), ', ') as driver, 
        STRING_AGG((truck.id || ',' || truck.number), ', ') as truck,
        STRING_AGG((job.id || ',' || job."orderNumber" || ',' || job.name), ', ') as job
      FROM
        truck_inspection inspection
        inner join public.user owner on owner.id = inspection."ownerId"
        inner join public.user driver on driver.id = inspection."driverId"
        inner join truck on truck.id = inspection."truckId"
        inner join job on job.id = inspection."jobId"
      WHERE
        (inspection."ownerId" = $1)
      AND
        (inspection."createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects, inspection."inspectionNumber",
        inspection.type, inspection.duration, inspection."locationLat", inspection."locationLong";
    `,
      [ownerId, startDate, endDate],
    );
    return inspections;
  }

  async getLatestInspectionByTrucks(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<findInspectionData[]> {
    const startDate = start && new Date(start);
    const endDate = start && new Date(end);
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT DISTINCT ON (inspection."truckId")
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects,
        inspection."inspectionNumber", inspection.type, inspection.duration,
        inspection."locationLat", inspection."locationLong",
        STRING_AGG((owner.id || ',' || owner.name), ', ' ) as owner, 
        STRING_AGG((driver.id || ',' || driver.name), ', ') as driver, 
        STRING_AGG((truck.id || ',' || truck.number), ', ') as truck,
        STRING_AGG((job.id || ',' || job."orderNumber" || ',' || job.name), ', ') as job
      FROM
        truck_inspection inspection
        inner join public.user owner on owner.id = inspection."ownerId"
        inner join public.user driver on driver.id = inspection."driverId"
        inner join truck on truck.id = inspection."truckId"
        inner join job on job.id = inspection."jobId"
      WHERE
        (inspection."ownerId" = $1)
      AND
        (inspection."createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        inspection.id, inspection."createdAt", inspection."updatedAt",
        inspection."inspectionNumber", inspection.defects, inspection."inspectionNumber",
        inspection.type, inspection.duration, inspection."locationLat", inspection."locationLong";
    `,
      [ownerId, startDate, endDate],
    );
    return inspections;
  }

  async getLatestThreeInspectedDrivers(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT DISTINCT ON ("driverId")
        "driverId", "createdAt"
      FROM
        truck_inspection
      WHERE
        "ownerId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3)
      GROUP BY
        "driverId", "createdAt"
      LIMIT 3;
    `,
      [ownerId, start, end],
    );
    return inspections;
  }

  async getLatestThreeInspectedTrucks(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT DISTINCT ON ("truckId")
        "truckId", "createdAt"
      FROM
        truck_inspection
      WHERE
        "ownerId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3)
      GROUP BY
        "truckId", "createdAt"
      LIMIT 3;
    `,
      [ownerId, start, end],
    );
    return inspections;
  }

  async getInspectionsByDriverId(
    driverId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT
        *
      FROM
        truck_inspection
      WHERE
        "driverId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      ORDER BY
        "createdAt" DESC;
    `,
      [driverId, start, end],
    );
    return inspections;
  }

  async getInspectionsByTruckId(
    truckId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const inspections = await this.truckInspectionRepo.query(
    `
      SELECT
        *
      FROM
        truck_inspection
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      ORDER BY
        "createdAt" DESC;
    `,
      [truckId, start, end],
    );
    return inspections;
  }

  async getTotalInspectedTrucksByOwner(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const totalInspectedTrucks = await this.truckInspectionRepo.query(
      `
      SELECT DISTINCT ON ("truckId")
        "truckId", "createdAt", COUNT(*)
      FROM
        truck_inspection
      WHERE
        "ownerId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "truckId", "createdAt"
      `,
        [ownerId, start, end],
      );
      return totalInspectedTrucks;
  }

  async getTotalInspectionsByDriverId(
    driverId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const totalInspections = await this.truckInspectionRepo.query(
    `
      SELECT
        COUNT(*)
      FROM
        truck_inspection
      WHERE
        "driverId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL));
    `,
      [driverId, start, end],
    );
    return totalInspections;
  }

  async getTotalInspectionsByTruckId(
    truckId: string,
    start: string,
    end: string,
  ): Promise<any> {
    const totalInspections = await this.truckInspectionRepo.query(
    `
      SELECT
        COUNT(*)
      FROM
        truck_inspection
      WHERE
        "truckId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3);
    `,
      [truckId, start, end],
    );
    return totalInspections;
  }

  async getTotalWorkedTrucksByOwnerId(
    ownerId: string,
    start?: string,
    end?: string,
  ): Promise<any> {
    const totalWorkedTrucks = await this.truckInspectionRepo.query(
    `
      SELECT DISTINCT ON ("truckId")
        "truckId", "createdAt", COUNT(*)
      FROM
        truck_inspection
      WHERE
        "ownerId" = $1
      AND
        ("createdAt" BETWEEN $2 AND $3 OR ($2 IS NULL AND $3 IS NULL))
      GROUP BY
        "truckId", "createdAt";
    `,
      [ownerId, start, end],
    );
    return totalWorkedTrucks;
  }
}

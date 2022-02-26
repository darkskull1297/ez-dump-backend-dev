import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Geolocation } from './geolocation.model';
import { GeolocationType } from './geolocation-type';

@Injectable()
export class GeolocationRepo extends BaseRepository<Geolocation>(Geolocation) {
  constructor(
    @InjectRepository(Geolocation)
    private readonly geolocationRepo: Repository<Geolocation>,
  ) {
    super(geolocationRepo);
  }

  async findGeolocationsByJobIdAndTrucksIDs(
    jobID: string,
    truckIDs: string[],
  ): Promise<Geolocation[]> {
    const data = await this.geolocationRepo.query(
      `SELECT id, type, "jobId", "truckId", "date" FROM geolocation WHERE "jobId" = $1 AND "truckId" = ANY($2) ORDER BY date ASC`,
      [jobID, truckIDs],
    );
    return data;
  }

  findGeolocationsByJobIdAndDriverId(
    jobId: string,
    driverId: string,
  ): Promise<Geolocation[]> {
    return this.findGeolocationsQuery()
      .where('driver.id = :driverId', { driverId })
      .andWhere('job.id = :jobId', { jobId })
      .orderBy('geolocation.date', 'ASC')
      .getMany();
  }

  findGeolocationsByJobByTruckByDriver(
    jobId: string,
    truckId: string,
    driverId: string,
  ): Promise<Geolocation[]> {
    const types = [GeolocationType.LOAD_SITE, GeolocationType.DUMP_SITE];
    return this.findGeolocationsQuery()
      .where('driver.id = :driverId', { driverId })
      .andWhere('geolocation.type in (:...types)', {
        types,
      })
      .andWhere('job.id = :jobId', { jobId })
      .andWhere('truck.id = :truckId', { truckId })
      .orderBy('geolocation.date', 'ASC')
      .getMany();
  }

  findLastGeolocationByJobByTruckByDriver(
    jobId: string,
    truckId: string,
    driverId: string,
  ): Promise<Geolocation> {
    return this.findGeolocationsQuery()
      .where('driver.id = :driverId', { driverId })
      .andWhere('job.id = :jobId', { jobId })
      .andWhere('truck.id = :truckId', { truckId })
      .orderBy('geolocation.date', 'DESC')
      .getOne();
  }

  findGeolocationsByJobIdAndTruckId(
    jobId: string,
    truckId: string,
  ): Promise<Geolocation[]> {
    return this.findGeolocationsQuery()
      .where('truck.id = :truckId', { truckId })
      .andWhere('job.id = :jobId', { jobId })
      .orderBy('geolocation.date', 'ASC')
      .getMany();
  }

  private findGeolocationsQuery(): SelectQueryBuilder<Geolocation> {
    return this.geolocationRepo
      .createQueryBuilder('geolocation')
      .leftJoinAndSelect('geolocation.driver', 'driver')
      .leftJoinAndSelect('geolocation.truck', 'truck')
      .leftJoinAndSelect('geolocation.job', 'job');
  }

  findLastStationaryLocation(
    jobID: string,
    truckID: string,
    userID: string,
  ): Promise<Geolocation> {
    return this.findGeolocationsQuery()
      .where('truck.id = :truckID', { truckID })
      .andWhere('driver.id = :userID', { userID })
      .andWhere('job.id = :jobID', { jobID })
      .andWhere('geolocation.type = :type', {
        type: GeolocationType.STATIONARY,
      })
      .orderBy('geolocation.createdAt', 'DESC')
      .getOne();
  }
}

/* eslint-disable consistent-return */
import { Injectable } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import * as geolib from 'geolib';

import moment from 'moment';
import { GeolocationEventEmitter } from './geolocation.events';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { NoActiveJobException } from '../timer/exceptions/no-active-job.exception';
import { NotClockedInException } from '../timer/exceptions/not-clocked-in.exception';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { User } from '../user/user.model';
import { TruckLocationInfo } from './gateway/truck-location-info.interface';
import { Geolocation } from './geolocation.model';
import { GeolocationRepo } from './geolocation.repository';
import { LocationService } from '../location/location.service';
import { GeolocationType } from './geolocation-type';
import { JobStatus } from '../jobs/job-status';
import { GeolocationJobDTO } from './dto/geolocation-job.dto';
import { Owner } from '../user/owner.model';
import { ContractorScheduledJobsQueryDTO } from '../jobs/dto/contractor-scheduled-jobs-query.dto';
import { Location } from '../location/location.model';
import { LoadsRepo } from './loads.repository';
import { Loads } from './loads.model';
import { Geofence } from './geofence-type';
import { Driver } from '../user/driver.model';
import { JobAssignation } from '../jobs/job-assignation.model';

@Injectable()
export class GeolocationService {
  constructor(
    private readonly geolocationRepo: GeolocationRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly locationService: LocationService,
    private readonly timeEntryRepo: TimeEntryRepo,
    private readonly loadsRepo: LoadsRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: GeolocationEventEmitter,
  ) {}

  private readonly METER_TO_MILE = 0.00062;
  private readonly RANGE_DEFAULT = 100;
  private readonly RANGE_REGION_DEFAULT = 1000;

  async getGeolocationsByJobIDAndTruckID(
    jobID: string,
    trucksID: string[],
  ): Promise<any[]> {
    return this.geolocationRepo.findGeolocationsByJobIdAndTrucksIDs(
      jobID,
      trucksID,
    );
  }

  async create(
    geolocation: Omit<
    Geolocation,
    'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
    >,
    user: User,
  ): Promise<number> {
    if (!geolocation.registerBy) return;

    const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
      user,
    );
    if (!activeScheduledJob) throw new NoActiveJobException();
    const activeTimeEntry = await this.timeEntryRepo.findActive(user);
    if (!activeTimeEntry) throw new NotClockedInException();
    const jobAssignation = activeScheduledJob.assignations.find(
      assignation => assignation.driver.id === user.id,
    );
    const {
      job: { loadSite, dumpSite },
    } = activeScheduledJob;

    const speed = geolocation.speed ? Number(geolocation.speed.toFixed(2)) : 0;
    const geolocationType = this.geolocationTypeByLocation(
      geolocation,
      loadSite,
      dumpSite,
    );

    const lastGeolocation = await this.geolocationRepo.findLastGeolocationByJobByTruckByDriver(
      activeScheduledJob.job.id,
      jobAssignation.truck.id,
      user.id,
    );

    if (
      geolocationType &&
      !this.checkIsSameLocation(lastGeolocation, geolocation, 30)
    ) {
      this.eventEmitter.emit(
        'truckLocationUpdated',
        this.getTruckLocationInfo(activeScheduledJob, user, geolocation),
      );

      await this.geolocationRepo.create({
        ...geolocation,
        driver: user,
        job: activeScheduledJob.job,
        truck: jobAssignation.truck,
        type: geolocationType,
        speed,
      });
    }

    return this.loadsRepo.getLoadCounts(
      activeScheduledJob.job,
      jobAssignation.truck,
      jobAssignation,
    );
  }

  async createFromGeofence(geofence: Geofence, user: User): Promise<number> {
    const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
      user,
    );
    if (!activeScheduledJob) throw new NoActiveJobException();
    const activeTimeEntry = await this.timeEntryRepo.findActive(user);
    if (!activeTimeEntry) throw new NotClockedInException();

    const assignation = activeScheduledJob.assignations.find(
      assign => assign.driver.id === user.id,
    );

    const loadNumber = await this.loadsRepo.insertOrUpdateLoad(
      geofence.identifier,
      activeScheduledJob.job,
      assignation.truck,
      geofence.location.timestamp,
      geofence.action,
      activeScheduledJob.job.user.id,
      assignation,
    );
    await this.geolocationRepo.create({
      date: new Date(geofence.location.timestamp),
      driver: user,
      job: activeScheduledJob.job,
      lat: geofence.location.coords.latitude.toString(),
      long: geofence.location.coords.longitude.toString(),
      truck: assignation.truck,
      type: geofence.identifier,
      speed: geofence.location.coords.speed,
    });

    return loadNumber;
  }

  async getLoadTracks(jobID: string, truckIDs: string[], driverInvoiceIDs: string[]): Promise<Loads[]> {
    return this.loadsRepo.getLoads(jobID, truckIDs, driverInvoiceIDs);
  }

  checkIsSameLocation(
    lastGeolocation: Omit<
    Geolocation,
    'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
    >,
    geolocation: Omit<
    Geolocation,
    'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
    >,
    distanceRange = this.RANGE_DEFAULT,
  ): boolean {
    const isSamePlace = this.locationService.isInsideRadius(
      {
        lat: parseFloat(geolocation?.lat),
        long: parseFloat(geolocation?.long),
      },
      {
        lat: parseFloat(lastGeolocation?.lat),
        long: parseFloat(lastGeolocation?.long),
      },
      distanceRange * this.METER_TO_MILE,
    );
    return isSamePlace;
  }

  geolocationTypeByLocation(
    geolocation: Omit<
    Geolocation,
    'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
    >,
    loadSite: Location,
    dumpSite: Location,
  ): GeolocationType {
    const distance = geolib.getPreciseDistance(
      { longitude: loadSite.long, latitude: loadSite.lat },
      { longitude: dumpSite.long, latitude: dumpSite.lat },
    );

    const resultingRadius = Math.round(distance / 2 - distance / 8);
    let radius = 0;

    if (resultingRadius < 900) {
      radius = 900;
    } else if (resultingRadius > 2000) {
      radius = 2000;
    } else {
      radius = resultingRadius;
    }

    let geolocationType = GeolocationType.IN_ROAD;
    const isInsideLoadSite = geolib.isPointWithinRadius(
      { latitude: geolocation.lat, longitude: geolocation.long },
      { latitude: loadSite.lat, longitude: loadSite.long },
      radius,
    );
    if (isInsideLoadSite) geolocationType = GeolocationType.LOAD_SITE;
    const isInsideDumpSite = geolib.isPointWithinRadius(
      { latitude: geolocation.lat, longitude: geolocation.long },
      { latitude: dumpSite.lat, longitude: dumpSite.long },
      radius,
    );
    if (isInsideDumpSite) geolocationType = GeolocationType.DUMP_SITE;
    return geolocationType;
  }

  getGeolocationsForJobByDriverId(
    jobId: string,
    driverId: string,
  ): Promise<Geolocation[]> {
    return this.geolocationRepo.findGeolocationsByJobIdAndDriverId(
      jobId,
      driverId,
    );
  }

  async getGeolocationsForJobByTruckId(
    jobId: string,
    truckId: string,
  ): Promise<Geolocation[]> {
    const scheduledJob = await this.scheduledJobRepo.findScheduleJob(jobId);
    return this.geolocationRepo.findGeolocationsByJobIdAndTruckId(
      scheduledJob.job.id,
      truckId,
    );
  }

  async getGeolocationsForOwnerJobByTruckId(
    jobId: string,
    truckId: string,
  ): Promise<Geolocation[]> {
    return this.geolocationRepo.findGeolocationsByJobIdAndTruckId(
      jobId,
      truckId,
    );
  }

  async getLastGeolocationFromScheduleJobs(
    scheduledJobs: ScheduledJob[],
  ): Promise<GeolocationJobDTO[]> {
    return Promise.all(
      scheduledJobs?.map(async scheduleJob => {
        const { job, assignations } = scheduleJob;
        const assignationsByJob = await Promise.all(
          assignations?.map(async assignation => {
            const geolocationDriver = await this.geolocationRepo.findLastGeolocationByJobByTruckByDriver(
              job?.id,
              assignation?.truck?.id,
              assignation?.driver?.id,
            );
            if (geolocationDriver) {
              return {
                ...geolocationDriver,
                startedAt: assignation.startedAt,
              };
            }
            return undefined;
          }),
        );
        return {
          job,
          geolocations: assignationsByJob?.filter(Boolean),
        };
      }),
    );
  }

  async getAdminGeolocationScheduledJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<GeolocationJobDTO[]> {
    const scheduledJobs = await this.scheduledJobRepo.findStartedJobs({
      skip,
      count,
    });
    return this.getLastGeolocationFromScheduleJobs(scheduledJobs);
  }

  async geoGeolocationScheduledJobsForOwner(
    owner: Owner,
    { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<GeolocationJobDTO[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    const scheduledJobs = await this.scheduledJobRepo.findScheduledJobsActiveForOwner(
      owner,
      status,
      {
        skip,
        count,
      },
    );
    return this.getLastGeolocationFromScheduleJobs(scheduledJobs);
  }

  async getGeolocationScheduledJobsForContractor(
    user: User,
    { skip, count, active }: ContractorScheduledJobsQueryDTO,
  ): Promise<GeolocationJobDTO[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    const scheduledJobs = await this.scheduledJobRepo.findContractorJobs(
      user,
      status,
      {
        skip,
        count,
      },
    );
    return this.getLastGeolocationFromScheduleJobs(scheduledJobs);
  }

  async getTotalTravels(user: User, jobId?: string): Promise<number> {
    let activeScheduledJob: ScheduledJob = null;

    if (jobId) {
      activeScheduledJob = await this.scheduledJobRepo.findScheduledJobByDriver(
        user,
        jobId,
      );
    } else {
      activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );
    }

    if (!activeScheduledJob) throw new NoActiveJobException();
    const assignation = activeScheduledJob.assignations.find(
      assign => assign.driver.id === user.id,
    );

    return this.loadsRepo.getLoadCounts(
      activeScheduledJob.job,
      assignation.truck,
      assignation,
    );
  }

  async getTotalTravelsByLocations(
    geolocations: Omit<
    Geolocation,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'job'
    | 'driver'
    | 'truck'
    | 'type'
    | 'registerBy'
    >[],
    user: User,
  ): Promise<number> {
    const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
      user,
    );
    if (!activeScheduledJob) throw new NoActiveJobException();
    const {
      job: { loadSite, dumpSite },
    } = activeScheduledJob;
    const geolocationsFiltered = geolocations.reduce<any[]>(
      (acc: any[], geolocation: any) => {
        const [lastGeolocation] = acc;
        const type = this.geolocationTypeByLocation(
          geolocation,
          loadSite,
          dumpSite,
        );
        if (!lastGeolocation) {
          acc.push({
            ...geolocation,
            type,
          });
          return acc;
        }
        if (lastGeolocation.type === type) {
          return acc;
        }
        acc.push({
          ...geolocation,
          type,
        });
        return acc;
      },
      [],
    );

    const geolocationsWithType = geolocationsFiltered.map(geolocation => ({
      ...geolocation,
      type: this.geolocationTypeByLocation(geolocation, loadSite, dumpSite),
    }));

    return geolocationsWithType.reduce((acc, geo) => {
      return acc + Number(geo.type === GeolocationType.DUMP_SITE);
    }, 0);
  }

  getTruckLocationInfo(
    scheduledJob: ScheduledJob,
    user: User,
    {
      lat,
      long,
      date,
      speed,
    }: Omit<
    Geolocation,
    'id' | 'createdAt' | 'updatedAt' | 'job' | 'driver' | 'truck'
    >,
  ): TruckLocationInfo {
    const { job, assignations } = scheduledJob;
    const { truck, startedAt } = assignations.find(
      assig => assig.driver.id === user.id,
    );

    return {
      lat,
      long,
      date,
      jobId: job.id,
      jobName: job.name,
      userName: user.name,
      driverId: user.id,
      truckId: truck.id,
      truckName: truck.number,
      startedAt,
      speed,
    };
  }

  async getLoadsForDriver(
    jobID: string,
    truckID: string,
    driver: Driver,
  ): Promise<Loads[]> {
    const scheduledJobs = await this.scheduledJobRepo.findScheduledJobByJobID(
      jobID,
    );
    let jobAssignation: JobAssignation;

    scheduledJobs.find(schJob => {
      return schJob.assignations.find(assignation => {
        if (
          assignation.driver.id === driver.id &&
          assignation.truck.id === truckID
        ) {
          jobAssignation = assignation;
          return true;
        }
        return false;
      });
    });

    return this.loadsRepo.getLoadsForDriver(jobID, truckID, jobAssignation?.id);
  }

  async checkCompletedLoads(jobID: string, truckID: string): Promise<boolean> {
    return this.loadsRepo.checkCompletedLoads(jobID, truckID);
  }

  async updateLoads(loads: Loads[]): Promise<boolean> {
    return this.loadsRepo.updateLoads(loads);
  }

  async countLoad(driver: Driver): Promise<number> {
    const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
      driver,
    );
    const assignation = activeScheduledJob.assignations.find(
      assign => assign.driver.id === driver.id,
    );

    return this.loadsRepo.countManualLoads(
      activeScheduledJob.job,
      assignation.truck,
      assignation,
    );
  }

  async onMotionChange(event: any, user: User): Promise<boolean> {
    try {
      const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );
      const [jobAssignation] = activeScheduledJob.assignations;

      const lastLocation = await this.geolocationRepo.findLastStationaryLocation(
        activeScheduledJob.job.id,
        jobAssignation.truck.id,
        user.id,
      );

      if (
        !event.isMoving ||
        !event.location?.is_moving ||
        event.location.coords.speed < 1
      ) {
        if (!lastLocation || lastLocation?.stationaryMinutes) {
          const speed = event.location.coords.speed
            ? Number(event.location.coords.speed.toFixed(2))
            : 0;

          await this.geolocationRepo.create({
            date: new Date(),
            lat: event.location.coords.latitude,
            long: event.location.coords.longitude,
            driver: user,
            job: activeScheduledJob.job,
            truck: jobAssignation.truck,
            registerBy: 'BACKGROUND',
            type: GeolocationType.STATIONARY,
            speed,
          });
        }
      } else {
        const startDate = lastLocation.date;
        const endDate = new Date();

        const stationaryMinutes = moment(endDate).diff(
          startDate,
          'minutes',
          true,
        );

        lastLocation.stationaryMinutes = stationaryMinutes;
        await this.geolocationRepo.save(lastLocation);
      }

      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}

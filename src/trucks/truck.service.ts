import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import { TruckRepo, TruckCreateType } from './truck.repository';
import { Truck } from './truck.model';
import { Owner } from '../user/owner.model';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { TruckStatus } from './truck-status';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { TimeEntry } from '../timer/time-entry.model';
import { UserRepo } from '../user/user.repository';
import { User } from '../user/user.model';
import { Driver } from '../user/driver.model';
import { TruckInspection } from './truck-inspection.model';
import { TruckInspectionRepo } from './truck-inspection.repository';
import { ContractorRepo } from '../user/contractor.repository';
import { DispatcherRepo } from '../user/dispatcher.repository';
import { DriverRepo } from '../user/driver.repository';
import { S3Service } from '../s3/s3.service';
import { TruckInspectionDTO } from './dto/truck-inspection.dto';
import { JobRepo } from '../jobs/job.repository';
import { TruckInspectionType } from './truck-inspection-type';
import { Assets } from './assets.model';
import { DefectsDTO } from './dto/defects.dto';
import { Inspection } from './inspection-type';
import { AssetsRepo } from './assets.repository';
import { DefectDTO } from './dto/defect.dto';
import { TaskOrderRepo } from './task-order.repository';
import { WorkOrderRepo } from './work-order.repository';
import { WorkOrderItemsRepo } from './work-order-items.repository';
import { TaskOrder } from './task-order.model';
import { TaskOrderType } from './task-order-type';
import { WorkOrderType } from './work-order-type';
import { WorkOrderItemsType } from './work-order-items-type';
import { MaintenanceDTO } from './dto/maintenance.dto';
import { ExpensesDTO } from './dto/expenses.dto';
import { DriversBoardDTO } from './dto/drivers-board.dto';
import { DriverBoardDTO } from './dto/driver-board.dto';
import { TrucksBoardDTO } from './dto/trucks-board.dto';
import { TruckBoardDTO } from './dto/truck-board.dto';
import { TruckPunchDTO } from './dto/truck-punch.dto';
import { TruckPunchType } from './punch-type';
import { TruckPunch } from './truck-punch.model';
import { TruckPunchRepo } from './truck-punch.repository';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { NotificationEventEmitter } from '../notification/notification.events';

import { TruckJobAssigException } from './exceptions/truck-job-assig.exception';

@Injectable()
export class TruckService {
  constructor(
    private readonly truckRepo: TruckRepo,
    private readonly taskOrderRepo: TaskOrderRepo,
    private readonly workOrderRepo: WorkOrderRepo,
    private readonly workOrderItemsRepo: WorkOrderItemsRepo,
    private readonly companyRepo: OwnerCompanyRepo,
    private readonly timeEntryRepo: TimeEntryRepo,
    private readonly userRepo: UserRepo,
    private readonly inspectionRepo: TruckInspectionRepo,
    private readonly contractorRepo: ContractorRepo,
    private readonly dispatcherRepo: DispatcherRepo,
    private readonly driverRepo: DriverRepo,
    private readonly s3Service: S3Service,
    private readonly jobRepo: JobRepo,
    private readonly truckPunchRepo: TruckPunchRepo,
    private readonly assetsRepo: AssetsRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    @InjectEventEmitter()
    private readonly eventEmitterNotification: NotificationEventEmitter,
  ) {}

  objectLength(obj) {
    let result = 0;
    for (const prop in obj) {
      // eslint-disable-next-line
      if (obj.hasOwnProperty(prop)) {
        // eslint-disable-next-line
        result++;
      }
    }
    return result;
  }

  async create(truck: TruckCreateType, ownerId: string): Promise<Truck> {
    const company = await this.companyRepo.findOwnerCompany(ownerId);
    if (company) {
      truck.company = company;
    }
    return this.truckRepo.create(truck);
  }

  async updateTruck(
    id: string,
    update: Partial<TruckCreateType>,
  ): Promise<Truck> {
    const existingTruck = await this.truckRepo.findById(id);
    const keys = Object.keys(update);
    keys.forEach(x => {
      existingTruck[x] = update[x];
    });
    return this.truckRepo.updateTruck(id, existingTruck, update);
  }

  async disableTruck(id: string): Promise<Truck> {
    const foundTruck = await this.truckRepo.findById(id);
    const activeJob = await this.scheduledJobRepo.findActiveOrScheduledJobByTruck(
      foundTruck,
    );
    if (activeJob) {
      throw new TruckJobAssigException();
    }

    foundTruck.isDisable = true;
    foundTruck.isActive = false;
    return this.truckRepo.save(foundTruck);
  }

  async getAll(): Promise<Truck[]> {
    const trucks = await this.truckRepo.find({ isDisable: false });
    const activeTrucks = await this.truckRepo.getAllActiveTrucks();
    const activeTimeEntries = await this.timeEntryRepo.findAllActive();

    trucks.forEach(truck => {
      truck.status = this.getTruckStatus(
        truck,
        activeTrucks,
        activeTimeEntries,
      );
    });
    return trucks;
  }

  get(id: string): Promise<Truck> {
    return this.truckRepo.findOne({ id });
  }

  async getAllTrucks(contractorId: string): Promise<Truck[]> {
    const contractor = await this.contractorRepo.findById(contractorId);
    const trucks = await this.truckRepo.find({ isActive: true });
    const favoriteTrucks = await Promise.all(
      contractor.favoriteTrucks.map(truck => truck.id),
    );
    return trucks.filter(truck => !favoriteTrucks.includes(truck.id));
  }

  async getFavoriteTrucks(contractorId: string): Promise<Truck[]> {
    const contractor = await this.contractorRepo.findById(contractorId);
    return contractor.favoriteTrucks;
  }

  async getFavoriteTrucksForJob(contractorId: string): Promise<Truck[]> {
    const contractor = await this.contractorRepo.findById(contractorId);
    const availableTrucks = await this.truckRepo.getAllAvailableTrucksForJobs();

    const favoriteTrucks = contractor.favoriteTrucks.filter(truck => {
      const favoriteTruck = availableTrucks.find(available => {
        return available.id === truck.id;
      });
      return favoriteTruck;
    });

    return favoriteTrucks;
  }

  async addFavoriteTruck(
    truckId: string,
    contractorId: string,
  ): Promise<Truck[]> {
    const contractor = await this.contractorRepo.findById(contractorId);
    const truck = await this.truckRepo.findById(truckId);

    const favoriteTrucks = [...contractor.favoriteTrucks];

    favoriteTrucks.push(truck);

    contractor.favoriteTrucks = [...favoriteTrucks];

    await this.contractorRepo.save(contractor);

    return favoriteTrucks;
  }

  async removeFavoriteTruck(
    truckId: string,
    contractorId: string,
  ): Promise<Truck[]> {
    const contractor = await this.contractorRepo.findById(contractorId);

    const favoriteTrucks = [
      ...contractor.favoriteTrucks.filter(truck => truck.id !== truckId),
    ];

    contractor.favoriteTrucks = [...favoriteTrucks];

    await this.contractorRepo.save(contractor);

    return favoriteTrucks;
  }

  async getOwnerTrucks(user: Owner): Promise<Truck[]> {
    const company = await this.companyRepo.findOwnerCompany(user.id);
    const trucks = await this.truckRepo.find({ company, isDisable: false });
    const activeTrucks = await this.truckRepo.getActiveTrucks(user);
    const activeTimeEntries = await this.timeEntryRepo.findOwnerActive(user);
    trucks.forEach(truck => {
      truck.status = this.getTruckStatus(
        truck,
        activeTrucks,
        activeTimeEntries,
      );
    });
    return trucks;
  }

  private getTruckStatus(
    truck: Truck,
    activeTrucks: Truck[],
    activeTimeEntries: TimeEntry[],
  ): TruckStatus {
    if (!truck.isActive) return TruckStatus.INACTIVE;
    if (this.hasTruckActiveTimeEntry(truck, activeTimeEntries))
      return TruckStatus.ACTIVE;
    if (this.isTruckActive(truck, activeTrucks)) return TruckStatus.BREAK;
    return TruckStatus.NOT_CLOCKED_IN;
  }

  private hasTruckActiveTimeEntry(
    truck: Truck,
    activeTimeEntries: TimeEntry[],
  ): boolean {
    return !!activeTimeEntries.find(active => active.truck.id === truck.id);
  }

  private isTruckActive(truck: Truck, activeTrucks: Truck[]): boolean {
    return !!activeTrucks.find(active => active.id === truck.id);
  }

  async remove(id: string): Promise<boolean> {
    const truck = await this.truckRepo.remove(id);
    return !!truck;
  }

  async countAllOwnerActiveTrucks(user: Owner): Promise<number> {
    return this.truckRepo.countOwnerTrucks(user, true);
  }

  async countAllOwnerNotActiveTrucks(user: Owner): Promise<number> {
    return this.truckRepo.countOwnerTrucks(user, false);
  }

  async getOwnerActiveTrucks(user: Owner): Promise<Truck[]> {
    return this.truckRepo.getAllOwnerActiveTrucks(user);
  }

  async getTrucksByOwnerForDriver(
    user: User,
    data: { start: string; end: string },
  ): Promise<any> {
    const driver = (await this.userRepo.findDriverById(user.id)) as Driver;
    const scheduledJobs = await this.scheduledJobRepo.findAllDriverScheduledJobs(
      user,
      data,
    );

    const trucks = {};

    scheduledJobs.forEach(job => {
      job.assignations.forEach(assignation => {
        if (
          !trucks[`${assignation.truck.id}`] &&
          assignation.driver.id === driver.id
        ) {
          trucks[`${assignation.truck.id}`] = assignation.truck;
          trucks[`${assignation.truck.id}`].jobId = job.job.id;
        }
      });
    });

    const trucksArray = Object.values(trucks);
    const trucksWithInspection = await Promise.all(
      trucksArray.map(async (truck: any) => {
        const inspections = await this.inspectionRepo.findTruckInspections(
          truck.id,
        );

        const preTrip =
          inspections.find(
            inspection =>
              inspection.type === TruckInspectionType.PRE_TRIP_INSPECTION,
          ) || null;
        const postTrip =
          inspections.find(
            inspection =>
              inspection.type === TruckInspectionType.POST_TRIP_INSPECTION,
          ) || null;

        return {
          ...truck,
          preTrip,
          postTrip,
        };
      }),
    );

    const response = trucksWithInspection.filter(
      val => val.postTrip === null || val.preTrip === null,
    );
    return response;
  }

  async getLastPunch(user: Driver): Promise<TruckPunch> {
    const truckPunch = this.truckPunchRepo.findLastDriverPunch(user.id);
    return truckPunch;
  }

  async generateTruckPunch(
    user: Driver,
    data: TruckPunchDTO,
    truckPunchId?: string,
  ): Promise<TruckPunch> {
    if (data.type === TruckPunchType.PUNCH_IN) {
      const truckPunch = new TruckPunch();
      truckPunch.punchInAddress = data.punchInAddress;
      truckPunch.punchIn = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      truckPunch.driverId = data.driverId;
      await this.truckPunchRepo.save(truckPunch);
      return truckPunch;
    }

    const truckPunch = await this.truckPunchRepo.findById(truckPunchId);
    truckPunch.punchOut = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    truckPunch.punchOutAddress = data.punchOutAddress;
    await this.truckPunchRepo.update(truckPunchId, { ...truckPunch });

    return truckPunch;
  }

  async verifyTruckInspectionForTruck(
    jobId: string,
    truckId: string,
  ): Promise<{
      preTripInspection: TruckInspection;
      postTripInspection: TruckInspection;
    }> {
    const preTrip = await this.inspectionRepo.getOneInspectionBy({
      jobId,
      truckId,
      type: TruckInspectionType.PRE_TRIP_INSPECTION,
    });
    const postTrip = await this.inspectionRepo.getOneInspectionBy({
      jobId,
      truckId,
      type: TruckInspectionType.POST_TRIP_INSPECTION,
    });

    const ownerId = preTrip?.ownerId || postTrip?.ownerId;
    const driverId = preTrip?.driverId || postTrip?.driverId;

    const job =
      preTrip || (postTrip && (await this.jobRepo.findOne({ id: jobId })));
    const truck =
      preTrip || (postTrip && (await this.truckRepo.findOne({ id: truckId })));
    const owner =
      preTrip ||
      (postTrip && ((await this.userRepo.findOne({ id: ownerId })) as Owner));
    const driver =
      preTrip ||
      (postTrip && ((await this.userRepo.findOne({ id: driverId })) as Driver));

    const preTripInspection = preTrip && {
      job,
      truck,
      defects: preTrip.defects,
      duration: preTrip.duration,
      createdAt: preTrip.createdAt,
      id: preTrip.id,
      inspectionNumber: preTrip.inspectionNumber,
      type: preTrip.type,
      updatedAt: preTrip.updatedAt,
      owner,
      driver,
      locationLat: preTrip.locationLat,
      locationLong: preTrip.locationLong,
    };

    const postTripInspection = postTrip && {
      job,
      truck,
      defects: postTrip.defects,
      duration: postTrip.duration,
      createdAt: postTrip.createdAt,
      id: postTrip.id,
      inspectionNumber: postTrip.inspectionNumber,
      type: postTrip.type,
      updatedAt: postTrip.updatedAt,
      owner,
      driver,
      locationLat: postTrip.locationLat,
      locationLong: postTrip.locationLong,
    };

    return {
      preTripInspection: preTripInspection || null,
      postTripInspection: postTripInspection || null,
    };
  }

  async createTruckInspection(
    inspection: Inspection,
    user: User,
    truckId: string,
  ): Promise<string> {
    let gallonsAssetId;
    const driver = (await this.userRepo.findDriverById(user.id)) as Driver;
    const owner = await driver.drivingFor.owner;
    const truck = await this.truckRepo.findById(truckId);
    const job = await this.jobRepo.findById(inspection.jobId);
    const newInspection = {
      driver,
      owner,
      truck,
      defects: inspection.defects,
      type: inspection.type,
      duration: `${inspection.duration} minutes`,
      job,
      locationLat: inspection.location.coords.latitude,
      locationLong: inspection.location.coords.longitude,
    };
    const reviewData = JSON.parse(inspection.reviewData);

    const newTruckMiles = reviewData[0].value;
    const currentTruckMiles = truck.miles;
    truck.miles = newTruckMiles;

    await this.truckRepo.save(truck);

    if (newInspection.type === TruckInspectionType.POST_TRIP_INSPECTION) {
      // see if the driver has more jobs for today
      const driverScheduledJobs = await this.scheduledJobRepo.findAllScheduledDriverScheduledJobs(
        driver,
        {
          start: moment(new Date()).format('MM-DD-YYYY HH:mm'),
          end: moment(new Date()).format('MM-DD-YYYY HH:mm'),
        },
      );

      // see if the driver has more active for today
      const activeJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );

      if (driverScheduledJobs.length <= 0 && !activeJob) {
        // auto punch out
        const data = {
          punchOutAddress: {
            address: '',
            lat: inspection.location.coords.latitude,
            long: inspection.location.coords.longitude,
          },
          type: TruckPunchType.PUNCH_OUT,
          driverId: driver.id,
          truckId: truck.id,
          punchInAddress: null,
        };

        await this.generateTruckPunch(driver, data, inspection.punchId);

        this.eventEmitterNotification.emit('autoPunchOut', driver.id);
      }
    }

    const createdInspection = await this.inspectionRepo.createInspection(
      newInspection,
    );
    await Promise.all(
      reviewData.map(async (data: any, index: number) => {
        const assets = [];
        if (index === 0) {
          const firstAsset = {
            value: data.value,
            assetId: data.id,
            status: data.passed ? 'Passed' : 'Defect',
            title: data.title,
            truckInspection: createdInspection,
            cardTitle: data.card_title || 'Mileage',
            cardId: data.card_id || 0,
            image: data.image,
            date: data.date,
          };

          const secondAsset = {
            value: data.gallons,
            assetId: data.id + 1,
            status: data.passed ? 'Passed' : 'Defect',
            title: 'gallons',
            truckInspection: createdInspection,
            cardTitle: data.card_title || 'Mileage',
            cardId: data.card_id || 0,
            image: data.image,
            date: data.date,
          };
          gallonsAssetId = secondAsset.assetId;

          const thirdAsset = {
            value: data.gallonsAmount,
            assetId: data.id + 2,
            status: data.passed ? 'Passed' : 'Defect',
            title: 'gallons amount',
            truckInspection: createdInspection,
            cardTitle: data.card_title || 'Mileage',
            cardId: data.card_id || 0,
            image: data.image,
            date: data.date,
          };
          await this.assetsRepo.create(firstAsset);
          await this.assetsRepo.create(secondAsset);
          await this.assetsRepo.create(thirdAsset);
        } else {
          const asset = {
            value: data.value,
            assetId: data.id,
            status: data.passed ? 'Passed' : 'Defect',
            title: data.title,
            truckInspection: createdInspection,
            cardTitle: data.card_title || 'Mileage',
            cardId: data.card_id || 0,
            image: data.image,
            date: data.date,
          };
          await this.assetsRepo.create(asset);
        }
        return assets;
      }),
    );

    if (newInspection.type === TruckInspectionType.POST_TRIP_INSPECTION) {
      const gallonsAmount = reviewData[0].gallonsAmount.replace('$', '');
      const newWorkOrder = {
        dueDate: new Date(),
        paidAt: new Date(),
        status: 'Completed',
        itemName: `Fuel (${reviewData[0].gallons} GAL)`,
        comments: '',
        labor: 0,
        parts: gallonsAmount,
        mechanic: 'N/A',
        miles: reviewData[0].value,
      };
      const assets = await this.assetsRepo.getGallonsAssetByInspectionId(
        createdInspection.id,
      );
      this.createWorkOrderForGallons(newWorkOrder, assets[0], truck, owner);
    }

    const taskOrders = await this.taskOrderRepo.getTaskOrdersByTruckId(
      truck.id,
    );

    await Promise.all(
      taskOrders.map(async taskOrder => {
        const foundTaskOrder = await this.taskOrderRepo.findById(taskOrder.id);
        foundTaskOrder.currentMiles = newTruckMiles;

        if (foundTaskOrder.status !== 'Done') {
          foundTaskOrder.milesToTask -= newTruckMiles - currentTruckMiles;

          if (
            foundTaskOrder.milesToTask <= 0 &&
            foundTaskOrder.status !== 'Due'
          ) {
            foundTaskOrder.status = 'Due';

            /*          if (owner.deviceID) {
              this.eventEmitter.emit('sendNotification', {
                to: owner.deviceID,
                title: `Hey ${owner.name}, one of your task orders is now due`,
                body: `Task Order: #${taskOrder.orderNumber} for Truck: ${truck.number} 
                is due, check it out as soon as possible!`,
              });

              const notification = await this.notificationService.createNotification(
                {
                  ...TaskOrderOnDue(
                    owner.name,
                    taskOrder.orderNumber,
                    truck.number,
                  ),
                  userId: owner.id,
                },
              );

              this.eventEmitter.emit(
                'sendSocketNotification',
                notification,
                owner.id,
              );
            } */
          }

          await this.taskOrderRepo.save(foundTaskOrder);
        }
      }),
    );

    return 'Successfully created';
  }

  async handleAutoPunchOutTrucks(): Promise<void> {
    const punchs = await this.truckPunchRepo.find({ punchOut: null });
    punchs.forEach(async punch => {
      const punchInHour = moment(punch.punchIn).add(12, 'hours');
      const now = moment();
      const driver = (await this.userRepo.findById(punch.driverId)) as Driver;

      // see if the driver has more jobs for today
      const driverScheduledJobs = await this.scheduledJobRepo.findAllScheduledDriverScheduledJobs(
        driver,
        {
          start: moment(new Date()).format('MM-DD-YYYY HH:mm'),
          end: moment(new Date()).format('MM-DD-YYYY HH:mm'),
        },
      );

      // see if the driver has more active for today
      const activeJob = await this.scheduledJobRepo.findActiveScheduledJob(
        driver,
      );

      if (driverScheduledJobs.length <= 0 && !activeJob && punchInHour <= now) {
        this.eventEmitterNotification.emit(
          'autoPunchOutByCron',
          punch.driverId,
        );
        punch.punchOut = moment().format('YYYY-MM-DD HH:mm:ss');
        this.truckPunchRepo.save(punch);
      }
    });
  }

  async getUploadImageURL(title: string): Promise<string> {
    return this.s3Service.getUploadInspectionImageURL(title);
  }

  async getInspectionsOverview(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<TruckInspectionDTO> {
    const owner = (await this.userRepo.findById(ownerId)) as Owner;
    const inspections = await this.inspectionRepo.findInspections(
      owner.id,
      start,
      end,
    );
    let failedInspections = 0;
    let defects = 0;
    const driversSet = new Set<string>();
    const trucksSet = new Set<string>();

    const totalDrivers = await this.driverRepo.countOwnerDrivers(owner, true);
    const totalTrucks = await this.truckRepo.countOwnerTrucks(owner, true);

    const totalInspections = await Promise.all(
      inspections.map(async inspect => {
        let failedInspection = false;
        const assets = await this.assetsRepo.getAssetsByInspectionId(
          inspect.id,
        );
        const ownerData = inspect.owner.split(',');
        const driverData = inspect.driver.split(',');
        const truckData = inspect.truck.split(',');

        const inspection = {
          id: inspect.id,
          truck: {
            id: truckData[0],
            number: truckData[1],
          },
          owner: {
            id: ownerData[0],
            name: ownerData[1],
          },
          driver: {
            id: driverData[0],
            name: driverData[1],
          },
          passedAssets: [],
          unpassedAssets: [],
          failed: false,
          date: inspect.createdAt,
          inspectionID: inspect.inspectionNumber,
          type:
            inspect.type === 'PRE_TRIP_INSPECTION' ? 'Pre-trip' : 'Post-trip',
        };

        driversSet.add(driverData[0]);
        trucksSet.add(truckData[0]);
        assets.forEach((asset, index) => {
          if (index > 0) {
            if (asset.status === 'Passed') {
              inspection.passedAssets.push(asset);
            } else {
              defects += 1;
              failedInspection = true;
              inspection.unpassedAssets.push(asset);
            }
          }
        });
        if (failedInspection) {
          inspection.failed = true;
          failedInspections += 1;
        }
        return inspection;
      }),
    );

    const totalCompletedWorkOrders = await this.workOrderRepo.getTotalCompletedWorkOrdersByOwnerId(
      ownerId,
      start,
      end,
    );
    const totalPendingWorkOrders = await this.workOrderRepo.getTotalPendingWorkOrdersByOwnerId(
      ownerId,
      start,
      end,
    );
    const totalWorkOrders = await this.workOrderRepo.getTotalWorkOrdersByOwnerId(
      ownerId,
      start,
      end,
    );

    const driversBoard = [];
    const trucksBoard = [];
    const expensesBoard = [];

    const latestThreeInspectedDrivers = await this.inspectionRepo.getLatestThreeInspectedDrivers(
      ownerId,
      start,
      end,
    );
    latestThreeInspectedDrivers.sort((a, b) => {
      if (new Date(a.createdAt) > new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) < new Date(b.createdAt)) return -1;
      return 0;
    });

    await Promise.all(
      latestThreeInspectedDrivers.map(async inspection => {
        const driver = await this.driverRepo.findById(inspection.driverId);
        const totalInspectionsByDriver = await this.inspectionRepo.getTotalInspectionsByDriverId(
          inspection.driverId,
          start,
          end,
        );

        driversBoard.push({
          driverId: inspection.driverId,
          driverName: driver.name,
          totalInspections: +totalInspectionsByDriver[0].count,
        });
      }),
    );

    const latestThreeInspectedTrucks = await this.inspectionRepo.getLatestThreeInspectedTrucks(
      ownerId,
      start,
      end,
    );
    latestThreeInspectedTrucks.sort((a, b) => {
      if (new Date(a.createdAt) > new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) < new Date(b.createdAt)) return -1;
      return 0;
    });

    await Promise.all(
      latestThreeInspectedTrucks.map(async inspection => {
        const truck = await this.truckRepo.findById(inspection.truckId);
        const totalInspectionsByTruck = await this.inspectionRepo.getTotalInspectionsByTruckId(
          inspection.truckId,
          start,
          end,
        );

        trucksBoard.push({
          truckId: inspection.truckId,
          truckNumber: truck.number,
          totalInspections: +totalInspectionsByTruck[0].count,
        });
      }),
    );

    let totalLaborByTruck = 0;
    let totalPartsByTruck = 0;

    const latestThreeWorkOrdersForTrucks = await this.workOrderRepo.getLatestThreeWorkOrdersForTrucks(
      ownerId,
      start,
      end,
    );
    latestThreeWorkOrdersForTrucks.sort((a, b) => {
      if (new Date(a.createdAt) > new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) < new Date(b.createdAt)) return -1;
      return 0;
    });

    await Promise.all(
      latestThreeWorkOrdersForTrucks.map(async workOrder => {
        const foundTruck = await this.truckRepo.findById(workOrder.truckId);
        const foundWorkOrderItems = await this.workOrderItemsRepo.getWorkOrderItemsByTruck(
          foundTruck.id,
        );
        foundWorkOrderItems.map(async workOrderItem => {
          totalLaborByTruck += parseFloat(workOrderItem.labor);
          totalPartsByTruck += parseFloat(workOrderItem.parts);
        });

        expensesBoard.push({
          truckId: foundTruck.id,
          truckNumber: foundTruck.number,
          labor: totalLaborByTruck,
          parts: totalPartsByTruck,
          totalCost: totalLaborByTruck + totalPartsByTruck,
        });

        totalLaborByTruck = 0;
        totalPartsByTruck = 0;
      }),
    );

    return {
      totalInspections,
      failedInspections,
      totalCompletedWorkOrders,
      totalPendingWorkOrders,
      totalWorkOrders,
      defects,
      inspectedDrivers: driversSet.size,
      inspectedTrucks: trucksSet.size,
      totalDrivers,
      totalTrucks,
      driversBoard,
      trucksBoard,
      expensesBoard,
    };
  }

  async getDefectsHistory(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<DefectsDTO[]> {
    const inspections = await this.inspectionRepo.findInspections(
      ownerId,
      start,
      end,
    );

    const defects = [];

    await Promise.all(
      inspections.map<any>(async inspect => {
        const assets = await this.assetsRepo.getAssetsByInspectionId(
          inspect.id,
        );
        const defectsHistory = [];
        assets.forEach((asset, index) => {
          if (index > 0 && asset.status !== 'Passed') {
            defects.push({
              driver: inspect.driver.split(',')[1],
              dateCreated: inspect.createdAt,
              lastUpdated: inspect.updatedAt,
              defect: asset.title,
              id: asset.assetNumber,
              status: asset.status,
            });
          }
        });
        return defectsHistory;
      }),
    );
    if (defects.length > 0) {
      return defects;
    }
    return [];
  }

  async getInspectionByNumber(id: number): Promise<any> {
    const inspection = await this.inspectionRepo.getInspectionByNumber(id);
    const assets = await this.assetsRepo.getAssetsByInspectionId(inspection.id);
    const assetsMap = new Map<string, any[]>();

    assets.forEach(asset => {
      const card = JSON.stringify({
        cardId: asset.cardId,
        title: asset.cardTitle,
      });
      const newAsset = {
        assetId: asset.id,
        createdAt: asset.createdAt,
        id: asset.id,
        status: asset.status,
        title: asset.title,
        image: asset.image,
        assetNumber: asset.assetNumber,
        value: asset.value,
        fixedAt: asset.fixedAt,
      };

      if (assetsMap.has(card)) {
        const prev = assetsMap.get(card);
        assetsMap.set(card, [...prev, newAsset]);
      } else {
        assetsMap.set(card, [newAsset]);
      }
    });

    const assetsArray = [];

    assetsMap.forEach((value, key) => {
      assetsArray.push({
        assets: value,
        card: JSON.parse(key),
      });
    });

    const currInspec = { ...inspection, assets: assetsArray };

    return { currInspec };
  }

  async getDefectByNumber(assetNumber: number): Promise<DefectDTO> {
    const defect = await this.assetsRepo.getDefectByNumber(assetNumber);
    const inspection = await this.inspectionRepo.getInspectionByNumber(
      defect.truckInspectionInspectionNumber,
    );
    const foundWorkOrder = await this.workOrderRepo.getWorkOrderByAssetsNumber(
      assetNumber,
    );
    const truckId = inspection.truck.split(',')[0];
    const foundTruck = await this.truckRepo.findById(truckId);
    const truck = {
      number: foundTruck.number,
      isDisable: foundTruck.isDisable,
      isActive: foundTruck.isActive,
      makemodel: foundTruck.truckMakeAndModel,
      year: foundTruck.truckYear,
      license: foundTruck.plateNumber,
      vin: foundTruck.VINNumber,
    };

    return {
      ...defect,
      driver: inspection.driver.split(',')[1],
      truckId,
      workOrderId:
        this.objectLength(foundWorkOrder) > 0 ? foundWorkOrder[0].id : null,
      truck,
    };
  }

  async getInspectionReportData(id: number): Promise<any> {
    const inspection = await this.inspectionRepo.getInspectionByNumber(id);
    const assets = await this.assetsRepo.getAssetsByInspectionId(inspection.id);

    const assetsMap = new Map<string, any[]>();

    assets.forEach(asset => {
      const card = JSON.stringify({
        cardId: asset.cardId,
        title: asset.cardTitle,
      });
      const newAsset = {
        assetId: asset.id,
        createdAt: asset.createdAt,
        id: asset.id,
        status: asset.status,
        title: asset.title,
        image: asset.image,
        assetNumber: asset.assetNumber,
        value: asset.value,
      };

      if (assetsMap.has(card)) {
        const prev = assetsMap.get(card);
        assetsMap.set(card, [...prev, newAsset]);
      } else {
        assetsMap.set(card, [newAsset]);
      }
    });

    const assetsArray = [];

    assetsMap.forEach((value, key) => {
      assetsArray.push({
        assets: value,
        card: JSON.parse(key),
      });
    });

    return {
      inspection,
      assetsArray,
    };
  }

  async updateDefectStatusByNumber(
    defectNumber: number,
    status: string,
  ): Promise<void> {
    if (status === 'Solved') {
      await this.assetsRepo.setDefectAsSolvedByNumber(defectNumber);
    }
    await this.assetsRepo.updateDefectStatusByNumber(defectNumber, status);
  }

  async getInspectionsHistory(ownerId: string): Promise<TruckInspectionDTO> {
    const owner = (await this.userRepo.findById(ownerId)) as Owner;
    const inspections = await this.inspectionRepo.getInspectionsByOwnerId(
      owner.id,
    );
    let failedInspections = 0;
    inspections.sort((a, b) => {
      if (new Date(a.createdAt) < new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) > new Date(b.createdAt)) return -1;
      return 0;
    });

    const totalInspections = await Promise.all(
      inspections.map(async inspect => {
        let failedInspection = false;
        const assets = await this.assetsRepo.getAssetsByInspectionId(
          inspect.id,
        );
        const ownerData = inspect.owner.split(',');
        const driverData = inspect.driver.split(',');
        const truckData = inspect.truck.split(',');

        const inspection = {
          id: inspect.id,
          truck: {
            id: truckData[0],
            number: truckData[1],
          },
          owner: {
            id: ownerData[0],
            name: ownerData[1],
          },
          driver: {
            id: driverData[0],
            name: driverData[1],
          },
          passedAssets: [],
          unpassedAssets: [],
          failed: false,
          date: inspect.createdAt,
          inspectionID: inspect.inspectionNumber,
          type:
            inspect.type === 'PRE_TRIP_INSPECTION' ? 'Pre-trip' : 'Post-trip',
        };

        assets.forEach((asset, index) => {
          if (index > 0) {
            if (asset.status === 'Passed') {
              inspection.passedAssets.push(asset);
            } else {
              failedInspection = true;
              inspection.unpassedAssets.push(asset);
            }
          }
        });
        if (failedInspection) {
          inspection.failed = true;
          failedInspections += 1;
        }
        return inspection;
      }),
    );

    return {
      totalInspections,
      failedInspections,
    };
  }

  async getMaintenanceHistory(ownerId: string): Promise<MaintenanceDTO> {
    const taskOrders = [];

    const foundTaskOrders = await this.taskOrderRepo.getNotDoneTaskOrdersByOwnerId(
      ownerId,
    );

    await Promise.all(
      foundTaskOrders.map(async taskOrder => {
        const truck = await this.truckRepo.findById(taskOrder.truckId);

        taskOrders.push({
          id: taskOrder.id,
          truckNumber: truck.number,
          orderNumber: taskOrder.orderNumber,
          createdAt: taskOrder.createdAt,
          status: taskOrder.status,
          title: taskOrder.title,
          description: taskOrder.description,
          interval: `Every ${taskOrder.interval} miles`,
          milesToTask: taskOrder.milesToTask,
          currentMiles: taskOrder.currentMiles,
        });
      }),
    );

    return {
      taskOrders,
    };
  }

  async getExpensesHistory(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<ExpensesDTO> {
    const workOrders = [];
    let totalLaborByWorkOrder = 0;
    let totalPartsByWorkOrder = 0;
    let totalExpenses = 0;

    const foundWorkOrders = await this.workOrderRepo.getWorkOrdersByOwnerId(
      ownerId,
      start,
      end,
    );

    await Promise.all(
      foundWorkOrders.map(async workOrder => {
        const truck = await this.truckRepo.findById(workOrder.truckId);
        const foundWorkOrderItems = await this.workOrderItemsRepo.getWorkOrderItemsByWorkOrder(
          workOrder.id,
        );
        foundWorkOrderItems.map(async workOrderItem => {
          totalLaborByWorkOrder += parseFloat(workOrderItem.labor);
          totalPartsByWorkOrder += parseFloat(workOrderItem.parts);
        });
        totalExpenses += totalLaborByWorkOrder + totalPartsByWorkOrder;

        workOrders.push({
          id: workOrder.id,
          truckNumber: truck.number,
          orderNumber: workOrder.orderNumber,
          createdAt: workOrder.createdAt,
          itemName: foundWorkOrderItems[0]?.name,
          status: workOrder.status,
          labor: totalLaborByWorkOrder,
          parts: totalPartsByWorkOrder,
          totalCost: totalLaborByWorkOrder + totalPartsByWorkOrder,
          mechanic: workOrder.mechanic,
        });

        totalLaborByWorkOrder = 0;
        totalPartsByWorkOrder = 0;
      }),
    );

    return {
      workOrders,
      totalExpenses,
    };
  }

  async createWorkOrderWithDefect(
    workOrder: WorkOrderType,
    assets: DefectDTO,
    truck: Truck,
    user: User,
  ): Promise<any> {
    const workOrderArr = {
      dueDate: workOrder.dueDate,
      status: workOrder.status,
      mechanic: workOrder.mechanic,
      assets,
      truck,
      user,
    };
    const newWorkOrder = await this.workOrderRepo.createWorkOrder(workOrderArr);
    const foundWorkOrder = await this.workOrderRepo.findById(newWorkOrder.id);

    const workOrderItemArr = {
      name: workOrder.itemName,
      comments: workOrder.comments,
      labor: workOrder.labor,
      parts: workOrder.parts,
      foundWorkOrder,
      truck,
      user,
    };
    const newWorkOrderItem = await this.workOrderItemsRepo.createWorkOrderItem(
      workOrderItemArr,
    );

    return [newWorkOrder, newWorkOrderItem];
  }

  async createWorkOrderForGallons(
    workOrder: WorkOrderType,
    assets: Assets,
    truck: Truck,
    user: User,
  ): Promise<any> {
    const workOrderArr = {
      dueDate: workOrder.dueDate,
      paidAt: workOrder.paidAt,
      status: workOrder.status,
      mechanic: workOrder.mechanic,
      miles: workOrder.miles,
      assets,
      truck,
      user,
    };
    const newWorkOrder = await this.workOrderRepo.createWorkOrder(workOrderArr);
    const foundWorkOrder = await this.workOrderRepo.findById(newWorkOrder.id);

    const workOrderItemArr = {
      name: workOrder.itemName,
      comments: workOrder.comments,
      labor: workOrder.labor,
      parts: workOrder.parts,
      foundWorkOrder,
      truck,
      user,
    };
    const newWorkOrderItem = await this.workOrderItemsRepo.createWorkOrderItem(
      workOrderItemArr,
    );

    return [newWorkOrder, newWorkOrderItem];
  }

  async createWorkOrderWithTaskOrder(
    workOrder: WorkOrderType,
    taskOrder: TaskOrder,
    truck: Truck,
    user: User,
  ): Promise<any> {
    const workOrderArr = {
      dueDate: workOrder.dueDate,
      status: workOrder.status,
      mechanic: workOrder.mechanic,
      taskOrder,
      truck,
      user,
    };
    const newWorkOrder = await this.workOrderRepo.createWorkOrder(workOrderArr);
    const foundWorkOrder = await this.workOrderRepo.findById(newWorkOrder.id);

    const workOrderItemArr = {
      name: workOrder.itemName,
      comments: workOrder.comments,
      labor: workOrder.labor,
      parts: workOrder.parts,
      foundWorkOrder,
      truck,
      user,
    };
    const newWorkOrderItem = await this.workOrderItemsRepo.createWorkOrderItem(
      workOrderItemArr,
    );

    return [newWorkOrder, newWorkOrderItem];
  }

  async createWorkOrderItem(
    workOrderItem: WorkOrderItemsType,
    workOrderId: string,
    truck: Truck,
    user: User,
  ): Promise<any> {
    const foundWorkOrder = await this.workOrderRepo.findById(workOrderId);

    const workOrderItemArr = {
      name: workOrderItem.name,
      comments: workOrderItem.comments,
      labor: workOrderItem.labor,
      parts: workOrderItem.parts,
      foundWorkOrder,
      truck,
      user,
    };
    const newWorkOrderItem = await this.workOrderItemsRepo.createWorkOrderItem(
      workOrderItemArr,
    );

    return newWorkOrderItem;
  }

  async createTaskOrder(
    taskOrder: TaskOrderType,
    truck: Truck,
    user: User,
  ): Promise<any> {
    const taskOrderArr = {
      status: taskOrder.status,
      title: taskOrder.title,
      description: taskOrder.description,
      interval: taskOrder.interval,
      milesToTask: taskOrder.interval,
      currentMiles: taskOrder.currentMiles,
      truck,
      user,
    };
    const newTaskOrder = await this.taskOrderRepo.createTaskOrder(taskOrderArr);

    return newTaskOrder;
  }

  async editWorkOrder(
    workOrderId: string,
    workOrder: WorkOrderType,
  ): Promise<any> {
    const foundWorkOrder = await this.workOrderRepo.findById(workOrderId);
    foundWorkOrder.miles = workOrder.miles;
    await this.workOrderRepo.save(foundWorkOrder);

    return foundWorkOrder;
  }

  async editWorkOrderItem(
    workOrderItemId: string,
    workOrderItem: WorkOrderItemsType,
  ): Promise<any> {
    const foundWorkOrderItem = await this.workOrderItemsRepo.findById(
      workOrderItemId,
    );
    foundWorkOrderItem.name = workOrderItem.name;
    foundWorkOrderItem.comments = workOrderItem.comments;
    foundWorkOrderItem.labor = workOrderItem.labor;
    foundWorkOrderItem.parts = workOrderItem.parts;
    await this.workOrderItemsRepo.save(foundWorkOrderItem);

    return foundWorkOrderItem;
  }

  async editTaskOrder(
    taskOrderId: string,
    taskOrder: TaskOrderType,
  ): Promise<any> {
    const foundTaskOrder = await this.taskOrderRepo.findById(taskOrderId);
    foundTaskOrder.title = taskOrder.title;
    foundTaskOrder.description = taskOrder.description;
    foundTaskOrder.interval = taskOrder.interval;
    foundTaskOrder.currentMiles = taskOrder.currentMiles;
    await this.taskOrderRepo.save(foundTaskOrder);

    return foundTaskOrder;
  }

  async updateWorkOrderStatus(
    workOrderId: string,
    workOrderStatus: WorkOrderType,
    user: User,
  ): Promise<any> {
    let newWorkOrderStatus;

    if (workOrderStatus.status === 'Completed') {
      newWorkOrderStatus = await this.workOrderRepo.setWorkOrderAsCompleted(
        workOrderId,
        workOrderStatus.paidAt,
        workOrderStatus.status,
        workOrderStatus.miles,
      );

      const foundWorkOrder = await this.workOrderRepo.getWorkOrderById(
        workOrderId,
      );
      const foundTruck = await this.truckRepo.findById(
        foundWorkOrder[0].truckId,
      );
      foundTruck.miles = workOrderStatus.miles;
      await this.truckRepo.save(foundTruck);

      await this.taskOrderRepo.editTaskOrdersCurrentMilesByTruckId(
        foundTruck.miles,
        foundTruck.id,
      );

      if (foundWorkOrder[0].taskOrderId) {
        await this.updateTaskOrderStatus(
          foundWorkOrder[0].taskOrderId,
          'Done',
          user,
        );
      } else {
        await this.assetsRepo.setDefectAsSolvedByNumber(
          foundWorkOrder[0].assetsAssetNumber,
        );
      }
    } else {
      newWorkOrderStatus = await this.workOrderRepo.updateWorkOrderStatus(
        workOrderId,
        workOrderStatus.status,
      );
    }

    return newWorkOrderStatus;
  }

  async updateTaskOrderStatus(
    taskOrderId: string,
    status: string,
    user: User,
  ): Promise<any> {
    let newTaskOrderStatus;

    if (status !== 'Done') {
      newTaskOrderStatus = await this.taskOrderRepo.updateTaskOrderStatus(
        taskOrderId,
        status,
      );
    } else {
      newTaskOrderStatus = await this.taskOrderRepo.setTaskOrderAsDone(
        taskOrderId,
        status,
      );
      const foundTaskOrder = await this.taskOrderRepo.getTaskOrderById(
        taskOrderId,
      );
      const foundTruck = await this.truckRepo.findById(
        foundTaskOrder[0].truckId,
      );

      const newTaskOrderArr = {
        status: 'Incoming Task',
        title: foundTaskOrder[0].title,
        description: foundTaskOrder[0].description,
        interval: foundTaskOrder[0].interval,
        milesToTask: foundTaskOrder[0].interval,
        currentMiles: foundTruck.miles,
        lastTaskDoneOrderNumber: foundTaskOrder[0].orderNumber,
        lastTaskDoneAt: foundTaskOrder[0].doneAt,
        lastTaskMiles: foundTaskOrder[0].currentMiles,
        truck: foundTruck,
        user,
      };
      await this.taskOrderRepo.createTaskOrder(newTaskOrderArr);
    }

    return newTaskOrderStatus;
  }

  async getWorkOrder(workOrderId): Promise<any> {
    const foundWorkOrder = await this.workOrderRepo.getWorkOrderById(
      workOrderId,
    );
    const foundTaskOrder = foundWorkOrder[0].taskOrderId
      ? await this.taskOrderRepo.findById(foundWorkOrder[0].taskOrderId)
      : null;
    const foundDefect = foundWorkOrder[0].assetsAssetNumber
      ? await this.assetsRepo.getDefectByNumber(
        foundWorkOrder[0].assetsAssetNumber,
      )
      : null;
    const foundGallonsAsset = foundWorkOrder[0].assetsAssetNumber
      ? await this.assetsRepo.getGallonsAssetByNumber(
        foundWorkOrder[0].assetsAssetNumber,
      )
      : null;
    const workOrderItems = await this.workOrderItemsRepo.getWorkOrderItemsByWorkOrder(
      workOrderId,
    );
    const totalCost = await this.workOrderItemsRepo.getTotalExpensesByWorkOrderId(
      workOrderId,
    );
    const foundTruck = await this.truckRepo.findById(foundWorkOrder[0].truckId);

    const workOrder = {
      id: workOrderId,
      orderNumber: `${foundWorkOrder[0].orderNumber}`,
      createdAt: foundWorkOrder[0].createdAt,
      paidAt: foundWorkOrder[0].paidAt,
      dueDate: foundWorkOrder[0].dueDate,
      status: foundWorkOrder[0].status,
      mechanic: foundWorkOrder[0].mechanic,
      miles: foundWorkOrder[0].miles,
      taskOrderId: foundWorkOrder[0].taskOrderId,
      taskOrderNumber: foundTaskOrder?.orderNumber || null,
      defectId: foundDefect?.id || null,
      assetNumber: foundWorkOrder[0].assetsAssetNumber,
      isForFuel: foundGallonsAsset?.status === 'Passed',
      inspectionId: foundGallonsAsset?.truckInspectionInspectionNumber || null,
      itemName: foundTaskOrder?.title || foundDefect?.title,
      workOrderItems,
      totalCost,
      truck: {
        id: foundTruck.id,
        number: foundTruck.number,
        isDisable: foundTruck.isDisable,
        isActive: foundTruck.isActive,
        makemodel: foundTruck.truckMakeAndModel,
        year: foundTruck.truckYear,
        license: foundTruck.plateNumber,
        vin: foundTruck.VINNumber,
        miles: foundTruck.miles,
      },
    };

    return workOrder;
  }

  async getTaskOrder(taskOrderId: string): Promise<any> {
    let hasLastTask = false;

    const foundTaskOrder = await this.taskOrderRepo.getTaskOrderById(
      taskOrderId,
    );
    const foundLastTaskOrder = await this.taskOrderRepo.getTaskOrderByOrderNumber(
      foundTaskOrder[0].lastTaskDoneOrderNumber,
    );
    if (this.objectLength(foundLastTaskOrder) > 0) {
      hasLastTask = true;
    }
    const foundTruck = await this.truckRepo.findById(foundTaskOrder[0].truckId);
    const foundWorkOrder = await this.workOrderRepo.getWorkOrderByTaskOrderId(
      taskOrderId,
    );

    const taskOrder = {
      id: foundTaskOrder[0].id,
      orderNumber: `${foundTaskOrder[0].orderNumber}`,
      createdAt: foundTaskOrder[0].createdAt,
      status: foundTaskOrder[0].status,
      title: foundTaskOrder[0].title,
      description: foundTaskOrder[0].description,
      interval: `Every ${foundTaskOrder[0].interval} miles`,
      milesToTask: foundTaskOrder[0].milesToTask,
      truckId: foundTruck.id,
      truckNumber: foundTruck.number,
      currentMiles: foundTaskOrder[0].currentMiles,
      lastTaskDoneOrderNumber: hasLastTask
        ? foundLastTaskOrder[0].orderNumber
        : null,
      lastTaskDoneAt: hasLastTask ? foundLastTaskOrder[0].doneAt : null,
      lastTaskMiles: hasLastTask ? foundLastTaskOrder[0].currentMiles : null,
      workOrderId:
        this.objectLength(foundWorkOrder) > 0 ? foundWorkOrder[0].id : null,
    };

    return taskOrder;
  }

  async getDriversBoardInspectionList(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<DriversBoardDTO> {
    const inspections = await this.inspectionRepo.getLatestInspectionByDrivers(
      ownerId,
    );
    inspections.sort((a, b) => {
      if (new Date(a.createdAt) > new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) < new Date(b.createdAt)) return -1;
      return 0;
    });

    const drivers = await Promise.all(
      inspections.map(async inspect => {
        const driverData = inspect.driver.split(',');
        const totalInspectionsByDriver = await this.inspectionRepo.getTotalInspectionsByDriverId(
          driverData[0],
        );

        const driver = {
          id: driverData[0],
          name: driverData[1],
          inspectionId: inspect.id,
          inspectionCreatedAt: inspect.createdAt,
          inspectionStatus: inspect.defects > 0 ? 'Failed' : 'Passed',
          inspectionType:
            inspect.type === 'PRE_TRIP_INSPECTION' ? 'Pre-trip' : 'Post-trip',
          totalInspections: `${totalInspectionsByDriver[0].count}`,
        };

        return driver;
      }),
    );

    return {
      drivers,
    };
  }

  async getDriverBoardList(
    driverId: string,
    start: string,
    end: string,
  ): Promise<DriverBoardDTO> {
    const inspections = [];

    const foundDriver = (await this.userRepo.findById(driverId)) as Driver;
    const driver = {
      id: foundDriver.id,
      name: foundDriver.name,
    };
    const foundInspections = await this.inspectionRepo.getInspectionsByDriverId(
      driverId,
    );

    await Promise.all(
      foundInspections.map(async inspect => {
        const miles = await this.assetsRepo.getMilesByTruckInspectionId(
          inspect.id,
        );

        inspections.push({
          id: inspect.id,
          number: inspect.inspectionNumber,
          createdAt: inspect.createdAt,
          status: inspect.defects > 0 ? 'Failed' : 'Passed',
          type:
            inspect.type === 'PRE_TRIP_INSPECTION' ? 'Pre-trip' : 'Post-trip',
          miles,
        });
      }),
    );

    return {
      driver,
      inspections,
    };
  }

  async getTrucksBoardInspectionList(
    ownerId: string,
    start: string,
    end: string,
  ): Promise<TrucksBoardDTO> {
    const inspections = await this.inspectionRepo.getLatestInspectionByTrucks(
      ownerId,
    );
    inspections.sort((a, b) => {
      if (new Date(a.createdAt) < new Date(b.createdAt)) return 1;
      if (new Date(a.createdAt) > new Date(b.createdAt)) return -1;
      return 0;
    });

    const trucks = await Promise.all(
      inspections.map(async inspection => {
        const driverData = inspection.driver.split(',');
        const truckData = inspection.truck.split(',');
        const miles = await this.assetsRepo.getMilesByTruckInspectionId(
          inspection.id,
        );

        const truck = {
          id: truckData[0],
          number: truckData[1],
          inspectionId: inspection.id,
          inspectionCreatedAt: inspection.createdAt,
          inspectionStatus: inspection.defects > 0 ? 'Failed' : 'Passed',
          inspectionType:
            inspection.type === 'PRE_TRIP_INSPECTION'
              ? 'Pre-trip'
              : 'Post-trip',
          inspectionMiles: miles,
          inspectionDriver: driverData[1],
        };

        return truck;
      }),
    );

    return {
      trucks,
    };
  }

  async getTruckBoardList(
    truckId: string,
    start: string,
    end: string,
  ): Promise<TruckBoardDTO> {
    const inspections = [];
    const defects = [];
    const taskOrders = [];
    const workOrders = [];
    let totalPassedInspections = 0;
    let totalFailedInspections = 0;
    let totalReportedDefects = 0;
    let totalCorrectedDefects = 0;
    let totalLaborByWorkOrder = 0;
    let totalPartsByWorkOrder = 0;
    let totalExpenses = 0;

    const foundTruck = await this.truckRepo.findById(truckId);
    const truck = {
      id: truckId,
      number: foundTruck.number,
      totalMiles: foundTruck.miles,
      isDisable: foundTruck.isDisable,
    };
    const foundInspections = await this.inspectionRepo.getInspectionsByTruckId(
      truckId,
      start,
      end,
    );
    const totalOverdueTaskOrders = await this.taskOrderRepo.getTotalTaskOrdersByTruckAndStatus(
      truckId,
      'Due',
      start,
      end,
    );
    const totalPendingTaskOrders = await this.taskOrderRepo.getTotalTaskOrdersByTruckAndStatus(
      truckId,
      'Incoming Task',
      start,
      end,
    );

    await Promise.all(
      foundInspections.map(async inspect => {
        const foundDriver = (await this.userRepo.findById(
          inspect.driverId,
        )) as Driver;
        const foundDefects = await this.assetsRepo.getDefectsByInspectionId(
          inspect.id,
        );
        const miles = await this.assetsRepo.getMilesByTruckInspectionId(
          inspect.id,
        );
        const totalCorrectedDefectsByInspectionId = await this.assetsRepo.getTotalCorrectedDefectsByInspectionId(
          inspect.id,
        );
        totalCorrectedDefects += totalCorrectedDefectsByInspectionId;

        inspections.push({
          id: inspect.id,
          number: inspect.inspectionNumber,
          createdAt: inspect.createdAt,
          status: inspect.defects > 0 ? 'Failed' : 'Passed',
          type:
            inspect.type === 'PRE_TRIP_INSPECTION' ? 'Pre-trip' : 'Post-trip',
          miles,
          driver: foundDriver.name,
        });

        foundDefects.map(async defect => {
          const foundWorkOrder = await this.workOrderRepo.getWorkOrderByAssetsNumber(
            defect.assetNumber,
          );

          defects.push({
            id: defect.id,
            number: defect.assetNumber,
            createdAt: defect.createdAt,
            status: defect.status,
            defect: defect.title,
            mechanic:
              this.objectLength(foundWorkOrder) > 0
                ? foundWorkOrder[0].mechanic
                : 'Not assigned yet',
          });
        });

        if (inspect.defects > 0) {
          totalFailedInspections += 1;
          totalReportedDefects += inspect.defects;
        } else {
          totalPassedInspections += 1;
        }
      }),
    );

    const foundWorkOrders = await this.workOrderRepo.getWorkOrdersByTruckId(
      truckId,
      start,
      end,
    );

    await Promise.all(
      foundWorkOrders.map(async workOrder => {
        const foundWorkOrderItems = await this.workOrderItemsRepo.getWorkOrderItemsByWorkOrder(
          workOrder.id,
        );
        foundWorkOrderItems.map(async workOrderItem => {
          totalLaborByWorkOrder += parseFloat(workOrderItem.labor);
          totalPartsByWorkOrder += parseFloat(workOrderItem.parts);
        });
        totalExpenses += totalLaborByWorkOrder + totalPartsByWorkOrder;

        workOrders.push({
          id: workOrder.id,
          orderNumber: workOrder.orderNumber,
          createdAt: workOrder.createdAt,
          itemName: foundWorkOrderItems[0]?.name,
          status: workOrder.status,
          labor: totalLaborByWorkOrder,
          parts: totalPartsByWorkOrder,
          totalCost: totalLaborByWorkOrder + totalPartsByWorkOrder,
        });

        totalLaborByWorkOrder = 0;
        totalPartsByWorkOrder = 0;
      }),
    );

    const foundTaskOrders = await this.taskOrderRepo.getTaskOrdersByTruckId(
      truckId,
      start,
      end,
    );

    await Promise.all(
      foundTaskOrders.map(async taskOrder => {
        taskOrders.push({
          id: taskOrder.id,
          orderNumber: taskOrder.orderNumber,
          createdAt: taskOrder.createdAt,
          status: taskOrder.status,
          title: taskOrder.title,
          description: taskOrder.description,
          interval: `Every ${taskOrder.interval} miles`,
          milesToTask: taskOrder.milesToTask,
          currentMiles: taskOrder.currentMiles,
        });
      }),
    );

    return {
      truck,
      inspections,
      defects,
      workOrders,
      taskOrders,
      totalPassedInspections,
      totalFailedInspections,
      totalReportedDefects,
      totalCorrectedDefects,
      totalOverdueTaskOrders,
      totalPendingTaskOrders,
      totalExpenses,
    };
  }
}

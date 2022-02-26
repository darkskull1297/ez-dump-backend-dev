import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Truck } from '../truck.model';
import { TruckLog } from '../truck-log.model';

@EventSubscriber()
export class TruckSubscriber implements EntitySubscriberInterface<Truck> {
  // Denotes that this subscriber only listens to Trip Entity
  listenTo() {
    return Truck;
  }

  // Called after entity insertion
  async afterInsert(event: InsertEvent<Truck>) {
    console.info('Creating entity: ', event.entity);
    const truckLog = this.getClassEntity(event.entity);

    await event.manager.getRepository(TruckLog).insert(truckLog);
  }

  async afterUpdate(event: UpdateEvent<Truck>) {
    console.info('entity: ', event.databaseEntity);
    const truckLog = this.getClassEntity(event.entity);

    await event.manager.getRepository(TruckLog).save(truckLog);
  }

  async afterRemove(event: RemoveEvent<Truck>) {
    console.info('Removing entity: ', event.entity);
    const truckLog = this.getClassEntity(event.entity);
    truckLog.deletedAt = new Date();

    await event.manager.getRepository(TruckLog).save(truckLog);
  }

  private getClassEntity(truck: Truck): TruckLog {
    const truckLog = new TruckLog();

    truckLog.id = truck.id;
    truckLog.type = truck.type;
    truckLog.miles = truck.miles;
    truckLog.number = truck.number;
    truckLog.company = truck.company?.id;
    truckLog.netTons = truck.netTons;
    truckLog.subtype = truck.subtype;
    truckLog.isActive = truck.isActive;
    truckLog.createdAt = truck.createdAt;
    truckLog.updatedAt = truck.updatedAt;
    truckLog.grossTons = truck.grossTons;
    truckLog.truckYear = truck.truckYear;
    truckLog.VINNumber = truck.VINNumber;
    truckLog.tareWeight = truck.tareWeight;
    truckLog.plateNumber = truck.plateNumber;
    truckLog.registrationCard = truck.registrationCard;
    truckLog.truckMakeAndModel = truck.truckMakeAndModel;

    return truckLog;
  }
}

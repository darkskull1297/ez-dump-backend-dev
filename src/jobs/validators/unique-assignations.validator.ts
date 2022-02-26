import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CreateJobAssignationDTO } from '../dto/schedule-job.dto';

@ValidatorConstraint()
export class UniqueAssignations implements ValidatorConstraintInterface {
  validate(truckCategories: CreateJobAssignationDTO[]): boolean {
    let duplicateFound = false;
    const truckIds = [];
    const driverIds = [];
    truckCategories.forEach(({ truckId, driverId }) => {
      if (truckIds.includes(truckId) || driverIds.includes(driverId)) {
        duplicateFound = true;
      }
      truckIds.push(truckId);
      driverIds.push(driverId);
    });
    return !duplicateFound;
  }
}

export function IsAssignationUnique(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueAssignations,
    });
  };
}

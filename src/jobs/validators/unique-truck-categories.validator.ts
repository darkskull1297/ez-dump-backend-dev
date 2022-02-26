import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TruckCategoryDTO } from '../dto/truck-category.dto';

@ValidatorConstraint()
export class UniqueTruckCategories implements ValidatorConstraintInterface {
  validate(truckCategories: TruckCategoryDTO[]): boolean {
    let duplicateFound = false;
    const types = {};
    truckCategories.forEach(({ truckTypes }) => {
      types[truckTypes.join('-')] = [];
    });
    truckCategories.forEach(({ truckTypes, truckSubtypes }) => {
      if (types[truckTypes.join('-')].includes(truckSubtypes.join('-'))) {
        duplicateFound = true;
      }
      types[truckTypes.join('-')].push(truckSubtypes.join('-'));
    });
    return !duplicateFound;
  }
}

export function AreTruckCategoriesUnique(
  validationOptions?: ValidationOptions,
) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueTruckCategories,
    });
  };
}

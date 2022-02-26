import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValid } from 'date-fns';
import { parseSimpleDateStringToDate } from './date-utils';

@ValidatorConstraint()
export class SimpleDateValidator implements ValidatorConstraintInterface {
  validate(date: string): boolean {
    const parsedDate = parseSimpleDateStringToDate(date);
    return isValid(parsedDate);
  }
}

export function IsSimpleDate(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: SimpleDateValidator,
    });
  };
}

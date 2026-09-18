import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { normalizeAddress, InvalidAddressError } from './address';

@ValidatorConstraint({ name: 'isZzAddress', async: false })
export class IsZzAddressConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    try {
      normalizeAddress(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Address must be a single valid .zz address';
  }
}

export function IsZzAddress(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsZzAddressConstraint,
    });
  };
}

export function TransformZzAddress({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return normalizeAddress(value);
  } catch (error) {
    if (error instanceof InvalidAddressError) {
      return value;
    }
    throw error;
  }
}

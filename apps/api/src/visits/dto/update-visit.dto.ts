import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';
import { VisitOutcome, VisitVia } from '../visit.enums';

/** Used for seeding/tests that need an explicit visitedAt. */
export class UpdateVisitDto {
  @IsOptional()
  @IsMongoId()
  personId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsMongoId()
  siteId?: string;

  @IsOptional()
  @Transform(TransformZzAddress)
  @IsZzAddress()
  address?: string;

  @IsOptional()
  @IsEnum(VisitOutcome)
  outcome?: VisitOutcome;

  @IsOptional()
  @IsEnum(VisitVia)
  via?: VisitVia;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  visitedAt?: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

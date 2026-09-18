import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';
import { VisitOutcome, VisitVia } from '../visit.enums';

export class CreateVisitDto {
  @IsMongoId()
  personId!: string;

  @IsOptional()
  @IsMongoId()
  siteId?: string;

  @Transform(TransformZzAddress)
  @IsZzAddress()
  address!: string;

  @IsEnum(VisitOutcome)
  outcome!: VisitOutcome;

  @IsEnum(VisitVia)
  via!: VisitVia;

  @Type(() => Date)
  @IsDate()
  visitedAt!: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

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

export class UpdateVisitDto {
  @IsOptional()
  @IsMongoId()
  personId?: string;

  @IsOptional()
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

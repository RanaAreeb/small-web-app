import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';
import { VisitOutcome, VisitVia } from '../visit.enums';

export class CreateVisitDto {
  @IsMongoId()
  personId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsMongoId()
  siteId?: string;

  @Transform(TransformZzAddress)
  @IsZzAddress()
  address!: string;

  @IsEnum(VisitOutcome)
  outcome!: VisitOutcome;

  @IsEnum(VisitVia)
  via!: VisitVia;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

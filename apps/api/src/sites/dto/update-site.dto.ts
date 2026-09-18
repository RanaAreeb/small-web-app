import { Transform } from 'class-transformer';
import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';
import { MAX_TITLE_LENGTH } from '../html.util';

export class UpdateSiteDto {
  @IsOptional()
  @Transform(TransformZzAddress)
  @IsZzAddress()
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TITLE_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  html?: string;

  @IsOptional()
  @IsMongoId()
  authorId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

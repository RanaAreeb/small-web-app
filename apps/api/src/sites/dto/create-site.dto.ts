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

export class CreateSiteDto {
  @Transform(TransformZzAddress)
  @IsZzAddress()
  address!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TITLE_LENGTH)
  title!: string;

  /** Raw HTML from the client; never stored or returned unsanitized. */
  @IsString()
  @MinLength(1)
  html!: string;

  @IsMongoId()
  authorId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

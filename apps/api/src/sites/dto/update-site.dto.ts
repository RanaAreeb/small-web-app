import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';

export class UpdateSiteDto {
  @IsOptional()
  @Transform(TransformZzAddress)
  @IsZzAddress()
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  sanitizedHtml?: string;

  @IsOptional()
  @IsString()
  searchableText?: string;

  @IsOptional()
  @IsMongoId()
  authorId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

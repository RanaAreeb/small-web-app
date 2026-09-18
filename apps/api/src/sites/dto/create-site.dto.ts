import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { IsZzAddress, TransformZzAddress } from '../../common';

export class CreateSiteDto {
  @Transform(TransformZzAddress)
  @IsZzAddress()
  address!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  sanitizedHtml!: string;

  @IsString()
  searchableText!: string;

  @IsMongoId()
  authorId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

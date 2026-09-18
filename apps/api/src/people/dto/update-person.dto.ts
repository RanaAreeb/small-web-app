import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  seedKey?: string;
}

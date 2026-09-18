import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from '../people/schemas/person.schema';
import { SearchController } from './search.controller';
import { Site, SiteSchema } from './schemas/site.schema';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Site.name, schema: SiteSchema },
      { name: Person.name, schema: PersonSchema },
    ]),
  ],
  controllers: [SitesController, SearchController],
  providers: [SitesService],
  exports: [MongooseModule, SitesService],
})
export class SitesModule {}

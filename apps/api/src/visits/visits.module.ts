import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from '../people/schemas/person.schema';
import { Site, SiteSchema } from '../sites/schemas/site.schema';
import { Visit, VisitSchema } from './schemas/visit.schema';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Site.name, schema: SiteSchema },
    ]),
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [MongooseModule, VisitsService],
})
export class VisitsModule {}

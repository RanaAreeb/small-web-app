import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisitsModule } from '../visits/visits.module';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { Person, PersonSchema } from './schemas/person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
    VisitsModule,
  ],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [MongooseModule, PeopleService],
})
export class PeopleModule {}

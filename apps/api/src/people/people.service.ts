import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonSummary } from '../visits/dto/visit-response.dto';
import { Person, PersonDocument } from './schemas/person.schema';

@Injectable()
export class PeopleService {
  constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
  ) {}

  async list(): Promise<PersonSummary[]> {
    const people = await this.personModel
      .find()
      .sort({ name: 1, slug: 1 })
      .exec();

    return people.map((person) => ({
      id: String(person._id),
      name: person.name,
      slug: person.slug,
    }));
  }
}

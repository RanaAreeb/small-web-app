import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PeopleService } from './people.service';
import { Person } from './schemas/person.schema';

describe('PeopleService', () => {
  let service: PeopleService;
  let personModel: { find: jest.Mock };

  beforeEach(async () => {
    personModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeopleService,
        { provide: getModelToken(Person.name), useValue: personModel },
      ],
    }).compile();

    service = module.get(PeopleService);
  });

  it('lists people with id, name and slug', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId('507f1f77bcf86cd799439011'), name: 'Ada', slug: 'ada' },
        { _id: new Types.ObjectId('507f1f77bcf86cd799439012'), name: 'Ben', slug: 'ben' },
      ]),
    };
    personModel.find.mockReturnValue(chain);

    await expect(service.list()).resolves.toEqual([
      { id: '507f1f77bcf86cd799439011', name: 'Ada', slug: 'ada' },
      { id: '507f1f77bcf86cd799439012', name: 'Ben', slug: 'ben' },
    ]);
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema';
import { Site } from './schemas/site.schema';
import { SitesService } from './sites.service';

describe('SitesService', () => {
  let service: SitesService;
  let siteModel: {
    exists: jest.Mock;
    create: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let personModel: {
    findById: jest.Mock;
    find: jest.Mock;
  };

  const authorId = new Types.ObjectId();
  const author = {
    _id: authorId,
    name: 'Ada',
    slug: 'ada',
  };

  beforeEach(async () => {
    siteModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    personModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: getModelToken(Site.name), useValue: siteModel },
        { provide: getModelToken(Person.name), useValue: personModel },
      ],
    }).compile();

    service = module.get(SitesService);
  });

  describe('publish', () => {
    it('returns 409 for a duplicate address', async () => {
      siteModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });

      await expect(
        service.publish({
          address: 'home.zz',
          title: 'Home',
          html: '<p>Hello</p>',
          authorId: String(authorId),
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(siteModel.create).not.toHaveBeenCalled();
    });

    it('returns 404 when the author does not exist', async () => {
      siteModel.exists.mockResolvedValue(null);
      personModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.publish({
          address: 'home.zz',
          title: 'Home',
          html: '<p>Hello</p>',
          authorId: String(authorId),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('stores sanitized HTML only', async () => {
      siteModel.exists.mockResolvedValue(null);
      personModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(author),
      });
      siteModel.create.mockImplementation(async (doc: Record<string, unknown>) => ({
        ...doc,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.publish({
        address: 'Home.ZZ',
        title: 'Home',
        html: '<p onclick="x()">Hello</p><script>bad()</script>',
        authorId: String(authorId),
      });

      expect(siteModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'home.zz',
          sanitizedHtml: expect.not.stringMatching(/script|onclick/i),
        }),
      );
      expect(result.sanitizedHtml).not.toMatch(/script|onclick/i);
      expect(result.author).toEqual({
        id: String(authorId),
        name: 'Ada',
        slug: 'ada',
      });
    });
  });
});

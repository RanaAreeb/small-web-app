import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Person } from '../people/schemas/person.schema';
import { Site } from '../sites/schemas/site.schema';
import { encodeHistoryCursor } from './history-cursor';
import { Visit } from './schemas/visit.schema';
import { VisitOutcome, VisitVia } from './visit.enums';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  let service: VisitsService;
  let visitModel: {
    create: jest.Mock;
    find: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };
  let personModel: {
    findById: jest.Mock;
  };
  let siteModel: {
    findById: jest.Mock;
    find: jest.Mock;
  };

  const personAId = new Types.ObjectId();
  const personBId = new Types.ObjectId();
  const siteId = new Types.ObjectId();

  const personA = { _id: personAId, name: 'Ada', slug: 'ada' };
  const personB = { _id: personBId, name: 'Ben', slug: 'ben' };
  const site = {
    _id: siteId,
    address: 'garden.zz',
    title: 'Garden',
  };

  beforeEach(async () => {
    visitModel = {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    personModel = {
      findById: jest.fn(),
    };
    siteModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: getModelToken(Visit.name), useValue: visitModel },
        { provide: getModelToken(Person.name), useValue: personModel },
        { provide: getModelToken(Site.name), useValue: siteModel },
      ],
    }).compile();

    service = module.get(VisitsService);
  });

  function mockFindById(
    model: { findById: jest.Mock },
    value: unknown,
  ): void {
    model.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(value),
    });
  }

  function mockHistoryFind(results: unknown[]): void {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(results),
    };
    visitModel.find.mockReturnValue(chain);
  }

  describe('create', () => {
    it('records repeat visits without deduplicating', async () => {
      mockFindById(personModel, personA);
      mockFindById(siteModel, site);

      const firstId = new Types.ObjectId();
      const secondId = new Types.ObjectId();
      visitModel.create
        .mockResolvedValueOnce({
          _id: firstId,
          personId: personAId,
          siteId,
          address: 'garden.zz',
          outcome: VisitOutcome.Shown,
          via: VisitVia.Typed,
          visitedAt: new Date('2026-01-01T10:00:00.000Z'),
        })
        .mockResolvedValueOnce({
          _id: secondId,
          personId: personAId,
          siteId,
          address: 'garden.zz',
          outcome: VisitOutcome.Shown,
          via: VisitVia.Typed,
          visitedAt: new Date('2026-01-01T10:01:00.000Z'),
        });

      const first = await service.create({
        personId: String(personAId),
        siteId: String(siteId),
        address: 'garden.zz',
        outcome: VisitOutcome.Shown,
        via: VisitVia.Typed,
      });
      const second = await service.create({
        personId: String(personAId),
        siteId: String(siteId),
        address: 'garden.zz',
        outcome: VisitOutcome.Shown,
        via: VisitVia.Typed,
      });

      expect(visitModel.create).toHaveBeenCalledTimes(2);
      expect(first.id).not.toBe(second.id);
      expect(first.address).toBe('garden.zz');
      expect(second.address).toBe('garden.zz');
    });

    it('allows missing-address visits without a siteId', async () => {
      mockFindById(personModel, personA);
      visitModel.create.mockResolvedValue({
        _id: new Types.ObjectId(),
        personId: personAId,
        address: 'missing.zz',
        outcome: VisitOutcome.NotFound,
        via: VisitVia.Typed,
        visitedAt: new Date('2026-01-01T10:00:00.000Z'),
      });

      const visit = await service.create({
        personId: String(personAId),
        address: 'missing.zz',
        outcome: VisitOutcome.NotFound,
        via: VisitVia.Typed,
      });

      expect(visitModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'missing.zz',
          outcome: VisitOutcome.NotFound,
          personId: personAId,
        }),
      );
      expect(visit.site).toBeNull();
      expect(visit.outcome).toBe(VisitOutcome.NotFound);
      expect(siteModel.findById).not.toHaveBeenCalled();
    });

    it('rejects an unknown person', async () => {
      mockFindById(personModel, null);

      await expect(
        service.create({
          personId: String(personAId),
          address: 'home.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an unknown siteId when provided', async () => {
      mockFindById(personModel, personA);
      mockFindById(siteModel, null);

      await expect(
        service.create({
          personId: String(personAId),
          siteId: String(siteId),
          address: 'garden.zz',
          outcome: VisitOutcome.Shown,
          via: VisitVia.Link,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('uses server time for visitedAt', async () => {
      mockFindById(personModel, personA);
      const before = Date.now();
      visitModel.create.mockImplementation(async (doc: { visitedAt: Date }) => ({
        _id: new Types.ObjectId(),
        ...doc,
      }));

      await service.create({
        personId: String(personAId),
        address: 'home.zz',
        outcome: VisitOutcome.NotFound,
        via: VisitVia.Typed,
      });

      const created = visitModel.create.mock.calls[0][0] as { visitedAt: Date };
      expect(created.visitedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(created.visitedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getHistory', () => {
    it('keeps separate histories for two people', async () => {
      mockFindById(personModel, personA);
      mockHistoryFind([
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          address: 'ada.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);
      siteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const historyA = await service.getHistory(String(personAId));
      expect(visitModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          personId: personAId,
        }),
      );
      expect(historyA.items).toHaveLength(1);
      expect(historyA.items[0]?.address).toBe('ada.zz');

      mockFindById(personModel, personB);
      mockHistoryFind([
        {
          _id: new Types.ObjectId(),
          personId: personBId,
          address: 'ben.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);

      const historyB = await service.getHistory(String(personBId));
      expect(visitModel.find).toHaveBeenLastCalledWith(
        expect.objectContaining({
          personId: personBId,
        }),
      );
      expect(historyB.items[0]?.address).toBe('ben.zz');
    });

    it('includes missing addresses in history', async () => {
      mockFindById(personModel, personA);
      mockHistoryFind([
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          address: 'ghost.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ]);
      siteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const history = await service.getHistory(String(personAId));

      expect(history.items).toEqual([
        expect.objectContaining({
          address: 'ghost.zz',
          outcome: VisitOutcome.NotFound,
          site: null,
        }),
      ]);
      expect(history.nextCursor).toBeUndefined();
    });

    it('returns repeat visits as separate history items', async () => {
      mockFindById(personModel, personA);
      const sharedVisitedAt = new Date('2026-01-02T00:00:00.000Z');
      mockHistoryFind([
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          siteId,
          address: 'garden.zz',
          outcome: VisitOutcome.Shown,
          via: VisitVia.Typed,
          visitedAt: sharedVisitedAt,
        },
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          siteId,
          address: 'garden.zz',
          outcome: VisitOutcome.Shown,
          via: VisitVia.History,
          visitedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);
      siteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([site]),
      });

      const history = await service.getHistory(String(personAId));

      expect(history.items).toHaveLength(2);
      expect(history.items.every((item) => item.address === 'garden.zz')).toBe(
        true,
      );
      expect(history.items[0]?.site?.title).toBe('Garden');
    });

    it('paginates stably when timestamps are equal using _id', async () => {
      mockFindById(personModel, personA);

      const visitedAt = new Date('2026-01-02T12:00:00.000Z');
      const newerId = new Types.ObjectId();
      const olderId = new Types.ObjectId();
      // Ensure newerId > olderId lexicographically/ObjectId time isn't required;
      // we control sort order via mock return order (newest first).
      const firstPage = [
        {
          _id: newerId,
          personId: personAId,
          address: 'one.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt,
        },
        {
          _id: olderId,
          personId: personAId,
          address: 'two.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt,
        },
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          address: 'three.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt,
        },
      ];

      mockHistoryFind(firstPage);
      siteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const page = await service.getHistory(String(personAId), undefined, 2);

      expect(page.items).toHaveLength(2);
      expect(page.items.map((item) => item.address)).toEqual([
        'one.zz',
        'two.zz',
      ]);
      expect(page.nextCursor).toBe(
        encodeHistoryCursor(visitedAt, String(olderId)),
      );

      const cursor = page.nextCursor!;
      mockHistoryFind([
        {
          _id: new Types.ObjectId(),
          personId: personAId,
          address: 'three.zz',
          outcome: VisitOutcome.NotFound,
          via: VisitVia.Typed,
          visitedAt,
        },
      ]);

      const nextPage = await service.getHistory(String(personAId), cursor, 2);

      expect(visitModel.find).toHaveBeenLastCalledWith({
        personId: personAId,
        $or: [
          { visitedAt: { $lt: visitedAt } },
          {
            visitedAt,
            _id: { $lt: new Types.ObjectId(olderId) },
          },
        ],
      });
      expect(nextPage.items[0]?.address).toBe('three.zz');
      expect(nextPage.nextCursor).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes a visit by id', async () => {
      const visitId = new Types.ObjectId();
      visitModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: visitId }),
      });

      await expect(service.remove(String(visitId))).resolves.toBeUndefined();
      expect(visitModel.findByIdAndDelete).toHaveBeenCalledWith(String(visitId));
    });

    it('returns 404 when the visit is missing', async () => {
      const visitId = new Types.ObjectId();
      visitModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(String(visitId))).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

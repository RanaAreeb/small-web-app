import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { normalizeAddress } from '../common/address';
import { Person, PersonDocument } from '../people/schemas/person.schema';
import { Site, SiteDocument } from '../sites/schemas/site.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import {
  HistoryResponse,
  VisitResponse,
  VisitSiteSummary,
} from './dto/visit-response.dto';
import { decodeHistoryCursor, encodeHistoryCursor } from './history-cursor';
import { Visit, VisitDocument } from './schemas/visit.schema';

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>,
  ) {}

  async create(dto: CreateVisitDto): Promise<VisitResponse> {
    const person = await this.personModel.findById(dto.personId).exec();
    if (!person) {
      throw new NotFoundException(`Person not found for id '${dto.personId}'`);
    }

    const address = normalizeAddress(dto.address);
    let site: SiteDocument | null = null;

    if (dto.siteId) {
      site = await this.siteModel.findById(dto.siteId).exec();
      if (!site) {
        throw new NotFoundException(`Site not found for id '${dto.siteId}'`);
      }
    }

    const visit = await this.visitModel.create({
      personId: person._id,
      ...(site ? { siteId: site._id } : {}),
      address,
      outcome: dto.outcome,
      via: dto.via,
      visitedAt: new Date(),
      ...(dto.seedKey ? { seedKey: dto.seedKey } : {}),
    });

    return this.toVisitResponse(visit, site);
  }

  async getHistory(
    personId: string,
    cursor?: string,
    limit = 30,
  ): Promise<HistoryResponse> {
    if (!Types.ObjectId.isValid(personId)) {
      throw new NotFoundException(`Person not found for id '${personId}'`);
    }

    const person = await this.personModel.findById(personId).exec();
    if (!person) {
      throw new NotFoundException(`Person not found for id '${personId}'`);
    }

    const cappedLimit = Math.min(Math.max(limit, 1), 100);
    const filter: FilterQuery<VisitDocument> = {
      personId: new Types.ObjectId(personId),
    };

    if (cursor) {
      const decoded = decodeHistoryCursor(cursor);
      filter.$or = [
        { visitedAt: { $lt: decoded.visitedAt } },
        {
          visitedAt: decoded.visitedAt,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    }

    const visits = await this.visitModel
      .find(filter)
      .sort({ visitedAt: -1, _id: -1 })
      .limit(cappedLimit + 1)
      .exec();

    const hasMore = visits.length > cappedLimit;
    const page = hasMore ? visits.slice(0, cappedLimit) : visits;

    const siteIds = [
      ...new Set(
        page
          .map((visit) => (visit.siteId ? String(visit.siteId) : null))
          .filter((id): id is string => Boolean(id)),
      ),
    ].map((id) => new Types.ObjectId(id));

    const sites = siteIds.length
      ? await this.siteModel.find({ _id: { $in: siteIds } }).exec()
      : [];
    const sitesById = new Map(sites.map((site) => [String(site._id), site]));

    const items = page.map((visit) => {
      const site = visit.siteId
        ? (sitesById.get(String(visit.siteId)) ?? null)
        : null;
      return this.toVisitResponse(visit, site);
    });

    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last
        ? encodeHistoryCursor(last.visitedAt, String(last._id))
        : undefined;

    return {
      items,
      ...(nextCursor ? { nextCursor } : {}),
    };
  }

  private toVisitResponse(
    visit: VisitDocument,
    site: SiteDocument | null,
  ): VisitResponse {
    return {
      id: String(visit._id),
      personId: String(visit.personId),
      address: visit.address,
      outcome: visit.outcome,
      via: visit.via,
      visitedAt: visit.visitedAt,
      site: site ? this.toSiteSummary(site) : null,
    };
  }

  private toSiteSummary(site: SiteDocument): VisitSiteSummary {
    return {
      id: String(site._id),
      address: site.address,
      title: site.title,
    };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InvalidAddressError, normalizeAddress } from '../common/address';
import { Person, PersonDocument } from '../people/schemas/person.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import {
  AuthorResponse,
  SearchResultResponse,
  SiteResponse,
} from './dto/site-response.dto';
import {
  assertHtmlSizeLimit,
  buildSearchSnippet,
  extractSearchableText,
  sanitizeSiteHtml,
} from './html.util';
import { Site, SiteDocument } from './schemas/site.schema';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
  ) {}

  async publish(dto: CreateSiteDto): Promise<SiteResponse> {
    const address = normalizeAddress(dto.address);

    const existing = await this.siteModel.exists({ address });
    if (existing) {
      throw new ConflictException(`Site already exists for address '${address}'`);
    }

    const author = await this.personModel.findById(dto.authorId).exec();
    if (!author) {
      throw new NotFoundException(`Author not found for id '${dto.authorId}'`);
    }

    try {
      assertHtmlSizeLimit(dto.html);
    } catch {
      throw new PayloadTooLargeException(
        `HTML must be at most ${100 * 1024} bytes`,
      );
    }

    const sanitizedHtml = sanitizeSiteHtml(dto.html);
    const searchableText = extractSearchableText(sanitizedHtml);

    const site = await this.siteModel.create({
      address,
      title: dto.title.trim(),
      sanitizedHtml,
      searchableText,
      authorId: author._id,
      ...(dto.seedKey ? { seedKey: dto.seedKey } : {}),
    });

    return this.toSiteResponse(site, author);
  }

  async resolve(rawAddress: string): Promise<SiteResponse> {
    let address: string;
    try {
      address = normalizeAddress(rawAddress);
    } catch (error) {
      if (error instanceof InvalidAddressError) {
        throw new NotFoundException({
          statusCode: 404,
          message: `Site not found for address '${rawAddress}'`,
          error: 'Not Found',
        });
      }
      throw error;
    }

    const site = await this.siteModel.findOne({ address }).exec();
    if (!site) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Site not found for address '${address}'`,
        error: 'Not Found',
      });
    }

    const author = await this.personModel.findById(site.authorId).exec();
    if (!author) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Site not found for address '${address}'`,
        error: 'Not Found',
      });
    }

    return this.toSiteResponse(site, author);
  }

  async search(q: string, limit = 20): Promise<SearchResultResponse[]> {
    const cappedLimit = Math.min(Math.max(limit, 1), 50);

    const sites = await this.siteModel
      .find(
        { $text: { $search: q } },
        {
          score: { $meta: 'textScore' },
          address: 1,
          title: 1,
          searchableText: 1,
          authorId: 1,
        },
      )
      .sort({ score: { $meta: 'textScore' }, address: 1 })
      .limit(cappedLimit)
      .exec();

    const authorIds = [
      ...new Set(sites.map((site) => String(site.authorId))),
    ].map((id) => new Types.ObjectId(id));

    const authors = await this.personModel
      .find({ _id: { $in: authorIds } })
      .exec();
    const authorsById = new Map(
      authors.map((author) => [String(author._id), author]),
    );

    return sites.flatMap((site) => {
      const author = authorsById.get(String(site.authorId));
      if (!author) {
        return [];
      }

      return [
        {
          address: site.address,
          title: site.title,
          author: this.toAuthorResponse(author),
          snippet: buildSearchSnippet(site.searchableText),
        },
      ];
    });
  }

  private toAuthorResponse(author: PersonDocument): AuthorResponse {
    return {
      id: String(author._id),
      name: author.name,
      slug: author.slug,
    };
  }

  private toSiteResponse(
    site: SiteDocument,
    author: PersonDocument,
  ): SiteResponse {
    const createdAt = (site as SiteDocument & { createdAt?: Date }).createdAt;
    const updatedAt = (site as SiteDocument & { updatedAt?: Date }).updatedAt;

    return {
      address: site.address,
      title: site.title,
      sanitizedHtml: site.sanitizedHtml,
      author: this.toAuthorResponse(author),
      ...(createdAt ? { createdAt } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    };
  }
}

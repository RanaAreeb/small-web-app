import { existsSync, readFileSync } from 'fs';
import mongoose, { Model } from 'mongoose';
import { resolve } from 'path';
import { Person, PersonSchema } from '../people/schemas/person.schema';
import {
  extractSearchableText,
  sanitizeSiteHtml,
} from '../sites/html.util';
import { Site, SiteSchema } from '../sites/schemas/site.schema';
import { Visit, VisitSchema } from '../visits/schemas/visit.schema';
import {
  SEED_PEOPLE,
  SEED_PREFIX,
  SEED_SITES,
  SEED_VISITS,
} from './data';

export type SeedSummary = {
  peopleCount: number;
  siteCount: number;
  seededVisitCount: number;
  seededPeopleCount: number;
  seededSiteCount: number;
  seededAddresses: string[];
};

function loadEnvFiles(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(__dirname, '../../.env'),
    resolve(__dirname, '../../../.env'),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) {
      continue;
    }

    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const eq = trimmed.indexOf('=');
      if (eq <= 0) {
        continue;
      }

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function getModels() {
  const PersonModel =
    (mongoose.models[Person.name] as Model<Person>) ||
    mongoose.model<Person>(Person.name, PersonSchema);
  const SiteModel =
    (mongoose.models[Site.name] as Model<Site>) ||
    mongoose.model<Site>(Site.name, SiteSchema);
  const VisitModel =
    (mongoose.models[Visit.name] as Model<Visit>) ||
    mongoose.model<Visit>(Visit.name, VisitSchema);

  return { PersonModel, SiteModel, VisitModel };
}

export async function runSeed(): Promise<SeedSummary> {
  loadEnvFiles();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to run the seed command');
  }

  const shouldClose =
    mongoose.connection.readyState === 0
      ? await mongoose.connect(uri).then(() => true)
      : false;

  try {
    const { PersonModel, SiteModel, VisitModel } = getModels();

    const peopleBySlug = new Map<string, { _id: mongoose.Types.ObjectId }>();

    for (const person of SEED_PEOPLE) {
      const doc = await PersonModel.findOneAndUpdate(
        { seedKey: person.seedKey },
        {
          $set: {
            name: person.name,
            slug: person.slug,
            seedKey: person.seedKey,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();

      if (!doc) {
        throw new Error(`Failed to upsert person ${person.slug}`);
      }

      peopleBySlug.set(person.slug, { _id: doc._id as mongoose.Types.ObjectId });
    }

    const sitesByAddress = new Map<
      string,
      { _id: mongoose.Types.ObjectId; address: string }
    >();

    for (const site of SEED_SITES) {
      const author = peopleBySlug.get(site.authorSlug);
      if (!author) {
        throw new Error(`Missing author for site ${site.address}`);
      }

      const sanitizedHtml = sanitizeSiteHtml(site.html);
      const searchableText = extractSearchableText(sanitizedHtml);

      const doc = await SiteModel.findOneAndUpdate(
        { seedKey: site.seedKey },
        {
          $set: {
            address: site.address,
            title: site.title,
            sanitizedHtml,
            searchableText,
            authorId: author._id,
            seedKey: site.seedKey,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();

      if (!doc) {
        throw new Error(`Failed to upsert site ${site.address}`);
      }

      sitesByAddress.set(site.address, {
        _id: doc._id as mongoose.Types.ObjectId,
        address: doc.address,
      });
    }

    for (const visit of SEED_VISITS) {
      const person = peopleBySlug.get(visit.personSlug);
      if (!person) {
        throw new Error(`Missing person for visit ${visit.seedKey}`);
      }

      const site = sitesByAddress.get(visit.address);
      const base = {
        personId: person._id,
        address: visit.address,
        outcome: visit.outcome,
        via: visit.via,
        visitedAt: new Date(visit.visitedAt),
        seedKey: visit.seedKey,
      };

      if (site) {
        await VisitModel.findOneAndUpdate(
          { seedKey: visit.seedKey },
          { $set: { ...base, siteId: site._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).exec();
      } else {
        await VisitModel.findOneAndUpdate(
          { seedKey: visit.seedKey },
          { $set: base, $unset: { siteId: 1 } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        ).exec();
      }    }

    const [peopleCount, siteCount, seededVisitCount, seededPeopleCount, seededSiteCount] =
      await Promise.all([
        PersonModel.countDocuments().exec(),
        SiteModel.countDocuments().exec(),
        VisitModel.countDocuments({
          seedKey: { $regex: `^${SEED_PREFIX}` },
        }).exec(),
        PersonModel.countDocuments({
          seedKey: { $regex: `^${SEED_PREFIX}` },
        }).exec(),
        SiteModel.countDocuments({
          seedKey: { $regex: `^${SEED_PREFIX}` },
        }).exec(),
      ]);

    const seededAddresses = SEED_SITES.map((site) => site.address).sort();

    return {
      peopleCount,
      siteCount,
      seededVisitCount,
      seededPeopleCount,
      seededSiteCount,
      seededAddresses,
    };
  } finally {
    if (shouldClose) {
      await mongoose.disconnect();
    }
  }
}

export function printSeedSummary(summary: SeedSummary): void {
  console.log(`people count: ${summary.peopleCount}`);
  console.log(`site count: ${summary.siteCount}`);
  console.log(`seeded visit count: ${summary.seededVisitCount}`);
  console.log('Seed completed successfully.');
}

async function main(): Promise<void> {
  const summary = await runSeed();
  printSeedSummary(summary);
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

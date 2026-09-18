import {
  SEED_PEOPLE,
  SEED_SITES,
  SEED_VISITS,
  SEED_WINDOW_END,
  SEED_WINDOW_START,
} from './data';
import { printSeedSummary, runSeed } from './seed';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyIdempotency(): Promise<void> {
  const browsers = SEED_PEOPLE.filter((person) => person.isBrowser);
  assert(browsers.length === 4, 'Expected exactly 4 browsing people');
  assert(SEED_PEOPLE.length === 5, 'Expected five authors/people total');
  assert(SEED_SITES.length === 10, 'Expected exactly 10 seeded sites');

  for (const site of SEED_SITES) {
    const words = site.html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    assert(
      words.length >= 120,
      `Site ${site.address} has only ${words.length} words`,
    );
  }

  const windowStart = Date.parse(SEED_WINDOW_START);
  const windowEnd = Date.parse(SEED_WINDOW_END);
  for (const visit of SEED_VISITS) {
    const at = Date.parse(visit.visitedAt);
    assert(
      at >= windowStart && at <= windowEnd,
      `Visit ${visit.seedKey} outside one-hour window`,
    );
  }

  const first = await runSeed();
  const second = await runSeed();

  assert(
    first.seededPeopleCount === second.seededPeopleCount,
    'Seeded people count changed on second run',
  );
  assert(
    first.seededSiteCount === second.seededSiteCount,
    'Seeded site count changed on second run',
  );
  assert(
    first.seededVisitCount === second.seededVisitCount,
    'Seeded visit count changed on second run',
  );
  assert(
    first.peopleCount === second.peopleCount,
    'People count changed on second run',
  );
  assert(
    first.siteCount === second.siteCount,
    'Site count changed on second run',
  );
  assert(
    JSON.stringify(first.seededAddresses) ===
      JSON.stringify(second.seededAddresses),
    'Seeded addresses changed on second run',
  );
  assert(first.seededPeopleCount === 5, 'Expected 5 seeded people');
  assert(first.seededSiteCount === 10, 'Expected 10 seeded sites');
  assert(
    first.seededVisitCount === SEED_VISITS.length,
    `Expected ${SEED_VISITS.length} seeded visits`,
  );

  printSeedSummary(second);
  console.log('Idempotency verification passed.');
}

if (require.main === module) {
  void verifyIdempotency().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

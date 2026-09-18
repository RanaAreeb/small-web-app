import { readFileSync } from 'fs';
import { join } from 'path';
import {
  SEED_PEOPLE,
  SEED_SITES,
  SEED_VISITS,
  SEED_WINDOW_END,
  SEED_WINDOW_START,
} from './data';

function proseWordCount(html: string): number {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

describe('seed data', () => {
  it('defines four browsing people and five authors', () => {
    expect(SEED_PEOPLE.filter((person) => person.isBrowser)).toHaveLength(4);
    expect(SEED_PEOPLE).toHaveLength(5);
    expect(SEED_PEOPLE.map((person) => person.name)).toEqual(
      expect.arrayContaining([
        'Ada Mercer',
        'Jon Bell',
        'Priya Shah',
        'Malik Reed',
        'Nora Quinn',
      ]),
    );
  });

  it('defines ten sites with at least 120 words each', () => {
    expect(SEED_SITES).toHaveLength(10);

    for (const site of SEED_SITES) {
      expect(proseWordCount(site.html)).toBeGreaterThanOrEqual(120);
    }
  });

  it('assigns at least two authors more than one site', () => {
    const counts = new Map<string, number>();
    for (const site of SEED_SITES) {
      counts.set(site.authorSlug, (counts.get(site.authorSlug) ?? 0) + 1);
    }

    const multiOwners = [...counts.values()].filter((count) => count > 1);
    expect(counts.size).toBe(5);
    expect(multiOwners.length).toBeGreaterThanOrEqual(2);
  });

  it('keeps visits inside the fixed one-hour window', () => {
    const start = Date.parse(SEED_WINDOW_START);
    const end = Date.parse(SEED_WINDOW_END);

    for (const visit of SEED_VISITS) {
      const at = Date.parse(visit.visitedAt);
      expect(at).toBeGreaterThanOrEqual(start);
      expect(at).toBeLessThanOrEqual(end);
    }
  });

  it('includes ada coverage, repeats, a five-entry trail, and not_found', () => {
    const ada = SEED_VISITS.filter((visit) => visit.personSlug === 'ada-mercer');
    const adaAddresses = new Set(ada.map((visit) => visit.address));
    const siteAddresses = new Set(SEED_SITES.map((site) => site.address));

    for (const address of siteAddresses) {
      expect(adaAddresses.has(address)).toBe(true);
    }

    expect(ada.some((visit) => visit.outcome === 'not_found')).toBe(true);

    const tidepoolVisits = ada.filter((visit) => visit.address === 'tidepool.zz');
    expect(tidepoolVisits.length).toBeGreaterThan(1);

    const trail = ada
      .slice(0, 5)
      .map((visit) => `${visit.via}:${visit.address}`);
    expect(trail).toEqual([
      'typed:tidepool.zz',
      'link:nighttrain.zz',
      'link:paperkite.zz',
      'link:observatory.zz',
      'link:moss-library.zz',
    ]);
  });

  it('keeps stable seedKeys on every seeded document', () => {
    const keys = [
      ...SEED_PEOPLE.map((person) => person.seedKey),
      ...SEED_SITES.map((site) => site.seedKey),
      ...SEED_VISITS.map((visit) => visit.seedKey),
    ];

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key.startsWith('seed:'))).toBe(true);
  });

  it('ships a malicious HTML fixture for later e2e use', () => {
    const fixture = readFileSync(
      join(__dirname, '../sites/fixtures/malicious.html'),
      'utf8',
    );
    expect(fixture).toContain('<script>');
  });
});

import { VisitOutcome, VisitVia } from '../visits/visit.enums';

export const SEED_PREFIX = 'seed:';

export type SeedPerson = {
  seedKey: string;
  name: string;
  slug: string;
  isBrowser: boolean;
};

export type SeedSite = {
  seedKey: string;
  address: string;
  title: string;
  authorSlug: string;
  html: string;
};

export type SeedVisit = {
  seedKey: string;
  personSlug: string;
  address: string;
  outcome: VisitOutcome;
  via: VisitVia;
  visitedAt: string;
};

/** Fixed one-hour browsing window (deterministic). */
export const SEED_WINDOW_START = '2024-06-15T14:00:00.000Z';
export const SEED_WINDOW_END = '2024-06-15T15:00:00.000Z';

export const SEED_PEOPLE: SeedPerson[] = [
  {
    seedKey: `${SEED_PREFIX}person:ada-mercer`,
    name: 'Ada Mercer',
    slug: 'ada-mercer',
    isBrowser: true,
  },
  {
    seedKey: `${SEED_PREFIX}person:jon-bell`,
    name: 'Jon Bell',
    slug: 'jon-bell',
    isBrowser: true,
  },
  {
    seedKey: `${SEED_PREFIX}person:priya-shah`,
    name: 'Priya Shah',
    slug: 'priya-shah',
    isBrowser: true,
  },
  {
    seedKey: `${SEED_PREFIX}person:malik-reed`,
    name: 'Malik Reed',
    slug: 'malik-reed',
    isBrowser: true,
  },
  {
    seedKey: `${SEED_PREFIX}person:nora-quinn`,
    name: 'Nora Quinn',
    slug: 'nora-quinn',
    isBrowser: false,
  },
];

function page(
  style: string,
  title: string,
  links: Array<{ href: string; label: string }>,
  paragraphs: string[],
): string {
  const linkList = links
    .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
    .join('');
  const body = paragraphs.map((p) => `<p>${p}</p>`).join('\n');

  return `<style>${style}</style>
<section>
  <h1>${title}</h1>
  ${body}
  <h2>Nearby</h2>
  <ul>
    ${linkList}
  </ul>
</section>`;
}

export const SEED_SITES: SeedSite[] = [
  {
    seedKey: `${SEED_PREFIX}site:tidepool.zz`,
    address: 'tidepool.zz',
    title: 'Tidepool Journal',
    authorSlug: 'ada-mercer',
    html: page(
      `section{font-family:Georgia,"Times New Roman",serif;color:#16324f;background:#eef6fb;padding:1.5rem;line-height:1.7}
h1{font-size:1.9rem;letter-spacing:0.02em;border-bottom:2px solid #7eb6d9;padding-bottom:0.4rem}
h2{font-size:1.1rem;color:#2f5f7e;margin-top:1.5rem}
a{color:#0b6e99;text-decoration:underline}`,
      'Tidepool Journal',
      [
        { href: 'nighttrain.zz', label: 'Night Train Notes' },
        { href: 'fieldnotes.zz', label: 'Field Notes Desk' },
      ],
      [
        'The morning tide leaves a thin silver rim on the stones, and the pool that forms between them becomes a temporary archive. Shells settle into quiet ranks. A ribbon of kelp writes a cursive line that vanishes when the next wave arrives. Visitors who arrive early enough can watch the water clarify, as if the day itself were rinsing grit from its eyes and preparing a clean page.',
        'I keep this journal for the small web because the pool teaches a useful craft: attention without ownership. You cannot keep the tide. You can only notice what it brings, name it carefully, and leave room for the next arrival. That is how neighborhoods of .zz addresses should feel—open thresholds, readable prose, and links that behave like stepping stones rather than funnels.',
        'Today the pool held a glass float, two crab shells nested like bowls, and a feather that refused to sink. I sketched them in the margin of a notebook and then walked the path toward the night train platform, where the air always smells faintly of iron and rain. If you want a different weather of thought, follow the links nearby and keep your footsteps light.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:nighttrain.zz`,
    address: 'nighttrain.zz',
    title: 'Night Train Notes',
    authorSlug: 'ada-mercer',
    html: page(
      `section{font-family:"Trebuchet MS",Verdana,sans-serif;color:#f4efe6;background:#1b1f2a;padding:1.75rem;line-height:1.65}
h1{font-size:1.8rem;color:#f0c36a;margin-bottom:0.75rem}
h2{color:#9fb4d9;font-size:1.05rem}
a{color:#8fd3ff}
p{max-width:42rem}`,
      'Night Train Notes',
      [
        { href: 'paperkite.zz', label: 'Paper Kite Studio' },
        { href: 'ghostport.zz', label: 'Ghostport (missing)' },
      ],
      [
        'After midnight the local train runs half empty, and the windows become dark mirrors interrupted by brief stations of light. Someone always brings a thermos. Someone always falls asleep against a backpack. The rhythm is dependable without being loud, which makes it an ideal place to draft messages that do not need an audience yet.',
        'These notes collect overheard fragments and the soft geometry of seats facing seats. A paper ticket curls in a coat pocket. The conductor’s flashlight draws a narrow cone across scuffed flooring. Outside, warehouses pass like closed parentheses. Inside, the car holds a temporary commons where strangers share silence with surprising courtesy.',
        'If you are mapping the small web tonight, ride with me as far as the paper kite studio, where daylight ideas are folded into flight. There is also a link toward ghostport, an address that never quite resolves—useful as a reminder that not every door on the network opens, and that missing places still belong in a honest history of wandering.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:fieldnotes.zz`,
    address: 'fieldnotes.zz',
    title: 'Field Notes Desk',
    authorSlug: 'nora-quinn',
    html: page(
      `section{font-family:Arial,Helvetica,sans-serif;color:#243018;background:#f3f0e4;padding:1.4rem 1.6rem;border-left:6px solid #6b8f3c;line-height:1.7}
h1{font-size:1.7rem;text-transform:uppercase;letter-spacing:0.08em}
h2{font-size:1rem;color:#4d6230}
a{color:#2f5d1a;font-weight:600}
p{margin:0.85rem 0}`,
      'Field Notes Desk',
      [
        { href: 'observatory.zz', label: 'Observatory Annex' },
        { href: 'nowhere.zz', label: 'Nowhere (missing)' },
      ],
      [
        'The desk faces a window that never fully closes, so drafts arrive with pollen, grit, and the occasional moth. Field notes thrive in that kind of porous room. You write what you saw before the memory edits itself into a neater story. Dates matter. Weather matters. The names of plants matter even when you misspell them on the first try.',
        'This page is a clearinghouse for observations gathered between tidepool mornings and observatory nights. A cracked seedpod. A chalk arrow on asphalt. The way fog softens the edges of a radio tower until it looks almost polite. I pin each note beside a link so later walkers can continue the route without inheriting my conclusions.',
        'If you follow the path to the observatory annex, bring patience; the lenses there reward people who wait. The other link points to nowhere, an intentionally broken door on this desk. Broken doors teach calibration: the browser should record the attempt, show a clear absence, and let you turn back without drama.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:paperkite.zz`,
    address: 'paperkite.zz',
    title: 'Paper Kite Studio',
    authorSlug: 'jon-bell',
    html: page(
      `section{font-family:"Palatino Linotype",Palatino,serif;color:#4a2c17;background:linear-gradient(#fff8ef,#f7e6cf);padding:1.6rem;line-height:1.75}
h1{font-size:2rem;font-weight:normal;border-bottom:1px dashed #c48a4a;padding-bottom:0.35rem}
h2{color:#8a5a2b;font-size:1.15rem}
a{color:#a8541a}`,
      'Paper Kite Studio',
      [{ href: 'observatory.zz', label: 'Observatory Annex' }],
      [
        'We build kites from scrap paper, cotton string, and the kind of optimism that survives light rain. The studio smells like glue and orange peels. On windy afternoons the doorway fills with neighbors who want to watch a first launch, even when the kite only climbs as high as the second-story laundry lines.',
        'Folding is a quiet engineering. Creases become spars. A torn corner becomes a vent. Failure is expected and useful: a kite that spins teaches you about balance faster than a kite that behaves. The small web could learn from that ethic—publish imperfect pages, revise in public, and treat broken links as weather rather than scandal.',
        'When the wind settles, we put the kites away and walk toward the observatory annex, where the sky is studied with more patience than spectacle. Take the link if you want a longer horizon. Leave a note on the bench if you borrowed string. The studio stays unlocked for anyone who returns the tools cleaner than they found them.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:observatory.zz`,
    address: 'observatory.zz',
    title: 'Observatory Annex',
    authorSlug: 'jon-bell',
    html: page(
      `section{font-family:Verdana,Geneva,sans-serif;color:#dce7ff;background:#0d1b2a;padding:1.8rem;line-height:1.7}
h1{font-size:1.85rem;color:#b8f2e6}
h2{color:#7f9fc7;font-size:1.05rem;margin-top:1.4rem}
a{color:#ffd166}
p{letter-spacing:0.01em}`,
      'Observatory Annex',
      [
        { href: 'moss-library.zz', label: 'Moss Library' },
        { href: 'signalgarden.zz', label: 'Signal Garden' },
      ],
      [
        'The annex is smaller than the main dome, which is precisely why regulars prefer it. You can hear the shutter motors click. You can smell cold metal and coffee. Charts of last month’s cloud cover hang beside a chalkboard that still carries someone’s half-erased joke about Jupiter’s storms.',
        'Observation here is less about conquest and more about returning. The same patch of sky visited nightly becomes a familiar room. Satellites streak through like hurried messengers. A faint nebula waits behind light pollution like a watercolor left in rain. We write logs that future selves can trust because they include doubt.',
        'From this annex you can step into the moss library for slow reading, or into the signal garden where antennas lean among herbs. Both places keep different clocks. Bring a jacket either way; clear nights are colder than forecasts admit, and good questions rarely arrive fully dressed.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:moss-library.zz`,
    address: 'moss-library.zz',
    title: 'Moss Library',
    authorSlug: 'priya-shah',
    html: page(
      `section{font-family:Georgia,serif;color:#1f3320;background:#e5efe3;padding:1.5rem;line-height:1.8}
h1{font-size:1.75rem;color:#234f2a}
h2{font-size:1.1rem;color:#3f6b45}
a{color:#1b6b45;border-bottom:1px solid #8fbf98;text-decoration:none}
blockquote{margin:1rem 0;padding-left:1rem;border-left:3px solid #7aa67f;color:#35553a}`,
      'Moss Library',
      [{ href: 'rainroom.zz', label: 'Rain Room' }],
      [
        'Shelves here are low on purpose so that damp air and readers stay near the ground, where moss prefers to live. Books arrive with soft corners. Cards in the catalog are written in pencil because reclassification is considered a living practice rather than a bureaucratic defeat.',
        'The collection favors field guides, quiet novels, and pamphlets printed in editions smaller than a classroom. You may borrow anything if you leave a note describing the weather when you finish. That rule has produced an accidental climate diary in the margins of our ledger, which visiting scholars now cite with affectionate seriousness.',
        'When the roof begins to tick with rain, most of us migrate next door to the rain room to listen properly. Follow the link when you are ready. Leave the desk lamp on for the next person; the moss library believes illumination should be communal, and darkness is only for the shelves that need rest.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:signalgarden.zz`,
    address: 'signalgarden.zz',
    title: 'Signal Garden',
    authorSlug: 'malik-reed',
    html: page(
      `section{font-family:"Courier New",Courier,monospace;color:#102418;background:#f7fff2;padding:1.35rem;line-height:1.6}
h1{font-size:1.55rem;background:#d9f5c8;display:inline-block;padding:0.2rem 0.45rem}
h2{font-size:1rem;color:#2f6b3a}
a{color:#0b6b3c;text-decoration:none;border-bottom:2px solid #8fd19e}`,
      'Signal Garden',
      [{ href: 'paperkite.zz', label: 'Paper Kite Studio' }],
      [
        'Between the rosemary and the rain tank, a row of small antennas tracks weather balloons and amateur packets. The gardeners call the beds by frequency. Basil grows beside a stake labeled for local chat. Thyme surrounds a coil that hums only when fog arrives, as if the plants and the radio agreed on a shared mood.',
        'Signal here means more than transmission. It means a wave of the hand across the fence, a note clipped to a tomato cage, a beacon that says the neighborhood is awake. We publish packet logs stripped of personal detail and keep the raw noise for compost metaphors. Nothing is optimized; everything is tended.',
        'If your browser needs a lighter page after all this soil and static, cross to the paper kite studio. The air is clearer there, and the strings are easier to hold. Come back when you want the smell of crushed leaves mixed with solder—an acquired taste, like strong tea and honest footnotes.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:rainroom.zz`,
    address: 'rainroom.zz',
    title: 'Rain Room',
    authorSlug: 'priya-shah',
    html: page(
      `section{font-family:"Segoe UI",Tahoma,sans-serif;color:#1c2a3a;background:#e8eef5;padding:1.7rem;line-height:1.7}
h1{font-size:1.9rem;color:#24527a;font-weight:600}
h2{color:#4d6f91;font-size:1.1rem}
a{color:#1f5eff}
p{margin-bottom:1rem}`,
      'Rain Room',
      [
        { href: 'lanternpress.zz', label: 'Lantern Press' },
        { href: 'missing-map.zz', label: 'Missing Map (broken)' },
      ],
      [
        'The rain room is not sealed against weather; it is tuned to it. A zinc roof amplifies drops into a readable tempo. Benches face the open side so conversation has to compete with water, which keeps speeches short and listening long. Cups of ginger tea appear without ceremony.',
        'People come here after arguments, after long scrolls, after days when the network felt too bright. The room offers no playlist and no projector. It offers time measured in gutters. Children count seconds between thunder and flash. Elders correct them gently and then admit they once counted the same way.',
        'When the squall thins, take the covered walk to lantern press and warm your hands near the ink. There is also a broken link to a missing map—another deliberate absence. Try it if you need to confirm that not-found pages still leave footprints in history, then return to the sound of water finishing its work.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:lanternpress.zz`,
    address: 'lanternpress.zz',
    title: 'Lantern Press',
    authorSlug: 'malik-reed',
    html: page(
      `section{font-family:Georgia,"Palatino Linotype",serif;color:#2b2118;background:#fff4e5;padding:1.6rem;line-height:1.75}
h1{font-size:1.8rem;color:#8a3b12}
h2{font-size:1.05rem;color:#a05a2c}
a{color:#9c2f00}
em{color:#6b3f22}`,
      'Lantern Press',
      [{ href: 'kettleclub.zz', label: 'Kettle Club' }],
      [
        'We print chapbooks in editions that fit inside a coat. The press is old enough to need coaxing and young enough to still surprise us with clean impressions. Ink settles into cotton paper like night settling into streets. Titles are short. Colophons are tender. Every copy includes a blank page for the reader’s reply.',
        'Lantern light is the house style: enough brightness to read by, never enough to bleach the room. That is also our editorial rule for the small web. Prefer sentences that carry warmth. Prefer links that earn their glow. Prefer margins wide enough for disagreement to sit without knocking over the lamp.',
        'After the rollers rest, we walk to the kettle club where the evening is measured in steeps rather than deadlines. Bring a draft if you have one. Bring silence if you do not. The press will be here in the morning, smelling faintly of citrus cleaner and ambition that learned manners.',
      ],
    ),
  },
  {
    seedKey: `${SEED_PREFIX}site:kettleclub.zz`,
    address: 'kettleclub.zz',
    title: 'Kettle Club',
    authorSlug: 'ada-mercer',
    html: page(
      `section{font-family:"Lucida Sans",Arial,sans-serif;color:#3b2f2f;background:#f9f1ea;padding:1.5rem;line-height:1.7;border-radius:12px}
h1{font-size:1.7rem;color:#6d3b2e}
h2{color:#8b5e4b;font-size:1.05rem}
a{color:#a14a2b;font-weight:600}
ul{padding-left:1.2rem}`,
      'Kettle Club',
      [{ href: 'tidepool.zz', label: 'Tidepool Journal' }],
      [
        'Membership requires only that you rinse your cup. The club meets whenever the kettle sings, which is to say it meets continuously in overlapping shifts. Topics range from ferry schedules to the ethics of unfinished essays. Nobody keeps minutes, but somebody always remembers who takes honey and who takes none.',
        'Steam softens faces. Chipped mugs become familiar characters. A shelf of abandoned paperbacks circulates without a librarian. On cold nights the windows fog until the street outside looks like a rumor. This is where browsing histories turn into stories people are willing to tell out loud.',
        'When you are ready to begin again, the tidepool journal is a short walk and a single link away. The water there will have changed since morning, which is the point. Finish your tea. Leave the chair squared. Carry whatever warmth you can back into the wider .zz weather.',
      ],
    ),
  },
];

/**
 * Fixed browsing history across SEED_WINDOW_START..END.
 * Includes Ada's long trail, repeats, and one not_found.
 */
export const SEED_VISITS: SeedVisit[] = [
  // Ada — five-entry trail (and continues)
  {
    seedKey: `${SEED_PREFIX}visit:ada-01`,
    personSlug: 'ada-mercer',
    address: 'tidepool.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:02:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-02`,
    personSlug: 'ada-mercer',
    address: 'nighttrain.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:05:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-03`,
    personSlug: 'ada-mercer',
    address: 'paperkite.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:08:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-04`,
    personSlug: 'ada-mercer',
    address: 'observatory.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:11:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-05`,
    personSlug: 'ada-mercer',
    address: 'moss-library.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:14:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-06`,
    personSlug: 'ada-mercer',
    address: 'rainroom.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:17:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-07`,
    personSlug: 'ada-mercer',
    address: 'lanternpress.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:20:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-08`,
    personSlug: 'ada-mercer',
    address: 'kettleclub.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:23:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-09`,
    personSlug: 'ada-mercer',
    address: 'tidepool.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:26:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-10`,
    personSlug: 'ada-mercer',
    address: 'fieldnotes.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:29:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-11`,
    personSlug: 'ada-mercer',
    address: 'observatory.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:32:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-12`,
    personSlug: 'ada-mercer',
    address: 'signalgarden.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:35:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-13`,
    personSlug: 'ada-mercer',
    address: 'paperkite.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:38:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-14`,
    personSlug: 'ada-mercer',
    address: 'ghostport.zz',
    outcome: VisitOutcome.NotFound,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:41:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-15`,
    personSlug: 'ada-mercer',
    address: 'nighttrain.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.History,
    visitedAt: '2024-06-15T14:44:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:ada-16`,
    personSlug: 'ada-mercer',
    address: 'moss-library.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Search,
    visitedAt: '2024-06-15T14:50:00.000Z',
  },
  // Jon
  {
    seedKey: `${SEED_PREFIX}visit:jon-01`,
    personSlug: 'jon-bell',
    address: 'paperkite.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:10:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:jon-02`,
    personSlug: 'jon-bell',
    address: 'observatory.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:25:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:jon-03`,
    personSlug: 'jon-bell',
    address: 'kettleclub.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:40:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:jon-04`,
    personSlug: 'jon-bell',
    address: 'paperkite.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.History,
    visitedAt: '2024-06-15T14:55:00.000Z',
  },
  // Priya
  {
    seedKey: `${SEED_PREFIX}visit:priya-01`,
    personSlug: 'priya-shah',
    address: 'moss-library.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:15:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:priya-02`,
    personSlug: 'priya-shah',
    address: 'rainroom.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:30:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:priya-03`,
    personSlug: 'priya-shah',
    address: 'lanternpress.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:45:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:priya-04`,
    personSlug: 'priya-shah',
    address: 'signalgarden.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:52:00.000Z',
  },
  // Malik
  {
    seedKey: `${SEED_PREFIX}visit:malik-01`,
    personSlug: 'malik-reed',
    address: 'lanternpress.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:18:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:malik-02`,
    personSlug: 'malik-reed',
    address: 'kettleclub.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:33:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:malik-03`,
    personSlug: 'malik-reed',
    address: 'tidepool.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Link,
    visitedAt: '2024-06-15T14:48:00.000Z',
  },
  {
    seedKey: `${SEED_PREFIX}visit:malik-04`,
    personSlug: 'malik-reed',
    address: 'nighttrain.zz',
    outcome: VisitOutcome.Shown,
    via: VisitVia.Typed,
    visitedAt: '2024-06-15T14:58:00.000Z',
  },
];

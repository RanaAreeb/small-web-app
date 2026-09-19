export type Author = {
  id: string;
  name: string;
  slug: string;
};

export type Person = {
  id: string;
  name: string;
  slug: string;
};

export type Site = {
  address: string;
  title: string;
  sanitizedHtml: string;
  author: Author;
  createdAt?: string;
  updatedAt?: string;
};

export type SearchResult = {
  address: string;
  title: string;
  author: Author;
  snippet: string;
};

export type VisitOutcome = 'shown' | 'not_found';

export type VisitVia =
  | 'typed'
  | 'link'
  | 'search'
  | 'history'
  | 'back'
  | 'forward'
  | 'publish';

export type VisitSiteSummary = {
  id: string;
  address: string;
  title: string;
};

export type Visit = {
  id: string;
  personId: string;
  address: string;
  outcome: VisitOutcome;
  via: VisitVia;
  visitedAt: string;
  site: VisitSiteSummary | null;
};

export type HistoryPage = {
  items: Visit[];
  nextCursor?: string;
};

export type PublishSiteInput = {
  address: string;
  title: string;
  html: string;
  authorId: string;
};

export type CreateVisitInput = {
  personId: string;
  address: string;
  outcome: VisitOutcome;
  via: VisitVia;
  siteId?: string;
};

export type HealthResponse = {
  status: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Duck-typed check — safer than `instanceof` across Next.js bundles. */
export function isApiError(error: unknown): error is ApiError {
  if (error instanceof ApiError) {
    return true;
  }
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { name?: unknown; status?: unknown };
  return candidate.name === 'ApiError' && typeof candidate.status === 'number';
}

import { VisitOutcome, VisitVia } from '../visit.enums';

export type PersonSummary = {
  id: string;
  name: string;
  slug: string;
};

export type VisitSiteSummary = {
  id: string;
  address: string;
  title: string;
};

export type VisitResponse = {
  id: string;
  personId: string;
  address: string;
  outcome: VisitOutcome;
  via: VisitVia;
  visitedAt: Date;
  site: VisitSiteSummary | null;
};

export type HistoryResponse = {
  items: VisitResponse[];
  nextCursor?: string;
};

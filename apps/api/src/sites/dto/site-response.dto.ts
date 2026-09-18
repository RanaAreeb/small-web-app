export type AuthorResponse = {
  id: string;
  name: string;
  slug: string;
};

export type SiteResponse = {
  address: string;
  title: string;
  sanitizedHtml: string;
  author: AuthorResponse;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SearchResultResponse = {
  address: string;
  title: string;
  author: AuthorResponse;
  snippet: string;
};

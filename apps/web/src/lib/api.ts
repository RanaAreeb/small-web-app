import {
  ApiError,
  CreateVisitInput,
  HealthResponse,
  HistoryPage,
  Person,
  PublishSiteInput,
  SearchResult,
  Site,
  Visit,
} from '@/types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers:
      options.body === undefined
        ? undefined
        : {
            'Content-Type': 'application/json',
          },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }

    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      (typeof (body as { message: unknown }).message === 'string' ||
        Array.isArray((body as { message: unknown }).message))
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join(', ')
          : String((body as { message: string }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    return request<HealthResponse>('/health', { signal });
  },

  listPeople(signal?: AbortSignal): Promise<Person[]> {
    return request<Person[]>('/people', { signal });
  },

  resolveSite(address: string, signal?: AbortSignal): Promise<Site> {
    return request<Site>(`/sites/${encodeURIComponent(address)}`, { signal });
  },

  search(
    q: string,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q });
    if (typeof limit === 'number') {
      params.set('limit', String(limit));
    }
    return request<SearchResult[]>(`/search?${params.toString()}`, { signal });
  },

  createVisit(input: CreateVisitInput, signal?: AbortSignal): Promise<Visit> {
    return request<Visit>('/visits', {
      method: 'POST',
      body: input,
      signal,
    });
  },

  deleteVisit(visitId: string, signal?: AbortSignal): Promise<void> {
    return request<void>(`/visits/${encodeURIComponent(visitId)}`, {
      method: 'DELETE',
      signal,
    });
  },

  getHistory(
    personId: string,
    options: { cursor?: string; limit?: number; signal?: AbortSignal } = {},
  ): Promise<HistoryPage> {
    const params = new URLSearchParams();
    if (options.cursor) {
      params.set('cursor', options.cursor);
    }
    if (typeof options.limit === 'number') {
      params.set('limit', String(options.limit));
    }
    const query = params.toString();
    return request<HistoryPage>(
      `/people/${encodeURIComponent(personId)}/history${query ? `?${query}` : ''}`,
      { signal: options.signal },
    );
  },

  publishSite(input: PublishSiteInput, signal?: AbortSignal): Promise<Site> {
    return request<Site>('/sites', {
      method: 'POST',
      body: input,
      signal,
    });
  },
};

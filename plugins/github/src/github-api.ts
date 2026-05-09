/**
 * GitHub API Client for the Volt GitHub Plugin
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  forks: number;
  language: string | null;
  updated_at: string;
  topics: string[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  comments: number;
  pull_request?: { html_url: string };
  repository_url: string;
}

export interface GitHubGist {
  id: string;
  html_url: string;
  description: string | null;
  public: boolean;
  files: Record<string, { language: string | null; size: number }>;
  created_at: string;
  updated_at: string;
  owner: { login: string };
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

type CacheEntry = { data: unknown; expiresAt: number };

export function formatStars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export class GitHubAPI {
  private baseUrl = 'https://api.github.com';
  private rateLimitRemaining = 60;
  private rateLimitReset = 0;

  // TTL-based in-memory cache (keyed by serialized request)
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 30_000; // 30 s

  getRateLimitRemaining(): number {
    return this.rateLimitRemaining;
  }

  isRateLimited(): boolean {
    return this.rateLimitRemaining === 0 && Date.now() / 1000 < this.rateLimitReset;
  }

  private getCacheKey(endpoint: string, params: Record<string, string>): string {
    return endpoint + '?' + JSON.stringify(params);
  }

  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: unknown): void {
    // Evict oldest entry when cache grows large
    if (this.cache.size >= 50) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + this.cacheTtlMs });
  }

  private async request(endpoint: string, params?: Record<string, string>): Promise<unknown> {
    const cacheKey = this.getCacheKey(endpoint, params ?? {});
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }
    }

    // Authorization is injected by Volt's authenticated fetch proxy in Rust —
    // the token never crosses the Worker boundary.
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    const response = await fetch(url.toString(), { headers });

    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);
    const reset = response.headers.get('X-RateLimit-Reset');
    if (reset) this.rateLimitReset = parseInt(reset, 10);

    if (response.status === 401) {
      throw new Error('GitHub token invalid or expired — update it in extension preferences');
    }
    if (response.status === 403) {
      const retryAfter = response.headers.get('Retry-After');
      const msg = retryAfter
        ? `Rate limited — retry in ${retryAfter}s`
        : 'Rate limited (60 req/hr unauthenticated) — add a token to get 5 000/hr';
      throw new Error(msg);
    }
    if (response.status === 422) {
      throw new Error('Invalid search query — check GitHub search syntax');
    }
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    this.setCache(cacheKey, data);
    return data;
  }

  async searchRepositories(query: string, limit = 10): Promise<GitHubRepo[]> {
    const data = await this.request('/search/repositories', {
      q: query || 'stars:>1000',
      sort: 'stars',
      order: 'desc',
      per_page: String(limit),
    }) as { items?: unknown[] };

    return (data.items ?? []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        id: i.id as number,
        name: i.name as string,
        full_name: i.full_name as string,
        description: (i.description as string | null) ?? null,
        html_url: i.html_url as string,
        stars: i.stargazers_count as number,
        forks: i.forks_count as number,
        language: (i.language as string | null) ?? null,
        updated_at: i.updated_at as string,
        topics: (i.topics as string[]) ?? [],
      };
    });
  }

  async searchIssues(query: string, limit = 10): Promise<GitHubIssue[]> {
    const data = await this.request('/search/issues', {
      q: query || 'is:open',
      sort: 'updated',
      order: 'desc',
      per_page: String(limit),
    }) as { items?: unknown[] };

    return (data.items ?? []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const user = i.user as Record<string, unknown>;
      return {
        id: i.id as number,
        number: i.number as number,
        title: i.title as string,
        body: (i.body as string | null) ?? null,
        html_url: i.html_url as string,
        user: { login: user.login as string, avatar_url: user.avatar_url as string },
        created_at: i.created_at as string,
        updated_at: i.updated_at as string,
        state: i.state as 'open' | 'closed',
        labels: ((i.labels as Array<Record<string, unknown>>) ?? []).map((l) => ({
          name: l.name as string,
          color: l.color as string,
        })),
        comments: i.comments as number,
        pull_request: i.pull_request as { html_url: string } | undefined,
        repository_url: i.repository_url as string,
      };
    });
  }

  async searchGists(query: string, limit = 10): Promise<GitHubGist[]> {
    const data = await this.request('/search/gists', {
      q: query || '',
      sort: 'updated',
      order: 'desc',
      per_page: String(limit),
    }) as { items?: unknown[] };

    return (data.items ?? []).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const owner = (i.owner as Record<string, unknown>) ?? {};
      return {
        id: i.id as string,
        html_url: i.html_url as string,
        description: (i.description as string | null) ?? null,
        public: i.public as boolean,
        files: i.files as Record<string, { language: string | null; size: number }>,
        created_at: i.created_at as string,
        updated_at: i.updated_at as string,
        owner: { login: owner.login as string },
      };
    });
  }

  async getTrendingRepositories(language?: string, limit = 10): Promise<GitHubRepo[]> {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const dateStr = date.toISOString().split('T')[0];
    let q = `created:>${dateStr} sort:stars stars:>50`;
    if (language) q += ` language:${language}`;
    return this.searchRepositories(q, limit);
  }

  async getUserRepos(username: string, limit = 10): Promise<GitHubRepo[]> {
    const data = await this.request(`/users/${encodeURIComponent(username)}/repos`, {
      sort: 'stars',
      direction: 'desc',
      per_page: String(limit),
      type: 'owner',
    });

    if (!Array.isArray(data)) return [];

    return (data as unknown[]).map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        id: i.id as number,
        name: i.name as string,
        full_name: i.full_name as string,
        description: (i.description as string | null) ?? null,
        html_url: i.html_url as string,
        stars: i.stargazers_count as number,
        forks: i.forks_count as number,
        language: (i.language as string | null) ?? null,
        updated_at: i.updated_at as string,
        topics: (i.topics as string[]) ?? [],
      };
    });
  }

  async getUser(username: string): Promise<GitHubUser | null> {
    try {
      const data = await this.request(`/users/${encodeURIComponent(username)}`);
      const i = data as Record<string, unknown>;
      return {
        login: i.login as string,
        name: (i.name as string | null) ?? null,
        avatar_url: i.avatar_url as string,
        html_url: i.html_url as string,
        bio: (i.bio as string | null) ?? null,
        public_repos: i.public_repos as number,
        followers: i.followers as number,
        following: i.following as number,
      };
    } catch {
      return null;
    }
  }
}

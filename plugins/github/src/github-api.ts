/**
 * GitHub API Client for the Volt GitHub Plugin
 * Supports searching repositories, issues, pull requests, and gists
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  language: string | null;
  updated_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: {
    login: string;
  };
  created_at: string;
  state: "open" | "closed";
  pull_request?: {
    html_url: string;
  };
}

export interface GitHubGist {
  id: string;
  html_url: string;
  description: string | null;
  public: boolean;
  files: Record<string, { language: string | null }>;
  created_at: string;
}

export class GitHubAPI {
  private baseUrl = "https://api.github.com";
  private token?: string;
  private rateLimit = 60; // Unauthenticated: 60 req/hour
  private rateLimitRemaining = 60;

  constructor(token?: string) {
    this.token = token;
    if (token) {
      this.rateLimit = 5000; // Authenticated: 5000 req/hour
    }
  }

  private async fetch(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Volt-GitHub-Plugin",
    };

    if (this.token) {
      headers.Authorization = `token ${this.token}`;
    }

    try {
      const response = await fetch(url.toString(), { headers });

      // Track rate limit
      const remaining = response.headers.get("X-RateLimit-Remaining");
      if (remaining) {
        this.rateLimitRemaining = parseInt(remaining, 10);
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("GitHub API fetch error:", error);
      throw error;
    }
  }

  /**
   * Search repositories by query
   * Examples: "type:repo nodejs", "language:rust stars:>1000"
   */
  async searchRepositories(query: string, limit: number = 10): Promise<GitHubRepo[]> {
    try {
      const response = await this.fetch("/search/repositories", {
        q: query || "stars:>1000",
        sort: "stars",
        order: "desc",
        per_page: limit.toString(),
      });

      return (response.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        description: item.description,
        html_url: item.html_url,
        stars: item.stargazers_count,
        language: item.language,
        updated_at: item.updated_at,
      }));
    } catch (error) {
      console.error("Error searching repositories:", error);
      return [];
    }
  }

  /**
   * Search issues and pull requests
   * Examples: "is:pr author:torvalds", "is:issue label:bug", "repo:torvalds/linux type:issue"
   */
  async searchIssues(query: string, limit: number = 10): Promise<GitHubIssue[]> {
    try {
      const response = await this.fetch("/search/issues", {
        q: query || "is:open",
        sort: "updated",
        order: "desc",
        per_page: limit.toString(),
      });

      return (response.items || []).map((item: any) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body,
        html_url: item.html_url,
        user: { login: item.user.login },
        created_at: item.created_at,
        state: item.state,
        pull_request: item.pull_request,
      }));
    } catch (error) {
      console.error("Error searching issues:", error);
      return [];
    }
  }

  /**
   * Search gists
   * Examples: "filename:package.json", "language:python", "user:torvalds"
   */
  async searchGists(query: string, limit: number = 10): Promise<GitHubGist[]> {
    try {
      const response = await this.fetch("/search/gists", {
        q: query || "",
        sort: "updated",
        order: "desc",
        per_page: limit.toString(),
      });

      return (response.items || []).map((item: any) => ({
        id: item.id,
        html_url: item.html_url,
        description: item.description,
        public: item.public,
        files: item.files,
        created_at: item.created_at,
      }));
    } catch (error) {
      console.error("Error searching gists:", error);
      return [];
    }
  }

  /**
   * Get trending repositories (via search API)
   * Gets popular repos from the past month
   */
  async getTrendingRepositories(language?: string, limit: number = 10): Promise<GitHubRepo[]> {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Last 30 days
    const dateStr = date.toISOString().split("T")[0];

    let query = `created:>${dateStr} sort:stars stars:>100`;
    if (language) {
      query += ` language:${language}`;
    }

    return this.searchRepositories(query, limit);
  }

  /**
   * Get user information and public repositories
   */
  async getUserRepos(username: string, limit: number = 10): Promise<GitHubRepo[]> {
    try {
      const response = await this.fetch(`/users/${username}/repos`, {
        sort: "stars",
        order: "desc",
        per_page: limit.toString(),
      });

      if (!Array.isArray(response)) {
        return [];
      }

      return response.map((item: any) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        description: item.description,
        html_url: item.html_url,
        stars: item.stargazers_count,
        language: item.language,
        updated_at: item.updated_at,
      }));
    } catch (error) {
      console.error(`Error fetching repos for user ${username}:`, error);
      return [];
    }
  }

  /**
   * Get remaining rate limit
   */
  getRateLimitRemaining(): number {
    return this.rateLimitRemaining;
  }
}

/**
 * GitHub GraphQL client — uses Volt's proxied fetch (sandbox-safe).
 *
 * Provides richer data than the REST search API:
 *  - PR: isDraft, reviewDecision, statusCheckRollup (CI state), headRefName
 *  - Issue: stateReason (completed/not_planned), linkedBranches, milestone
 */

export type ReviewDecision = 'REVIEW_REQUIRED' | 'CHANGES_REQUESTED' | 'APPROVED' | null;
export type CheckState = 'SUCCESS' | 'FAILURE' | 'ERROR' | 'PENDING' | 'EXPECTED' | null;
export type IssueStateReason = 'COMPLETED' | 'NOT_PLANNED' | 'REOPENED' | null;

export interface GQLPullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  merged: boolean;
  closed: boolean;
  updatedAt: string;
  reviewDecision: ReviewDecision;
  headRefName: string;
  repository: { nameWithOwner: string };
  author: { login: string } | null;
  comments: { totalCount: number };
  checkState: CheckState;
}

export interface GQLIssue {
  id: string;
  number: number;
  title: string;
  url: string;
  closed: boolean;
  stateReason: IssueStateReason;
  updatedAt: string;
  repository: { nameWithOwner: string };
  author: { login: string } | null;
  milestone: { title: string } | null;
  comments: { totalCount: number };
  labels: Array<{ name: string }>;
  linkedBranch: string | null;
}

export interface GQLNotification {
  id: string;
  unread: boolean;
  reason: string;
  updatedAt: string;
  subject: {
    type: string;
    title: string;
    url: string | null;
  };
  repository: {
    fullName: string;
    htmlUrl: string;
  };
}

// GraphQL fragments
const PR_FIELDS = `
  fragment PRFields on PullRequest {
    id number title url isDraft merged closed updatedAt reviewDecision headRefName
    repository { nameWithOwner }
    author { login }
    comments(first: 0) { totalCount }
    commits(last: 1) {
      nodes { commit { statusCheckRollup { state } } }
    }
  }
`;

const ISSUE_FIELDS = `
  fragment IssueFields on Issue {
    id number title url closed stateReason updatedAt
    repository { nameWithOwner }
    author { login }
    milestone { title }
    comments(first: 0) { totalCount }
    labels(first: 5) { nodes { name } }
    linkedBranches(first: 1) { nodes { ref { name } } }
  }
`;

export class GitHubGraphQL {
  private readonly endpoint = 'https://api.github.com/graphql';
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly cacheTtlMs = 30_000;

  private async post<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const cacheKey = query + JSON.stringify(variables);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) return cached.data as T;

    // Authorization is injected by Volt's authenticated fetch proxy in Rust —
    // the token never crosses the Worker boundary.
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('GitHub token invalid or expired');
      if (response.status === 403) throw new Error('Rate limited — add a PAT with `repo` scope');
      throw new Error(`GitHub GraphQL error: ${response.status}`);
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors?.length) {
      const firstError = json.errors[0].message;
      if (firstError.includes('scope')) throw new Error(`Token missing scope: ${firstError}`);
      throw new Error(`GraphQL error: ${firstError}`);
    }

    if (!json.data) throw new Error('Empty GraphQL response');

    if (this.cache.size >= 60) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, { data: json.data, expiresAt: Date.now() + this.cacheTtlMs });

    return json.data;
  }

  private mapPR(node: Record<string, unknown>): GQLPullRequest {
    const commits = node.commits as { nodes: Array<{ commit: { statusCheckRollup: { state: string } | null } }> } | undefined;
    const checkState = (commits?.nodes?.[0]?.commit?.statusCheckRollup?.state ?? null) as CheckState;
    const repo = node.repository as { nameWithOwner: string };
    const author = node.author as { login: string } | null;
    const comments = node.comments as { totalCount: number };
    return {
      id: node.id as string,
      number: node.number as number,
      title: node.title as string,
      url: node.url as string,
      isDraft: node.isDraft as boolean,
      merged: node.merged as boolean,
      closed: node.closed as boolean,
      updatedAt: node.updatedAt as string,
      reviewDecision: (node.reviewDecision as ReviewDecision) ?? null,
      headRefName: node.headRefName as string,
      repository: repo,
      author: author ?? null,
      comments,
      checkState,
    };
  }

  private mapIssue(node: Record<string, unknown>): GQLIssue {
    const repo = node.repository as { nameWithOwner: string };
    const author = node.author as { login: string } | null;
    const milestone = node.milestone as { title: string } | null;
    const labels = (node.labels as { nodes: Array<{ name: string }> })?.nodes ?? [];
    const linkedBranches = (node.linkedBranches as { nodes: Array<{ ref: { name: string } }> })?.nodes ?? [];
    const comments = node.comments as { totalCount: number };
    return {
      id: node.id as string,
      number: node.number as number,
      title: node.title as string,
      url: node.url as string,
      closed: node.closed as boolean,
      stateReason: (node.stateReason as IssueStateReason) ?? null,
      updatedAt: node.updatedAt as string,
      repository: repo,
      author: author ?? null,
      milestone: milestone ?? null,
      comments,
      labels,
      linkedBranch: linkedBranches[0]?.ref?.name ?? null,
    };
  }

  async searchPullRequests(query: string, limit = 10): Promise<GQLPullRequest[]> {
    const gql = `
      ${PR_FIELDS}
      query($q: String!, $n: Int!) {
        search(query: $q, type: ISSUE, first: $n) {
          nodes { ...PRFields }
        }
      }
    `;
    const data = await this.post<{ search: { nodes: unknown[] } }>(gql, { q: query, n: limit });
    return (data.search.nodes as Record<string, unknown>[]).map((n) => this.mapPR(n));
  }

  async searchIssues(query: string, limit = 10): Promise<GQLIssue[]> {
    const gql = `
      ${ISSUE_FIELDS}
      query($q: String!, $n: Int!) {
        search(query: $q, type: ISSUE, first: $n) {
          nodes { ...IssueFields }
        }
      }
    `;
    const data = await this.post<{ search: { nodes: unknown[] } }>(gql, { q: query, n: limit });
    return (data.search.nodes as Record<string, unknown>[]).map((n) => this.mapIssue(n));
  }

  /**
   * My open PRs — sectioned: Open / Review Requested / Assigned / Mentioned.
   * Runs parallel GraphQL queries, same pattern as Raycast.
   */
  async myPullRequests(limit = 8): Promise<{
    open: GQLPullRequest[];
    reviewRequested: GQLPullRequest[];
    assigned: GQLPullRequest[];
    mentioned: GQLPullRequest[];
  }> {
    const base = 'is:pr archived:false is:open sort:updated-desc';
    const [open, reviewRequested, assigned, mentioned] = await Promise.all([
      this.searchPullRequests(`${base} author:@me draft:false`, limit),
      this.searchPullRequests(`${base} user-review-requested:@me draft:false`, limit),
      this.searchPullRequests(`${base} assignee:@me`, limit),
      this.searchPullRequests(`${base} mentions:@me`, limit),
    ]);

    // Deduplicate across sections by PR id (same pattern as Raycast)
    const seen = new Set<string>();
    function dedup(prs: GQLPullRequest[]): GQLPullRequest[] {
      return prs.filter((pr) => {
        if (seen.has(pr.id)) return false;
        seen.add(pr.id);
        return true;
      });
    }

    return {
      open: dedup(open),
      reviewRequested: dedup(reviewRequested),
      assigned: dedup(assigned),
      mentioned: dedup(mentioned),
    };
  }

  /**
   * My open issues — sectioned: Open (authored) / Assigned / Mentioned.
   */
  async myIssues(limit = 8): Promise<{
    open: GQLIssue[];
    assigned: GQLIssue[];
    mentioned: GQLIssue[];
  }> {
    const base = 'is:issue archived:false is:open sort:updated-desc';
    const [open, assigned, mentioned] = await Promise.all([
      this.searchIssues(`${base} author:@me`, limit),
      this.searchIssues(`${base} assignee:@me`, limit),
      this.searchIssues(`${base} mentions:@me`, limit),
    ]);

    const seen = new Set<string>();
    function dedup(issues: GQLIssue[]): GQLIssue[] {
      return issues.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
    }

    return {
      open: dedup(open),
      assigned: dedup(assigned),
      mentioned: dedup(mentioned),
    };
  }
}

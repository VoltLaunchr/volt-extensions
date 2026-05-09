/**
 * GitHub Plugin for Volt — v1.2.0
 *
 * Commands:
 *   gh: <query>              → search repos (default)
 *   gh: repos <query>        → search repositories
 *   gh: issues <query>       → search issues (GraphQL — state reason, milestone)
 *   gh: pr <query>           → search pull requests (GraphQL — draft/review/CI)
 *   gh: gists <query>        → search gists
 *   gh: trending [lang]      → trending repos (last 30 days)
 *   gh: user:<username>      → user profile + repos
 *   gh: my prs               → my open PRs (Open / Review Requested / Assigned / Mentioned)
 *   gh: my issues            → my open issues (Open / Assigned / Mentioned)
 *   gh: my repos             → my most recently pushed repos
 *   gh: notifs               → unread notifications
 *   gh: setup token <pat>    → save GitHub PAT (needs repo + notifications + read:user)
 *
 * Sort qualifiers (append to any repo/issue/pr search):
 *   sort:stars  sort:newest  sort:oldest  sort:comments  sort:reactions  sort:updated
 */

declare const VoltAPI: {
  utils: { openUrl: (url: string) => void };
  showToast: (opts: { message: string; style?: 'info' | 'success' | 'error'; duration?: number }) => void;
  saveCredential: (service: string, token: string) => void;
};

declare const PluginResultType: Record<string, string>;

import { GitHubAPI, formatStars, GitHubRepo } from './github-api';
import { GitHubGraphQL, GQLPullRequest, GQLIssue, ReviewDecision, CheckState } from './github-graphql';

interface PluginResultAccessory {
  icon?: string;
  text?: string;
  color?: string;
  tag?: boolean;
}

interface PluginContext { query: string }

interface PluginResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  score: number;
  data?: Record<string, unknown>;
  accessories?: PluginResultAccessory[];
  section?: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  canHandle(ctx: PluginContext): boolean;
  match(ctx: PluginContext): Promise<PluginResult[]>;
  execute(result: PluginResult): void | Promise<void>;
}

const RESULT_TYPE = 'info';

// ── Language colors (GitHub palette) ─────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', 'C++': '#f34b7d', C: '#555555',
  Java: '#b07219', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
  'C#': '#178600', PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051', Vue: '#41b883', Dart: '#00B4AB', Scala: '#c22d40',
  Elixir: '#6e4a7e', Haskell: '#5e5086', 'Objective-C': '#438eff',
};

// ── Date formatting ───────────────────────────────────────────────────────────
function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// ── Status helpers (Raycast patterns) ─────────────────────────────────────────
function prStatusDot(pr: GQLPullRequest): string {
  if (pr.merged) return '🟣';
  if (pr.closed) return '🔴';
  if (pr.isDraft) return '⚫';
  return '🟢';
}

function reviewDecisionAcc(rd: ReviewDecision): PluginResultAccessory | null {
  switch (rd) {
    case 'APPROVED': return { icon: '✅', color: '#22c55e' };
    case 'CHANGES_REQUESTED': return { icon: '🔄', color: '#f97316' };
    case 'REVIEW_REQUIRED': return { icon: '👁', color: '#eab308' };
    default: return null;
  }
}

function checkStateAcc(state: CheckState): PluginResultAccessory | null {
  switch (state) {
    case 'SUCCESS': return { icon: '✅', color: '#22c55e' };
    case 'FAILURE': case 'ERROR': return { icon: '❌', color: '#ef4444' };
    case 'PENDING': case 'EXPECTED': return { icon: '⏳', color: '#f59e0b' };
    default: return null;
  }
}

function issueStateIcon(issue: GQLIssue): string {
  if (!issue.closed) return '🟢';
  switch (issue.stateReason) {
    case 'COMPLETED': return '🟣';
    case 'NOT_PLANNED': return '⊘';
    default: return '🔴';
  }
}

// Sort qualifier → GitHub search API sort string
const SORT_MAP: Record<string, string> = {
  'sort:stars': 'sort:stars-desc',
  'sort:newest': 'sort:created-desc',
  'sort:oldest': 'sort:created-asc',
  'sort:comments': 'sort:comments-desc',
  'sort:reactions': 'sort:reactions-+1-desc',
  'sort:updated': 'sort:updated-desc',
};
function applySortQualifiers(q: string): string {
  let out = q;
  for (const [k, v] of Object.entries(SORT_MAP)) {
    if (out.includes(k)) out = out.replace(k, v);
  }
  return out;
}

// ── Plugin ────────────────────────────────────────────────────────────────────
export class GitHubPlugin implements Plugin {
  id = 'github';
  name = 'GitHub';
  description = 'Search repos, issues, PRs, gists, notifications — and your own activity';
  enabled = true;

  private api = new GitHubAPI();
  private gql = new GitHubGraphQL();

  canHandle(ctx: PluginContext): boolean {
    const q = ctx.query.toLowerCase().trim();
    return q.startsWith('gh ') || q.startsWith('gh:') || q.startsWith('github ') || q.startsWith('github:');
  }

  private parseQuery(raw: string): { type: string; query: string } {
    let q = raw.trim();
    if (/^gh[: ]/i.test(q)) q = q.slice(3).trim();
    else if (/^github[: ]/i.test(q)) q = q.slice(7).trim();

    const lo = q.toLowerCase();
    if (lo === 'my prs' || lo.startsWith('my prs ')) return { type: 'my-prs', query: q.slice(6).trim() };
    if (lo === 'my issues' || lo.startsWith('my issues ')) return { type: 'my-issues', query: q.slice(9).trim() };
    if (lo === 'my repos' || lo.startsWith('my repos ')) return { type: 'my-repos', query: q.slice(8).trim() };
    if (lo === 'notifs' || lo === 'notifications') return { type: 'notifs', query: '' };
    if (lo.startsWith('repos') && (lo[5] === ' ' || lo[5] === undefined)) return { type: 'repos', query: q.slice(5).trim() };
    if (lo.startsWith('issues') && (lo[6] === ' ' || lo[6] === undefined)) return { type: 'issues', query: q.slice(6).trim() };
    if (lo.startsWith('pr') && (lo[2] === ' ' || lo[2] === undefined)) return { type: 'pr', query: q.slice(2).trim() };
    if (lo.startsWith('gists') && (lo[5] === ' ' || lo[5] === undefined)) return { type: 'gists', query: q.slice(5).trim() };
    if (lo.startsWith('trending')) return { type: 'trending', query: q.slice(8).trim() };
    if (lo.startsWith('user:')) return { type: 'user', query: q.slice(5).trim() };
    if (lo.startsWith('setup token')) return { type: 'setup', query: q.slice(11).trim() };
    return { type: 'repos', query: q };
  }

  async match(ctx: PluginContext): Promise<PluginResult[]> {
    const { type, query } = this.parseQuery(ctx.query);
    try {
      switch (type) {
        case 'repos': return await this.searchRepos(query || 'stars:>1000');
        case 'issues': return await this.searchIssues(query || 'is:open is:issue');
        case 'pr': return await this.searchPRs(query || 'is:open is:pr sort:updated-desc');
        case 'gists': return await this.searchGists(query);
        case 'trending': return await this.getTrending(query || undefined);
        case 'user': return await this.getUserResults(query);
        case 'my-prs': return await this.myPRs();
        case 'my-issues': return await this.myIssues();
        case 'my-repos': return await this.myRepos();
        case 'notifs': return await this.notifications();
        case 'setup': return this.setupResults(query);
        default: return await this.searchRepos(query || 'stars:>1000');
      }
    } catch (err) {
      return [this.errorResult(err)];
    }
  }

  // ── Repos ─────────────────────────────────────────────────────────────────

  private repoAccessories(repo: GitHubRepo): PluginResultAccessory[] {
    const accs: PluginResultAccessory[] = [];
    if (repo.language && LANG_COLORS[repo.language]) {
      accs.push({ text: repo.language, color: LANG_COLORS[repo.language], tag: true });
    } else if (repo.language) {
      accs.push({ text: repo.language, tag: true });
    }
    accs.push({ icon: '⭐', text: formatStars(repo.stars) });
    if (repo.forks > 0) accs.push({ icon: '🍴', text: formatStars(repo.forks) });
    accs.push({ text: relativeDate(repo.updated_at) });
    return accs;
  }

  private async searchRepos(query: string): Promise<PluginResult[]> {
    const repos = await this.api.searchRepositories(applySortQualifiers(query), 10);
    return repos.map((repo, i) => ({
      id: `github-repo-${repo.id}`,
      type: RESULT_TYPE,
      title: repo.full_name,
      subtitle: repo.description ?? 'No description',
      icon: '📦',
      badge: 'Repo',
      score: 100 - i * 4,
      data: { url: repo.html_url },
      accessories: this.repoAccessories(repo),
    }));
  }

  // ── Issues ────────────────────────────────────────────────────────────────

  private issueAccessories(issue: GQLIssue): PluginResultAccessory[] {
    const accs: PluginResultAccessory[] = [];
    for (const label of issue.labels.slice(0, 2)) {
      accs.push({ text: label.name, tag: true });
    }
    if (issue.milestone) accs.push({ icon: '📌', text: issue.milestone.title });
    if (issue.linkedBranch) accs.push({ icon: '🔀', text: issue.linkedBranch });
    accs.push({ icon: '💬', text: String(issue.comments.totalCount), color: issue.comments.totalCount > 0 ? undefined : '#555' });
    accs.push({ text: relativeDate(issue.updatedAt) });
    return accs;
  }

  private async searchIssues(query: string): Promise<PluginResult[]> {
    try {
      const issues = await this.gql.searchIssues(applySortQualifiers(query) + ' is:issue', 10);
      return issues.map((issue, i) => ({
        id: `github-issue-${issue.id}`,
        type: RESULT_TYPE,
        title: `${issueStateIcon(issue)} #${issue.number} ${issue.title}`,
        subtitle: `${issue.repository.nameWithOwner}${issue.author ? ` · ${issue.author.login}` : ''}`,
        icon: issueStateIcon(issue),
        badge: 'Issue',
        score: 100 - i * 4,
        data: { url: issue.url },
        accessories: this.issueAccessories(issue),
      }));
    } catch {
      // GraphQL requires auth — fall back to REST (works unauthenticated)
      const issues = await this.api.searchIssues(query, 10);
      return issues.map((issue, i) => ({
        id: `github-issue-${issue.id}`,
        type: RESULT_TYPE,
        title: `🟢 #${issue.number} ${issue.title}`,
        subtitle: `${issue.repository_url.split('/').slice(-2).join('/')} · ${issue.user.login}`,
        icon: '📋',
        badge: 'Issue',
        score: 100 - i * 4,
        data: { url: issue.html_url },
        accessories: [
          { icon: '💬', text: String(issue.comments) },
          { text: relativeDate(issue.updated_at) },
        ],
      }));
    }
  }

  // ── PRs ───────────────────────────────────────────────────────────────────

  private prAccessories(pr: GQLPullRequest): PluginResultAccessory[] {
    const accs: PluginResultAccessory[] = [];
    const ci = checkStateAcc(pr.checkState);
    if (ci) accs.push(ci);
    const rd = reviewDecisionAcc(pr.reviewDecision);
    if (rd) accs.push(rd);
    if (pr.isDraft) accs.push({ text: 'Draft', color: '#888' });
    accs.push({ icon: '💬', text: String(pr.comments.totalCount), color: pr.comments.totalCount > 0 ? undefined : '#555' });
    accs.push({ text: relativeDate(pr.updatedAt) });
    return accs;
  }

  private async searchPRs(query: string): Promise<PluginResult[]> {
    try {
      const prs = await this.gql.searchPullRequests(query, 10);
      return prs.map((pr, i) => ({
        id: `github-pr-${pr.id}`,
        type: RESULT_TYPE,
        title: `${prStatusDot(pr)} #${pr.number} ${pr.title}`,
        subtitle: `${pr.repository.nameWithOwner}${pr.author ? ` · ${pr.author.login}` : ''}`,
        icon: prStatusDot(pr),
        badge: 'PR',
        score: 100 - i * 4,
        data: { url: pr.url },
        accessories: this.prAccessories(pr),
      }));
    } catch {
      // GraphQL requires auth — fall back to REST
      const issues = await this.api.searchIssues(`is:pr ${query}`, 10);
      return issues.map((issue, i) => ({
        id: `github-pr-${issue.id}`,
        type: RESULT_TYPE,
        title: `🟢 #${issue.number} ${issue.title}`,
        subtitle: `${issue.repository_url.split('/').slice(-2).join('/')} · ${issue.user.login}`,
        icon: '🔀',
        badge: 'PR',
        score: 100 - i * 4,
        data: { url: issue.html_url },
        accessories: [
          { icon: '💬', text: String(issue.comments) },
          { text: relativeDate(issue.updated_at) },
        ],
      }));
    }
  }

  // ── Gists ─────────────────────────────────────────────────────────────────

  private async searchGists(query: string): Promise<PluginResult[]> {
    const gists = await this.api.searchGists(query, 10);
    return gists.map((gist, i) => {
      const fileNames = Object.keys(gist.files).slice(0, 2).join(', ');
      return {
        id: `github-gist-${gist.id}`,
        type: RESULT_TYPE,
        title: gist.description || fileNames || 'Unnamed Gist',
        subtitle: `${gist.owner.login} · ${fileNames}`,
        icon: '📄',
        badge: 'Gist',
        score: 100 - i * 4,
        data: { url: gist.html_url },
        accessories: [
          { text: gist.public ? '🌐 Public' : '🔒 Private' },
          { text: relativeDate(gist.updated_at) },
        ],
      };
    });
  }

  // ── Trending ──────────────────────────────────────────────────────────────

  private async getTrending(language?: string): Promise<PluginResult[]> {
    const repos = await this.api.getTrendingRepositories(language, 10);
    return repos.map((repo, i) => ({
      id: `github-trending-${repo.id}`,
      type: RESULT_TYPE,
      title: repo.full_name,
      subtitle: repo.description ?? 'No description',
      icon: '🔥',
      badge: 'Trending',
      score: 100 - i * 4,
      data: { url: repo.html_url },
      accessories: this.repoAccessories(repo),
    }));
  }

  // ── User ──────────────────────────────────────────────────────────────────

  private async getUserResults(username: string): Promise<PluginResult[]> {
    if (!username) {
      return [{ id: 'github-user-hint', type: RESULT_TYPE, title: 'Type a GitHub username', subtitle: 'e.g. gh: user:torvalds', icon: '👤', score: 50, data: {} }];
    }
    const [user, repos] = await Promise.all([this.api.getUser(username), this.api.getUserRepos(username, 9)]);
    const results: PluginResult[] = [];
    if (user) {
      results.push({
        id: `github-user-profile-${user.login}`,
        type: RESULT_TYPE,
        title: user.name ? `${user.name} (@${user.login})` : `@${user.login}`,
        subtitle: user.bio ?? 'GitHub user',
        icon: '👤',
        badge: 'Profile',
        score: 100,
        data: { url: user.html_url },
        accessories: [
          { icon: '📦', text: String(user.public_repos) },
          { icon: '👥', text: formatStars(user.followers) },
        ],
      });
    }
    repos.forEach((repo, i) => {
      results.push({
        id: `github-user-repo-${repo.id}`,
        type: RESULT_TYPE,
        title: repo.name,
        subtitle: repo.description ?? 'No description',
        icon: '📦',
        badge: 'Repo',
        score: 96 - i * 4,
        data: { url: repo.html_url },
        accessories: this.repoAccessories(repo),
      });
    });
    return results;
  }

  // ── My PRs (GraphQL — sectioned like Raycast) ─────────────────────────────

  private async myPRs(): Promise<PluginResult[]> {
    let sections: Awaited<ReturnType<GitHubGraphQL['myPullRequests']>>;
    try {
      sections = await this.gql.myPullRequests(8);
    } catch {
      return [this.requiresTokenResult('my PRs')];
    }
    const results: PluginResult[] = [];
    let score = 100;

    const push = (prs: GQLPullRequest[], section: string, badge: string) => {
      for (const pr of prs) {
        results.push({
          id: `github-my-pr-${pr.id}`,
          type: RESULT_TYPE,
          title: `${prStatusDot(pr)} #${pr.number} ${pr.title}`,
          subtitle: `${pr.repository.nameWithOwner}${pr.author ? ` · ${pr.author.login}` : ''}`,
          icon: prStatusDot(pr),
          badge,
          score: score--,
          data: { url: pr.url },
          accessories: this.prAccessories(pr),
          section,
        });
      }
    };

    push(sections.open, 'Open', 'PR');
    push(sections.reviewRequested, 'Review Requested', 'PR');
    push(sections.assigned, 'Assigned', 'PR');
    push(sections.mentioned, 'Mentioned', 'PR');

    if (results.length === 0) {
      return [{ id: 'github-my-prs-empty', type: RESULT_TYPE, title: '✅ No open pull requests', subtitle: 'No open PRs authored, assigned, or mentioning you', icon: '✅', score: 50, data: { url: 'https://github.com/pulls' } }];
    }
    return results;
  }

  // ── My Issues (GraphQL — sectioned) ──────────────────────────────────────

  private async myIssues(): Promise<PluginResult[]> {
    let sections: Awaited<ReturnType<GitHubGraphQL['myIssues']>>;
    try {
      sections = await this.gql.myIssues(8);
    } catch {
      return [this.requiresTokenResult('my issues')];
    }
    const results: PluginResult[] = [];
    let score = 100;

    const push = (issues: GQLIssue[], section: string) => {
      for (const issue of issues) {
        results.push({
          id: `github-my-issue-${issue.id}`,
          type: RESULT_TYPE,
          title: `${issueStateIcon(issue)} #${issue.number} ${issue.title}`,
          subtitle: `${issue.repository.nameWithOwner}${issue.author ? ` · ${issue.author.login}` : ''}`,
          icon: issueStateIcon(issue),
          badge: 'Issue',
          score: score--,
          data: { url: issue.url },
          accessories: this.issueAccessories(issue),
          section,
        });
      }
    };

    push(sections.open, 'Open');
    push(sections.assigned, 'Assigned');
    push(sections.mentioned, 'Mentioned');

    if (results.length === 0) {
      return [{ id: 'github-my-issues-empty', type: RESULT_TYPE, title: '✅ No open issues', subtitle: 'No open issues authored, assigned, or mentioning you', icon: '✅', score: 50, data: { url: 'https://github.com/issues' } }];
    }
    return results;
  }

  // ── My Repos (REST) ───────────────────────────────────────────────────────

  private async myRepos(): Promise<PluginResult[]> {
    // Authorization is injected by Volt's authenticated fetch proxy in Rust.
    // A 401 means no token is configured yet.
    const response = await fetch('https://api.github.com/user/repos?sort=pushed&direction=desc&per_page=15&type=owner', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (response.status === 401) return [this.requiresTokenResult('your repositories')];
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    const repos = (await response.json()) as Array<{
      id: number; name: string; full_name: string; html_url: string;
      description: string | null; stargazers_count: number; forks_count: number;
      language: string | null; pushed_at: string; private: boolean; updated_at: string;
    }>;
    return repos.map((repo, i) => {
      const lang = repo.language;
      const accs: PluginResultAccessory[] = [];
      if (lang) accs.push({ text: lang, color: LANG_COLORS[lang], tag: true });
      accs.push({ icon: '⭐', text: formatStars(repo.stargazers_count) });
      accs.push({ text: relativeDate(repo.updated_at) });
      return {
        id: `github-my-repo-${repo.id}`,
        type: RESULT_TYPE,
        title: `${repo.private ? '🔒' : '📦'} ${repo.name}`,
        subtitle: repo.description ?? 'No description',
        icon: repo.private ? '🔒' : '📦',
        badge: 'My Repo',
        score: 100 - i * 4,
        data: { url: repo.html_url },
        accessories: accs,
      };
    });
  }

  // ── Notifications (REST) ──────────────────────────────────────────────────

  private async notifications(): Promise<PluginResult[]> {
    // Authorization is injected by Volt's authenticated fetch proxy in Rust.
    // A 401 means no token is configured yet.
    const response = await fetch('https://api.github.com/notifications?all=false&per_page=20', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (response.status === 401) return [this.requiresTokenResult('notifications')];
    if (!response.ok) {
      if (response.status === 403) throw new Error('Token needs `notifications` scope');
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const notifs = (await response.json()) as Array<{
      id: string; unread: boolean; reason: string; updated_at: string;
      subject: { type: string; title: string; url: string | null };
      repository: { full_name: string; html_url: string };
    }>;
    if (notifs.length === 0) {
      return [{ id: 'github-notifs-empty', type: RESULT_TYPE, title: '✅ All caught up!', subtitle: 'No unread GitHub notifications', icon: '🔔', score: 50, data: { url: 'https://github.com/notifications' } }];
    }
    const [unread, read] = [notifs.filter((n) => n.unread), notifs.filter((n) => !n.unread)];
    const results: PluginResult[] = [];
    let score = 100;
    const push = (ns: typeof notifs, section: string) => {
      for (const n of ns) {
        const url = n.subject.url
          ? n.subject.url.replace('api.github.com/repos', 'github.com').replace('/pulls/', '/pull/')
          : n.repository.html_url;
        const reasonLabel = this.notifReason(n.reason);
        results.push({
          id: `github-notif-${n.id}`,
          type: RESULT_TYPE,
          title: `${this.notifIcon(n.subject.type)} ${n.subject.title}`,
          subtitle: `${n.repository.full_name} · ${reasonLabel}`,
          icon: this.notifIcon(n.subject.type),
          badge: n.subject.type,
          score: score--,
          data: { url },
          accessories: [{ text: relativeDate(n.updated_at) }],
          section,
        });
      }
    };
    if (unread.length) push(unread, 'Unread');
    if (read.length) push(read, 'Read');
    return results;
  }

  private notifIcon(type: string): string {
    const m: Record<string, string> = {
      PullRequest: '🔀', Issue: '📋', Release: '🏷️',
      CheckSuite: '⚙️', Discussion: '💬', RepositoryInvitation: '📩',
      RepositoryVulnerabilityAlert: '⚠️', Commit: '📝',
    };
    return m[type] ?? '🔔';
  }

  private notifReason(reason: string): string {
    const m: Record<string, string> = {
      assign: 'Assigned', author: 'Author', comment: 'Commented',
      ci_activity: 'CI Activity', mention: 'Mentioned',
      review_requested: 'Review Requested', security_alert: 'Security Alert',
      state_change: 'State Changed', subscribed: 'Watching',
      team_mention: 'Team Mentioned',
    };
    return m[reason] ?? reason;
  }

  // ── Setup ─────────────────────────────────────────────────────────────────

  private setupResults(tokenValue: string): PluginResult[] {
    if (!tokenValue) {
      return [{
        id: 'github-setup-info', type: RESULT_TYPE,
        title: '🔑 Set GitHub Token',
        subtitle: 'gh: setup token <your-PAT> — unlocks 5 000 req/hr + my prs / my issues / notifs',
        icon: '🔑', score: 90,
        data: { url: 'https://github.com/settings/tokens/new?scopes=repo,notifications,read:user' },
        accessories: [{ text: 'repo + notifications + read:user', color: '#6b7280' }],
      }];
    }
    return [{
      id: 'github-setup-save', type: RESULT_TYPE,
      title: '✅ Save GitHub Token',
      subtitle: `Press Enter to save token (${tokenValue.slice(0, 8)}…)`,
      icon: '✅', score: 100,
      data: { action: 'save_token', token: tokenValue },
    }];
  }

  // ── Utility results ───────────────────────────────────────────────────────

  private requiresTokenResult(feature: string): PluginResult {
    return {
      id: 'github-requires-token', type: RESULT_TYPE,
      title: `🔑 Token required for ${feature}`,
      subtitle: 'gh: setup token <your-PAT>  (needs repo + notifications + read:user scopes)',
      icon: '🔑', score: 50,
      data: { url: 'https://github.com/settings/tokens/new?scopes=repo,notifications,read:user' },
    };
  }

  private rateLimitResult(): PluginResult {
    return {
      id: 'github-rate-limit', type: RESULT_TYPE,
      title: '⏳ Rate Limit Reached',
      subtitle: 'Unauthenticated: 60 req/hr. "gh: setup token <pat>" raises it to 5 000/hr.',
      icon: '⏳', score: 0,
      data: { url: 'https://github.com/settings/tokens/new?scopes=repo,notifications,read:user' },
    };
  }

  private errorResult(err: unknown): PluginResult {
    return {
      id: 'github-error', type: RESULT_TYPE,
      title: '⚠️ GitHub Error',
      subtitle: err instanceof Error ? err.message : 'Unknown error',
      icon: '⚠️', score: 0, data: {},
    };
  }

  // ── Execute ───────────────────────────────────────────────────────────────

  execute(result: PluginResult): void {
    const data = result.data ?? {};
    if (data.action === 'save_token' && typeof data.token === 'string') {
      // Token stored in OS keyring via Rust — never stored in extension state.
      VoltAPI.saveCredential('github', data.token as string);
      VoltAPI.showToast({ message: 'GitHub token saved — my prs, my issues & notifs now available', style: 'success', duration: 4000 });
      return;
    }
    if (typeof data.url === 'string' && data.url) {
      VoltAPI.utils.openUrl(data.url);
    }
  }
}

export default GitHubPlugin;

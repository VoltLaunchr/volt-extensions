/**
 * GitHub Plugin for Volt
 * Search GitHub repositories, issues, pull requests, and gists
 *
 * Usage:
 *   gh: repos nodejs
 *   gh: repos type:repo language:rust stars:>1000
 *   gh: issues is:pr author:torvalds
 *   gh: issues is:issue label:bug repo:nodejs/node
 *   gh: gists filename:package.json
 *   gh: trending python
 *   gh: user:torvalds
 */

interface Plugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  canHandle(context: PluginContext): boolean;
  match(context: PluginContext): Promise<PluginResult[]>;
  execute(result: PluginResult): Promise<void>;
}

interface PluginContext {
  query: string;
}

enum PluginResultType {
  App = "app",
  File = "file",
  Command = "command",
  Text = "text",
  Info = "info",
  Link = "link",
}

interface PluginResult {
  id: string;
  type: PluginResultType;
  title: string;
  subtitle?: string;
  icon?: string;
  score: number;
  data?: Record<string, any>;
  actions?: PluginResultAction[];
}

interface PluginResultAction {
  title: string;
  icon?: string;
  handler: string;
}

import { GitHubAPI, GitHubRepo, GitHubIssue, GitHubGist } from "./github-api";

export class GitHubPlugin implements Plugin {
  id = "github";
  name = "GitHub";
  description = "Search GitHub repositories, issues, pull requests, and gists";
  enabled = true;

  private api: GitHubAPI;
  private tokenFromEnv?: string;

  constructor() {
    // Try to get GitHub token from environment or local storage
    this.tokenFromEnv = typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
    this.api = new GitHubAPI(this.tokenFromEnv);
  }

  canHandle(context: PluginContext): boolean {
    // Trigger on "gh:" prefix or if it starts with known GitHub search terms
    const query = context.query.toLowerCase().trim();
    return (
      query.startsWith("gh ") ||
      query.startsWith("gh:") ||
      query.startsWith("github ") ||
      query.startsWith("github:")
    );
  }

  private parseQuery(context: PluginContext): { type: string; query: string } {
    let query = context.query.toLowerCase().trim();

    // Remove prefix
    if (query.startsWith("gh ")) {
      query = query.slice(3).trim();
    } else if (query.startsWith("gh:")) {
      query = query.slice(3).trim();
    } else if (query.startsWith("github ")) {
      query = query.slice(7).trim();
    } else if (query.startsWith("github:")) {
      query = query.slice(7).trim();
    }

    // Detect search type
    let type = "repos"; // default
    if (query.startsWith("repos ")) {
      type = "repos";
      query = query.slice(6).trim();
    } else if (query.startsWith("issues ")) {
      type = "issues";
      query = query.slice(7).trim();
    } else if (query.startsWith("pull ")) {
      type = "pull";
      query = query.slice(5).trim();
    } else if (query.startsWith("gists ")) {
      type = "gists";
      query = query.slice(6).trim();
    } else if (query.startsWith("trending ")) {
      type = "trending";
      query = query.slice(9).trim();
    } else if (query.startsWith("user:")) {
      type = "user";
    }

    return { type, query };
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    const { type, query } = this.parseQuery(context);
    const results: PluginResult[] = [];

    try {
      switch (type) {
        case "repos":
          return await this.searchRepos(query || "stars:>1000");

        case "issues":
          return await this.searchIssues(query || "is:open");

        case "pull":
          return await this.searchIssues(`is:pr ${query}`);

        case "gists":
          return await this.searchGists(query || "");

        case "trending":
          return await this.getTrending(query);

        case "user":
          return await this.getUserRepos(query);

        default:
          return await this.searchRepos(query || "stars:>1000");
      }
    } catch (error) {
      console.error("GitHub plugin error:", error);
      return [
        {
          id: "github-error",
          type: PluginResultType.Info,
          title: "GitHub Search Error",
          subtitle: `Failed to search GitHub: ${error instanceof Error ? error.message : "Unknown error"}`,
          icon: "⚠️",
          score: 0,
        },
      ];
    }
  }

  private async searchRepos(query: string): Promise<PluginResult[]> {
    const repos = await this.api.searchRepositories(query, 10);

    return repos.map((repo, index) => ({
      id: `github-repo-${repo.id}`,
      type: PluginResultType.Link,
      title: repo.full_name,
      subtitle: `${repo.description || "No description"} ⭐ ${repo.stars}${repo.language ? ` • ${repo.language}` : ""}`,
      icon: "📦",
      score: 100 - index * 5,
      data: {
        url: repo.html_url,
        repo: repo.full_name,
      },
      actions: [
        {
          title: "Open Repository",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    }));
  }

  private async searchIssues(query: string): Promise<PluginResult[]> {
    const issues = await this.api.searchIssues(query, 10);

    return issues.map((issue, index) => {
      const isPR = !!issue.pull_request;
      return {
        id: `github-issue-${issue.id}`,
        type: PluginResultType.Link,
        title: `${isPR ? "🔀 PR" : "📋 Issue"} #${issue.number} ${issue.title}`,
        subtitle: `${issue.user.login} • ${issue.state}${issue.body ? ` • ${issue.body.substring(0, 50)}...` : ""}`,
        icon: isPR ? "🔀" : "📋",
        score: 100 - index * 5,
        data: {
          url: issue.html_url,
          number: issue.number,
          state: issue.state,
          isPR,
        },
        actions: [
          {
            title: "Open Issue",
            icon: "🔗",
            handler: "openUrl",
          },
        ],
      };
    });
  }

  private async searchGists(query: string): Promise<PluginResult[]> {
    const gists = await this.api.searchGists(query, 10);

    return gists.map((gist, index) => {
      const fileList = Object.keys(gist.files).join(", ");
      return {
        id: `github-gist-${gist.id}`,
        type: PluginResultType.Link,
        title: gist.description || "Unnamed Gist",
        subtitle: `${gist.public ? "🌐 Public" : "🔒 Private"} • Files: ${fileList}`,
        icon: "📄",
        score: 100 - index * 5,
        data: {
          url: gist.html_url,
          gistId: gist.id,
        },
        actions: [
          {
            title: "Open Gist",
            icon: "🔗",
            handler: "openUrl",
          },
        ],
      };
    });
  }

  private async getTrending(language?: string): Promise<PluginResult[]> {
    const repos = await this.api.getTrendingRepositories(language || undefined, 10);

    return repos.map((repo, index) => ({
      id: `github-trending-${repo.id}`,
      type: PluginResultType.Link,
      title: repo.full_name,
      subtitle: `🔥 Trending • ${repo.description || "No description"} ⭐ ${repo.stars}${repo.language ? ` • ${repo.language}` : ""}`,
      icon: "🔥",
      score: 100 - index * 5,
      data: {
        url: repo.html_url,
        repo: repo.full_name,
      },
      actions: [
        {
          title: "Open Repository",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    }));
  }

  private async getUserRepos(username: string): Promise<PluginResult[]> {
    const repos = await this.api.getUserRepos(username, 10);

    return repos.map((repo, index) => ({
      id: `github-user-repo-${repo.id}`,
      type: PluginResultType.Link,
      title: repo.name,
      subtitle: `👤 ${username} • ${repo.description || "No description"} ⭐ ${repo.stars}${repo.language ? ` • ${repo.language}` : ""}`,
      icon: "👤",
      score: 100 - index * 5,
      data: {
        url: repo.html_url,
        repo: repo.full_name,
      },
      actions: [
        {
          title: "Open Repository",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    }));
  }

  async execute(result: PluginResult): Promise<void> {
    if (result.data && result.data.url) {
      // In Volt, this would open the URL via the launcher
      window.open(result.data.url, "_blank");
    }
  }
}

export default GitHubPlugin;

/**
 * Notion Plugin for Volt
 * Search and interact with Notion databases, pages, and content
 *
 * Usage:
 *   notion: search query
 *   notion: databases
 *   notion: recent
 *   notion: tasks    (search for database named "Tasks")
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

import { NotionAPI, NotionPage, NotionDatabase, NotionDatabaseItem } from "./notion-api";

export class NotionPlugin implements Plugin {
  id = "notion";
  name = "Notion";
  description = "Search and interact with Notion pages and databases";
  enabled = true;

  private api: NotionAPI;

  constructor() {
    this.api = new NotionAPI();
  }

  canHandle(context: PluginContext): boolean {
    const query = context.query.toLowerCase().trim();
    return (
      query.startsWith("notion ") ||
      query.startsWith("notion:") ||
      query.startsWith("n:")
    );
  }

  private parseQuery(context: PluginContext): { type: string; query: string } {
    let query = context.query.toLowerCase().trim();

    // Remove prefix
    if (query.startsWith("notion ")) {
      query = query.slice(7).trim();
    } else if (query.startsWith("notion:")) {
      query = query.slice(7).trim();
    } else if (query.startsWith("n:")) {
      query = query.slice(2).trim();
    }

    // Detect command type
    let type = "search"; // default

    if (query === "databases" || query === "dbs") {
      type = "databases";
      query = "";
    } else if (query === "recent" || query === "latest") {
      type = "recent";
      query = "";
    } else if (query.startsWith("db:")) {
      type = "database";
      query = query.slice(3).trim();
    } else if (query.startsWith("blocks:")) {
      type = "blocks";
      query = query.slice(7).trim();
    }

    return { type, query };
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    const { type, query } = this.parseQuery(context);

    try {
      switch (type) {
        case "search":
          return await this.searchPages(query);

        case "databases":
          return await this.listDatabases();

        case "recent":
          return await this.getRecentPages();

        case "database":
          return await this.getDatabaseItems(query);

        case "blocks":
          return await this.getPageBlocks(query);

        default:
          return await this.searchPages(query);
      }
    } catch (error) {
      console.error("Notion plugin error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      return [
        {
          id: "notion-error",
          type: PluginResultType.Info,
          title: "Notion Search Error",
          subtitle: `Failed to search Notion: ${errorMsg}`,
          icon: "⚠️",
          score: 0,
        },
      ];
    }
  }

  private async searchPages(query: string): Promise<PluginResult[]> {
    if (!query) {
      return [
        {
          id: "notion-help",
          type: PluginResultType.Info,
          title: "Notion Search",
          subtitle: "Type a query to search pages and databases",
          icon: "🔍",
          score: 50,
        },
      ];
    }

    const results = await this.api.search(query, 10);

    return results.map((result, index) => {
      if (result.type === "page" && result.page) {
        return this.pageToResult(result.page, 100 - index * 5);
      } else if (result.type === "database" && result.database) {
        return this.databaseToResult(result.database, 100 - index * 5);
      }
      return null;
    }).filter(Boolean) as PluginResult[];
  }

  private async listDatabases(): Promise<PluginResult[]> {
    const databases = await this.api.listDatabases(15);

    if (databases.length === 0) {
      return [
        {
          id: "notion-no-dbs",
          type: PluginResultType.Info,
          title: "No Databases Found",
          subtitle: "Make sure your Notion API token is configured correctly",
          icon: "📭",
          score: 0,
        },
      ];
    }

    return databases.map((db, index) =>
      this.databaseToResult(db, 100 - index * 3)
    );
  }

  private async getRecentPages(): Promise<PluginResult[]> {
    const pages = await this.api.getRecentPages(15);

    if (pages.length === 0) {
      return [
        {
          id: "notion-no-recent",
          type: PluginResultType.Info,
          title: "No Recent Pages",
          subtitle: "Your recent pages will appear here",
          icon: "📄",
          score: 0,
        },
      ];
    }

    return pages.map((page, index) =>
      this.pageToResult(page, 100 - index * 3)
    );
  }

  private async getDatabaseItems(databaseName: string): Promise<PluginResult[]> {
    // First search for the database
    const searchResults = await this.api.search(databaseName, 5);
    const database = searchResults.find((r) => r.type === "database")?.database;

    if (!database) {
      return [
        {
          id: "notion-db-not-found",
          type: PluginResultType.Info,
          title: `Database "${databaseName}" Not Found`,
          subtitle: "Try searching for a page or database name",
          icon: "🔍",
          score: 0,
        },
      ];
    }

    // Get items from the database
    const items = await this.api.getDatabaseItems(database.id, undefined, 10);

    return items.map((item, index) => ({
      id: `notion-db-item-${item.id}`,
      type: PluginResultType.Link,
      title: item.title,
      subtitle: `in ${database.title} • ${new Date(item.createdTime).toLocaleDateString()}`,
      icon: "📋",
      score: 100 - index * 5,
      data: {
        url: item.url,
        databaseId: database.id,
        itemId: item.id,
      },
      actions: [
        {
          title: "Open Page",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    }));
  }

  private async getPageBlocks(pageId: string): Promise<PluginResult[]> {
    const blocks = await this.api.getPageBlocks(pageId, 15);

    return blocks
      .filter((block) => block.content) // Only blocks with content
      .map((block, index) => ({
        id: `notion-block-${block.id}`,
        type: PluginResultType.Text,
        title: `${this.getBlockEmoji(block.type)} ${block.type}`,
        subtitle: block.content.substring(0, 80),
        icon: this.getBlockEmoji(block.type),
        score: 100 - index * 5,
        data: {
          blockId: block.id,
          content: block.content,
        },
      }));
  }

  private pageToResult(page: NotionPage, score: number): PluginResult {
    return {
      id: `notion-page-${page.id}`,
      type: PluginResultType.Link,
      title: page.title,
      subtitle: `Page • Updated ${new Date(page.lastEditedTime).toLocaleDateString()}`,
      icon: page.icon || "📄",
      score,
      data: {
        url: page.url,
        pageId: page.id,
      },
      actions: [
        {
          title: "Open Page",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    };
  }

  private databaseToResult(database: NotionDatabase, score: number): PluginResult {
    return {
      id: `notion-db-${database.id}`,
      type: PluginResultType.Link,
      title: database.title,
      subtitle: `Database • Updated ${new Date(database.lastEditedTime).toLocaleDateString()}`,
      icon: database.icon || "🗄️",
      score,
      data: {
        url: database.url,
        databaseId: database.id,
      },
      actions: [
        {
          title: "Open Database",
          icon: "🔗",
          handler: "openUrl",
        },
      ],
    };
  }

  private getBlockEmoji(blockType: string): string {
    const emojis: Record<string, string> = {
      paragraph: "📝",
      heading_1: "📍",
      heading_2: "📌",
      heading_3: "📎",
      bulleted_list_item: "• ",
      numbered_list_item: "1️⃣",
      quote: "💬",
      callout: "📢",
      code: "💻",
    };
    return emojis[blockType] || "📄";
  }

  async execute(result: PluginResult): Promise<void> {
    if (result.data && result.data.url) {
      window.open(result.data.url, "_blank");
    }
  }
}

export default NotionPlugin;

/**
 * Notion API Client for the Volt Notion Plugin
 * Supports searching pages, databases, and content
 */

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  icon?: string;
  cover?: string;
  createdTime: string;
  lastEditedTime: string;
  parent?: {
    type: string;
    databaseId?: string;
  };
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  icon?: string;
  cover?: string;
  description?: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionDatabaseItem {
  id: string;
  title: string;
  url: string;
  properties?: Record<string, any>;
  createdTime: string;
}

export interface NotionSearchResult {
  type: "page" | "database";
  page?: NotionPage;
  database?: NotionDatabase;
}

export class NotionAPI {
  private baseUrl = "https://api.notion.com/v1";
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private getAuthToken(): string {
    // Try environment variable first, then stored token
    if (this.token) {
      return this.token;
    }

    if (typeof process !== "undefined") {
      return process.env.NOTION_API_KEY || "";
    }

    return "";
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error(
        "Notion API token not found. Set NOTION_API_KEY environment variable or configure in plugin settings."
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2024-02-15",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Notion API error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Notion API fetch error:", error);
      throw error;
    }
  }

  /**
   * Search pages and databases by title
   */
  async search(query: string, limit: number = 10): Promise<NotionSearchResult[]> {
    try {
      const response = await this.fetch("/search", {
        method: "POST",
        body: JSON.stringify({
          query,
          page_size: limit,
          sort: {
            direction: "descending",
            timestamp: "last_edited_time",
          },
        }),
      });

      return response.results.map((result: any) => {
        if (result.object === "page") {
          return {
            type: "page",
            page: this.parsePageResult(result),
          };
        } else if (result.object === "database") {
          return {
            type: "database",
            database: this.parseDatabaseResult(result),
          };
        }
        return null;
      }).filter(Boolean);
    } catch (error) {
      console.error("Error searching Notion:", error);
      return [];
    }
  }

  /**
   * Get a specific database and list its items
   */
  async getDatabaseItems(
    databaseId: string,
    filter?: Record<string, any>,
    limit: number = 10
  ): Promise<NotionDatabaseItem[]> {
    try {
      const response = await this.fetch(`/databases/${databaseId}/query`, {
        method: "POST",
        body: JSON.stringify({
          page_size: limit,
          ...(filter && { filter }),
        }),
      });

      return response.results.map((item: any) => {
        const properties = item.properties;
        let title = "Untitled";

        // Find title property (usually the first text property)
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            const prop = value as any;
            if (prop.type === "title" && prop.title?.length > 0) {
              title = prop.title.map((t: any) => t.plain_text).join("");
              break;
            }
          }
        }

        return {
          id: item.id,
          title,
          url: item.public_url || item.url || "",
          properties,
          createdTime: item.created_time,
        };
      });
    } catch (error) {
      console.error(`Error fetching database items from ${databaseId}:`, error);
      return [];
    }
  }

  /**
   * Get page details and content blocks
   */
  async getPageBlocks(pageId: string, limit: number = 20): Promise<any[]> {
    try {
      const response = await this.fetch(`/blocks/${pageId}/children`, {
        method: "GET",
      });

      return response.results.slice(0, limit).map((block: any) => ({
        id: block.id,
        type: block.type,
        content: this.getBlockContent(block),
      }));
    } catch (error) {
      console.error(`Error fetching page blocks for ${pageId}:`, error);
      return [];
    }
  }

  /**
   * List all databases in workspace
   */
  async listDatabases(limit: number = 20): Promise<NotionDatabase[]> {
    try {
      const response = await this.fetch("/search", {
        method: "POST",
        body: JSON.stringify({
          filter: {
            value: "database",
            property: "object",
          },
          page_size: limit,
          sort: {
            direction: "descending",
            timestamp: "last_edited_time",
          },
        }),
      });

      return response.results
        .filter((result: any) => result.object === "database")
        .map((result: any) => this.parseDatabaseResult(result));
    } catch (error) {
      console.error("Error listing databases:", error);
      return [];
    }
  }

  /**
   * Get recent pages
   */
  async getRecentPages(limit: number = 10): Promise<NotionPage[]> {
    try {
      const response = await this.fetch("/search", {
        method: "POST",
        body: JSON.stringify({
          filter: {
            value: "page",
            property: "object",
          },
          page_size: limit,
          sort: {
            direction: "descending",
            timestamp: "last_edited_time",
          },
        }),
      });

      return response.results
        .filter((result: any) => result.object === "page")
        .map((result: any) => this.parsePageResult(result));
    } catch (error) {
      console.error("Error fetching recent pages:", error);
      return [];
    }
  }

  private parsePageResult(result: any): NotionPage {
    const title = this.extractTitle(result.properties);
    return {
      id: result.id,
      title,
      url: result.public_url || result.url || "",
      icon: result.icon?.emoji || result.icon?.external?.url,
      cover: result.cover?.external?.url || result.cover?.file?.url,
      createdTime: result.created_time,
      lastEditedTime: result.last_edited_time,
      parent: result.parent,
    };
  }

  private parseDatabaseResult(result: any): NotionDatabase {
    const title = this.extractTitle(result.title || []);
    return {
      id: result.id,
      title,
      url: result.url || "",
      icon: result.icon?.emoji || result.icon?.external?.url,
      cover: result.cover?.external?.url || result.cover?.file?.url,
      description: result.description?.map((d: any) => d.plain_text).join(""),
      createdTime: result.created_time,
      lastEditedTime: result.last_edited_time,
    };
  }

  private extractTitle(properties: any): string {
    if (!properties) return "Untitled";

    if (Array.isArray(properties)) {
      // Title property format
      return properties.map((t: any) => t.plain_text || "").join("");
    }

    // Page properties format
    for (const [, value] of Object.entries(properties)) {
      const prop = value as any;
      if (prop.type === "title" && prop.title?.length > 0) {
        return prop.title.map((t: any) => t.plain_text).join("");
      }
    }

    return "Untitled";
  }

  private getBlockContent(block: any): string {
    const type = block.type;
    const data = block[type];

    if (!data) return "";

    switch (type) {
      case "paragraph":
      case "heading_1":
      case "heading_2":
      case "heading_3":
      case "bulleted_list_item":
      case "numbered_list_item":
      case "quote":
      case "callout":
        return data.rich_text?.map((t: any) => t.plain_text).join("") || "";
      case "code":
        return data.rich_text?.map((t: any) => t.plain_text).join("") || "";
      default:
        return "";
    }
  }
}

import {
  Plugin,
  PluginContext,
  PluginResult,
  PluginResultType,
} from "@volt/plugin-api";

export class MyPlugin implements Plugin {
  id = "my-plugin";
  name = "My Plugin";
  description = "My awesome plugin description";
  enabled = true;

  canHandle(context: PluginContext): boolean {
    // Return true if your plugin can handle this query
    return context.query.length > 0;
  }

  async match(context: PluginContext): Promise<PluginResult[]> {
    // Generate and return results based on the query
    return [
      {
        id: "result-1",
        type: PluginResultType.Info,
        title: "My Result",
        subtitle: `You searched for: ${context.query}`,
        icon: "🔌",
        score: 100,
        data: {
          query: context.query,
        },
      },
    ];
  }

  async execute(result: PluginResult): Promise<void> {
    // Execute the action when user selects a result
    console.log("Plugin executed:", result);
  }
}

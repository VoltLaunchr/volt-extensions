use volt_plugin_api::{VoltPluginAPI, PluginResult};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct MyPlugin {
    id: String,
    name: String,
    description: String,
    enabled: bool,
}

impl Default for MyPlugin {
    fn default() -> Self {
        Self {
            id: "my-plugin".to_string(),
            name: "My Plugin".to_string(),
            description: "My awesome plugin".to_string(),
            enabled: true,
        }
    }
}

impl VoltPluginAPI for MyPlugin {
    fn can_handle(&self, query: &str) -> bool {
        // Return true if your plugin can handle this query
        !query.is_empty()
    }

    fn match_query(&self, query: &str) -> Vec<PluginResult> {
        // Generate and return results based on the query
        vec![
            PluginResult {
                id: "result-1".to_string(),
                title: "My Result".to_string(),
                subtitle: Some(format!("You searched for: {}", query)),
                score: 100,
                ..Default::default()
            }
        ]
    }

    fn execute(&self, result: &PluginResult) {
        // Execute the action when user selects a result
        println!("Plugin executed: {:?}", result);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_handle() {
        let plugin = MyPlugin::default();
        assert!(plugin.can_handle("test"));
    }
}

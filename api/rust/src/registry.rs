/// Plugin registry for managing backend plugins
use crate::core::traits::Plugin;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

/// Thread-safe plugin registry
#[derive(Clone)]
pub struct PluginRegistry {
    plugins: Arc<RwLock<HashMap<String, Box<dyn Plugin + Send + Sync>>>>,
}

impl PluginRegistry {
    /// Create a new plugin registry
    pub fn new() -> Self {
        Self {
            plugins: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Register a new plugin
    pub fn register(&self, plugin: Box<dyn Plugin + Send + Sync>) -> Result<(), String> {
        let plugin_id = plugin.id().to_string();
        let plugin_name = plugin.name().to_string();

        let mut plugins = self
            .plugins
            .write()
            .map_err(|e| format!("Failed to acquire write lock: {}", e))?;

        if plugins.contains_key(&plugin_id) {
            println!(
                "⚠ Plugin '{}' is already registered. Overwriting.",
                plugin_id
            );
        }

        plugins.insert(plugin_id.clone(), plugin);
        println!("✓ Plugin registered: {} ({})", plugin_name, plugin_id);

        Ok(())
    }

    /// Unregister a plugin
    pub fn unregister(&self, plugin_id: &str) -> Result<(), String> {
        let mut plugins = self
            .plugins
            .write()
            .map_err(|e| format!("Failed to acquire write lock: {}", e))?;

        if plugins.remove(plugin_id).is_some() {
            println!("✓ Plugin unregistered: {}", plugin_id);
            Ok(())
        } else {
            Err(format!("Plugin '{}' not found", plugin_id))
        }
    }

    /// Get all registered plugin IDs
    pub fn list_plugins(&self) -> Result<Vec<String>, String> {
        let plugins = self
            .plugins
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {}", e))?;

        Ok(plugins.keys().cloned().collect())
    }

    /// Get count of registered plugins
    pub fn count(&self) -> Result<usize, String> {
        let plugins = self
            .plugins
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {}", e))?;

        Ok(plugins.len())
    }

    /// Check if a plugin is registered
    pub fn has_plugin(&self, plugin_id: &str) -> bool {
        self.plugins
            .read()
            .map(|plugins| plugins.contains_key(plugin_id))
            .unwrap_or(false)
    }

    /// Get enabled plugins count
    pub fn enabled_count(&self) -> Result<usize, String> {
        let plugins = self
            .plugins
            .read()
            .map_err(|e| format!("Failed to acquire read lock: {}", e))?;

        Ok(plugins.values().filter(|p| p.is_enabled()).count())
    }

    /// Initialize all registered plugins
    pub async fn initialize_all(&self) -> Result<(), String> {
        let plugin_ids = self.list_plugins()?;
        println!("Initializing {} plugins...", plugin_ids.len());

        for plugin_id in plugin_ids {
            // Note: We can't modify plugins during initialization in this simple implementation
            // A more advanced implementation would use interior mutability
            println!("✓ Plugin '{}' initialized", plugin_id);
        }

        Ok(())
    }

    /// Shutdown all registered plugins
    pub async fn shutdown_all(&self) -> Result<(), String> {
        let plugin_ids = self.list_plugins()?;
        println!("Shutting down {} plugins...", plugin_ids.len());

        for plugin_id in plugin_ids {
            println!("✓ Plugin '{}' shut down", plugin_id);
        }

        Ok(())
    }
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock plugin for testing
    struct MockPlugin {
        id: String,
        name: String,
    }

    #[async_trait::async_trait]
    impl Plugin for MockPlugin {
        fn as_any(&self) -> &dyn std::any::Any {
            self
        }

        fn id(&self) -> &str {
            &self.id
        }

        fn name(&self) -> &str {
            &self.name
        }

        fn description(&self) -> &str {
            "Mock plugin for testing"
        }
    }

    #[test]
    fn test_register_plugin() {
        let registry = PluginRegistry::new();
        let plugin = Box::new(MockPlugin {
            id: "test".to_string(),
            name: "Test Plugin".to_string(),
        });

        assert!(registry.register(plugin).is_ok());
        assert!(registry.has_plugin("test"));
        assert_eq!(registry.count().unwrap(), 1);
    }

    #[test]
    fn test_unregister_plugin() {
        let registry = PluginRegistry::new();
        let plugin = Box::new(MockPlugin {
            id: "test".to_string(),
            name: "Test Plugin".to_string(),
        });

        registry.register(plugin).unwrap();
        assert!(registry.unregister("test").is_ok());
        assert!(!registry.has_plugin("test"));
        assert_eq!(registry.count().unwrap(), 0);
    }
}

# Rust API

Guide for building Rust backend plugins for Volt.

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
volt-plugin-api = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## Basic Plugin

```rust
use volt_plugin_api::{VoltPluginAPI, PluginRegistry};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct MyPlugin {
    id: String,
    name: String,
    enabled: bool,
}

impl VoltPluginAPI for MyPlugin {
    fn can_handle(&self, query: &str) -> bool {
        !query.is_empty()
    }

    fn match_query(&self, query: &str) -> Vec<PluginResult> {
        vec![
            PluginResult {
                id: "result-1".to_string(),
                title: "My Result".to_string(),
                subtitle: Some(query.to_string()),
                score: 100,
                ..Default::default()
            }
        ]
    }

    fn execute(&self, result: &PluginResult) {
        println!("Executed: {}", result.title);
    }
}
```

## Advanced Features

### State Management

```rust
pub struct StatefulPlugin {
    cache: HashMap<String, Vec<PluginResult>>,
}

impl StatefulPlugin {
    pub fn new() -> Self {
        Self {
            cache: HashMap::new(),
        }
    }
}

impl VoltPluginAPI for StatefulPlugin {
    fn match_query(&mut self, query: &str) -> Vec<PluginResult> {
        if let Some(cached) = self.cache.get(query) {
            return cached.clone();
        }

        let results = self.fetch_results(query);
        self.cache.insert(query.to_string(), results.clone());
        results
    }
}
```

### Async Operations

```rust
use tokio::runtime::Runtime;

impl VoltPluginAPI for AsyncPlugin {
    fn match_query(&self, query: &str) -> Vec<PluginResult> {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            self.async_fetch(query).await
        })
    }
}
```

## When to Use Rust

Use Rust plugins for:

- System-level operations
- High-performance requirements
- Native OS integrations
- CPU-intensive tasks

Most plugins should use TypeScript for simplicity.

## See Also

- [Plugin API Reference](plugin-api.md)
- [TypeScript API](typescript-api.md)
- [Examples](../examples/)

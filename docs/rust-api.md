# Rust API

Guide for building Rust backend plugins for Volt.

> **Note**: Most extensions should use the [TypeScript API](typescript-api.md) for simplicity. The Rust API is for system-level operations that need native OS access, high performance, or direct hardware interaction.

## Overview

The Rust plugin API provides two main components:

- **`VoltPluginAPI`** - The API surface exposed to plugins (file paths, state, caching)
- **`PluginRegistry`** - Thread-safe registry for managing backend plugins (`Arc<RwLock<HashMap>>`)

Source code: [`packages/api/rust/src/`](../packages/api/rust/src/)

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
volt-plugin-api = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## VoltPluginAPI

The `VoltPluginAPI` struct provides plugins with controlled access to Volt's filesystem:

```rust
use volt_plugin_api::VoltPluginAPI;

// Created by Volt core with the app data directory
let api = VoltPluginAPI::new(app_data_dir);

// Plugin-scoped filesystem paths
let data   = api.get_plugin_data_dir("my-plugin")?;    // app_data/data/my-plugin/
let cache  = api.get_plugin_cache_dir("my-plugin")?;   // app_data/cache/my-plugin/
let config = api.get_plugin_config_dir("my-plugin")?;  // app_data/config/my-plugin/

// Configuration persistence (JSON)
api.save_config("my-plugin", "settings", &serde_json::json!({"key": "value"}))?;
let config = api.load_config("my-plugin", "settings")?;  // -> serde_json::Value

// Caching (binary)
api.write_cache("my-plugin", "data.bin", &bytes)?;
let data = api.read_cache("my-plugin", "data.bin")?;     // -> Vec<u8>
api.clear_cache("my-plugin")?;

// Logging
api.log("my-plugin", LogLevel::Info, "Plugin initialized");

// App info
let version = api.get_volt_version();          // -> &str
let app_dir = api.get_app_data_dir()?;         // -> PathBuf
```

Plugin IDs are validated to prevent path traversal attacks:

- Max 64 characters
- Only ASCII alphanumerics, hyphens, and underscores
- No path separators (`.`, `..`, `/`, `\`)

## PluginRegistry

Thread-safe registry for managing backend plugins (`Arc<RwLock<HashMap>>`):

```rust
use volt_plugin_api::PluginRegistry;

let registry = PluginRegistry::new();

// Register a plugin (takes Box<dyn Plugin + Send + Sync>)
registry.register(Box::new(my_plugin))?;

// Check and list plugins
registry.has_plugin("my-plugin");       // -> bool
registry.list_plugins()?;               // -> Vec<String>
registry.count()?;                      // -> usize
registry.enabled_count()?;              // -> usize

// Manage plugins
registry.unregister("my-plugin")?;

// Lifecycle
registry.initialize_all().await?;
registry.shutdown_all().await?;
```

## When to Use Rust

| Use Case                                     | Recommended API                  |
| -------------------------------------------- | -------------------------------- |
| UI interactions, search results              | TypeScript                       |
| Web API calls                                | TypeScript                       |
| Clipboard, URL opening                       | TypeScript (via VoltAPI runtime) |
| System metrics (CPU, RAM, disk)              | Rust                             |
| Native OS integrations (registry, processes) | Rust                             |
| File system watching                         | Rust                             |
| CPU-intensive computation                    | Rust                             |
| Hardware access                              | Rust                             |

## See Also

- [Plugin API Reference](plugin-api.md) - Full interface documentation
- [TypeScript API](typescript-api.md) - Frontend plugin development
- [Examples](../examples/) - Working plugins

# volt-plugin-api (Rust)

Rust API for building Volt launcher backend plugins. Use this for system-level operations that need native OS access, high performance, or direct hardware interaction.

For most extensions, the [TypeScript API](../typescript/) is recommended.

## Installation

```toml
[dependencies]
volt-plugin-api = "0.1"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## Components

### VoltPluginAPI

Provides plugins with controlled access to Volt's filesystem:

```rust
use volt_plugin_api::VoltPluginAPI;

let api = VoltPluginAPI::new(app_data_dir);

// Plugin-scoped directories
let data   = api.get_plugin_data_dir("my-plugin")?;    // app_data/data/my-plugin/
let cache  = api.get_plugin_cache_dir("my-plugin")?;   // app_data/cache/my-plugin/
let config = api.get_plugin_config_dir("my-plugin")?;   // app_data/config/my-plugin/

// Config persistence (JSON)
api.save_config("my-plugin", "settings", &json!({"key": "value"}))?;
let cfg = api.load_config("my-plugin", "settings")?;

// Binary caching
api.write_cache("my-plugin", "data.bin", &bytes)?;
let data = api.read_cache("my-plugin", "data.bin")?;
api.clear_cache("my-plugin")?;
```

Plugin IDs are validated against path traversal (max 64 chars, alphanumeric + hyphens only).

### PluginRegistry

Thread-safe registry using `Arc<RwLock<HashMap>>`:

```rust
use volt_plugin_api::PluginRegistry;

let registry = PluginRegistry::new();
registry.register(Box::new(my_plugin))?;
registry.initialize_all().await?;
```

## When to Use Rust vs TypeScript

| Use Case | API |
|----------|-----|
| Search results, UI interactions | TypeScript |
| Web API calls, clipboard | TypeScript |
| System metrics (CPU, RAM, disk) | Rust |
| Native OS integrations | Rust |
| File system watching | Rust |
| CPU-intensive computation | Rust |

## Documentation

- [Rust API Guide](../../docs/rust-api.md)
- [Plugin API Reference](../../docs/plugin-api.md)

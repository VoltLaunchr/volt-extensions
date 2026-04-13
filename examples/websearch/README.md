# Web Search Plugin

Search the web directly from Volt using multiple search engines.

## Features

- Multi-engine support: Google (default), Bing, DuckDuckGo
- Multiple trigger patterns for flexible activation
- Opens results in your default browser
- URL-encoded queries for accurate searches

## Usage

### Trigger Patterns

| Trigger | Engine | Example |
|---------|--------|---------|
| `?` | Google | `? weather paris` |
| `web` | Google | `web latest news` |
| `search` | Google | `search typescript docs` |
| `google` | Google | `google react hooks` |
| `bing` | Bing | `bing windows 11 updates` |
| `ddg` | DuckDuckGo | `ddg privacy tools` |

### Examples

```
? weather paris          -> Search "weather paris" on Google
google react hooks       -> Search "react hooks" on Google
bing windows updates     -> Search "windows updates" on Bing
ddg privacy browser      -> Search "privacy browser" on DuckDuckGo
web how to cook pasta    -> Search "how to cook pasta" on Google
```

## Architecture

Simple single-file plugin (`index.ts`):

- `canHandle()` checks if query starts with any known trigger prefix
- `match()` extracts the search query and detects the target engine
- `execute()` opens the constructed search URL in the default browser

## How It Works

1. User types a trigger prefix followed by a search query
2. The plugin strips the prefix and identifies the search engine
3. A `PluginResult` is returned with the constructed search URL in `data`
4. On selection, the URL is opened via `openUrl()` (provided by Volt runtime)

## Code

See [index.ts](index.ts) for the implementation.

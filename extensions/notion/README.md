# Notion Plugin for Volt

Search and interact with your Notion workspace directly from Volt.

## Installation

The Notion plugin is available in the Volt extensions marketplace.

## Setup

To use this plugin, you need a Notion API token:

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the **Internal Integration Token**
4. Set it as an environment variable:
   ```bash
   export NOTION_API_KEY=your_token_here
   ```

## Usage

Activate the plugin with the `notion:` prefix or `n:` shortcut:

```
notion: <search query>
```

### Commands

#### Search Pages & Databases
```
notion: my project
notion: meeting notes
notion: recipe blog
```

#### List All Databases
```
notion: databases
notion: dbs
```

#### Get Recent Pages
```
notion: recent
notion: latest
```

#### Query Database Items
```
notion: db: Tasks
notion: db: Reading List
notion: db: Project Ideas
```

#### Browse Page Blocks
```
notion: blocks: page-id
```

## Features

- 🔍 **Full Text Search**: Search all your pages and databases
- 📊 **Database Browsing**: List and query Notion databases
- 📄 **Page Preview**: View recent pages and block content
- 👤 **User-Friendly**: One-click access to open pages in browser
- 🔗 **Direct Links**: Quick navigation to any page or database
- 📊 **Rich Metadata**: Display icons, covers, and modification dates
- 🎯 **Smart Search**: Sorts by last edited time by default

## Examples

```
notion: Product Roadmap      → Search for pages named "Product Roadmap"
notion: databases            → List all databases in workspace
notion: recent               → Show 10 most recently edited pages
notion: db: Tasks            → List all items in "Tasks" database
notion: blocks: abc123       → Show all blocks in page abc123
```

## Keyboard Shortcuts

- `Enter` - Open selected page/database in browser
- `Escape` - Close and return to main search

## Troubleshooting

### "Notion API token not found"
- Make sure you've set the `NOTION_API_KEY` environment variable
- Verify the token is valid at https://www.notion.so/my-integrations
- You may need to restart Volt after setting the environment variable

### No results appearing
- Check that your Notion workspace has public pages or databases
- Make sure the integration has access to the pages/databases you want to search
- Verify the token hasn't expired

### "Permission denied" errors
- Add the integration to your Notion workspace
- In Notion, invite the integration to specific pages or databases
- Check the integration's access permissions

## API Rate Limits

Notion API has rate limits:
- Free: 3 requests/second
- Paid: No strict limit, best effort

The plugin respects these limits and will retry if needed.

## Supported Block Types

The plugin displays content from:
- Paragraphs
- Headings (H1, H2, H3)
- Lists (bulleted, numbered)
- Quotes
- Callouts
- Code blocks
- And more...

## Contributing

Found a bug or have a feature request? Visit [VoltLaunchr/volt-extensions](https://github.com/VoltLaunchr/volt-extensions).

## License

MIT

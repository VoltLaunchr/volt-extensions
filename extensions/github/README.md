# GitHub Plugin for Volt

Search GitHub repositories, issues, pull requests, and gists directly from Volt.

## Installation

The GitHub plugin is available in the Volt extensions marketplace.

## Usage

Activate the plugin with the `gh:` prefix or `gh ` (space):

```
gh: <search query>
```

### Examples

#### Search Repositories
```
gh: repos nodejs
gh: repos type:repo language:rust stars:>1000
gh: repos type:repo created:>2023-01-01
```

#### Search Issues & Pull Requests
```
gh: issues is:open label:bug
gh: issues is:pr author:torvalds
gh: issues repo:nodejs/node is:issue
gh: pull language:typescript
```

#### Search Gists
```
gh: gists filename:package.json
gh: gists language:python
gh: gists user:torvalds
```

#### Trending Repositories
```
gh: trending
gh: trending python
gh: trending javascript
```

#### User Repositories
```
gh: user:torvalds
gh: user:gvanrossum
```

## Features

- **Repository Search**: Find repos by name, language, stars, date, and more
- **Issue & PR Search**: Search issues and pull requests with advanced filters
- **Gist Search**: Find gists by filename, language, or user
- **Trending**: See trending repositories from the past month
- **User Profiles**: View public repositories from any GitHub user
- **One-click Links**: Open results directly in your browser
- **Rate Limit Awareness**: Shows rate limit status in the plugin

## GitHub Search Operators

The plugin supports GitHub's advanced search syntax:

### Repository Search
- `type:repo` - Search only repositories
- `language:rust` - Filter by programming language
- `stars:>1000` - Filter by stars (>, <, >=, <=)
- `created:>2023-01-01` - Filter by creation date
- `pushed:>2024-01-01` - Filter by last push date
- `forks:>100` - Filter by fork count

### Issue/PR Search
- `is:open` - Open issues/PRs
- `is:closed` - Closed issues/PRs
- `is:pr` - Pull requests only
- `is:issue` - Issues only
- `author:username` - Filter by author
- `assignee:username` - Filter by assignee
- `label:bug` - Filter by label
- `state:open` - Filter by state
- `repo:user/repo` - Search within specific repo

### Gist Search
- `language:python` - Filter by language
- `filename:package.json` - Filter by filename
- `user:username` - Filter by user
- `is:public` - Public gists only

## Authentication

By default, the plugin uses GitHub's unauthenticated API (60 requests/hour).

To increase your rate limit to 5000 requests/hour, set a GitHub personal access token:

1. Create a token at https://github.com/settings/tokens (read:public_repo scope is sufficient)
2. Set the environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

## Performance

- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour

## Keyboard Shortcuts

- `Enter` - Open selected result in browser
- `Escape` - Close and return to main search

## Troubleshooting

### "GitHub Search Error"
- Check your internet connection
- GitHub API might be temporarily unavailable
- You may have exceeded your rate limit (wait 1 hour)

### No Results
- Try simpler queries
- Use valid GitHub search operators
- Ensure the repository/issue exists

## Contributing

Found a bug or want to add a feature? Visit [VoltLaunchr/volt-extensions](https://github.com/VoltLaunchr/volt-extensions).

## License

MIT

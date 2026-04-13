# Calculator Plugin

Advanced calculator plugin for Volt with math expressions, unit conversions, date calculations, and timezone conversions.

## Features

### Math Expressions

Evaluate mathematical expressions in real-time:

- `2 + 2` -> 4
- `sqrt(16)` -> 4
- `10^3` -> 1000
- `15 * 3 + 7` -> 52
- `100 / 4` -> 25

### Unit Conversions

Convert between units with natural language:

- `10km to miles` -> 6.21 miles
- `50F to C` -> 10 C
- `100lbs to kg` -> 45.36 kg
- `1000ml to cups` -> 4.23 cups

### Date Calculations

Perform date arithmetic and countdowns:

- `days until christmas` -> countdown
- `date + 30 days` -> future date
- `next friday + 2 weeks` -> future weekday calculation

### Timezone Conversions

Check and convert times across timezones:

- `time in Tokyo` -> current time in Tokyo
- `3pm EST to PST` -> timezone conversion

## Architecture

```
calculator/
├── index.ts                  # Main CalculatorPlugin class
├── types.ts                  # QueryType, ParsedQuery, SpecificQuery types
├── parsers/
│   └── queryParser.ts        # Detects query type and extracts parameters
├── converters/
│   ├── math.ts               # Math expression evaluator
│   ├── units.ts              # Unit conversion handler
│   ├── dates.ts              # Date arithmetic (countdown, future weekday)
│   └── timezone.ts           # Timezone conversion and current time
├── utils/
│   ├── formatting.ts         # Number and unit formatting
│   └── history.ts            # Calculation history management
├── components/
│   └── CalculatorView.tsx    # React component with full UI and keyboard shortcuts
└── README.md
```

## Query Types

| Type | Detection | Examples |
|------|-----------|---------|
| `math` | Numeric expressions with operators | `2+2`, `sqrt(16)`, `10^3` |
| `unit` | Value + unit + "to" + target unit | `10km to miles`, `50F to C` |
| `date` | Date keywords (days until, date +) | `days until christmas`, `date + 30 days` |
| `timezone` | "time in" or timezone references | `time in Tokyo`, `3pm EST to PST` |

## How It Works

1. `canHandle()` delegates to the query parser to detect if input matches any supported pattern
2. `match()` parses the query, routes to the appropriate converter, and returns formatted results
3. `execute()` copies the result to clipboard and adds it to calculation history
4. All results use `PluginResultType.Calculator` with a score of 95

## Code

See [index.ts](index.ts) for the full implementation.

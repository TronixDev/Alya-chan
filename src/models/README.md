# Alya Language Models System

This directory contains the language model management system for Alya chatbot. The system allows dynamic loading of different language personas for the chatbot.

## Structure

```text
src/models/
├── index.ts          # Main model management system
└── README.md         # This file

models/               # Language model files (outside src)
├── alya-en.txt       # English persona
└── alya-id.txt       # Indonesian persona
```

## Features

- **Multi-language Support**: Support for multiple language personas
- **Caching System**: Models are cached in memory for better performance
- **Hot Reloading**: Models can be reloaded without restarting the bot
- **Validation**: Automatic validation of model files on startup
- **Per-Server Language**: Each Discord server can set their preferred language

## Available Functions

### Core Functions

- `loadLanguageModel(code: string)` - Load a specific language model
- `preloadAllModels()` - Load all models into cache
- `clearModelCache()` - Clear the model cache
- `reloadLanguageModel(code: string)` - Reload a specific model
- `validateModelFiles()` - Validate that all model files exist

### Utility Functions

- `isValidLanguage(code: string)` - Check if language code is valid
- `getLanguageInfo(code: string)` - Get language information
- `getAvailableLanguageCodes()` - Get all available language codes
- `getAvailableLanguages()` - Get language info for UI display
- `getCacheStats()` - Get cache statistics

## Available Languages

| Code | Language   | Flag | File          |
|------|------------|------|---------------|
| `id` | Indonesian | 🇮🇩   | alya-id.txt   |
| `en` | English    | 🇺🇸   | alya-en.txt   |

## Usage Examples

### Loading a Language Model

```typescript
import { loadLanguageModel } from "#alya/models";

const content = await loadLanguageModel("id");
if (content) {
  // Use the content for AI prompt
}
```

### Checking Available Languages

```typescript
import { getAvailableLanguages, isValidLanguage } from "#alya/models";

const languages = getAvailableLanguages();
// Returns: [{ name: "🇮🇩 Indonesian", value: "id", flag: "🇮🇩" }, ...]

const isValid = isValidLanguage("id"); // true
```

### Cache Management

```typescript
import { getCacheStats, clearModelCache, preloadAllModels } from "#alya/models";

// Get cache info
const stats = getCacheStats();
console.log(`${stats.size} models cached: ${stats.languages.join(", ")}`);

// Clear cache
clearModelCache();

// Preload all models
await preloadAllModels();
```

## Discord Commands

### User Commands

- `/setchatbotlocale <locale>` - Set chatbot language for the server
- `/chatbotstatus` - Show current chatbot language and status

### Admin Commands

- `/reloadmodels <action> [language]` - Reload language models
  - `reload_all` - Reload all models
  - `clear_cache` - Clear model cache
  - `reload_lang` - Reload specific language

## Database Integration

The system integrates with the database to store per-server language preferences:

```typescript
// Get chatbot locale for a guild
const locale = await client.database.getChatbotLocale(guildId);

// Set chatbot locale for a guild
await client.database.setChatbotLocale(guildId, "en");
```

## Adding New Languages

1. Create a new language file in the `models/` directory (e.g., `alya-es.txt`)
1. Add the language configuration to `AVAILABLE_LANGUAGES` in `src/models/index.ts`:

```typescript
{
  code: "es",
  name: "Spanish",
  flag: "🇪🇸",
  filename: "alya-es.txt",
}
```

1. Restart the bot to load the new language

## File Structure Requirements

Language model files should be placed in the `models/` directory at the project root. The files should contain the complete persona/prompt for the AI model.

Example file structure:

```text
models/
├── alya-id.txt    # Indonesian persona
├── alya-en.txt    # English persona
└── alya-es.txt    # Spanish persona (if added)
```

## Performance Notes

- Models are automatically cached after first load
- Cache is persistent until manually cleared or reloaded
- Preloading all models on startup improves first-use performance
- Failed model loads fallback to the default language (English)

## Error Handling

The system gracefully handles various error scenarios:

- Missing model files: Falls back to default language
- Invalid language codes: Returns null/error
- File read errors: Logs error and returns null
- Cache issues: Automatically rebuilds cache as needed

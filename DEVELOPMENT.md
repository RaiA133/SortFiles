# ShortFiles - Development Guide

## Getting Started

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 8 or higher
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ShortFiles
```

2. Install dependencies:
```bash
pnpm install
```

3. Build all packages:
```bash
pnpm build
```

## Development

### Running in Development Mode

```bash
# Start all packages in watch mode
pnpm dev

# Or start individual packages
cd packages/desktop-app
pnpm dev:main    # Electron main process
pnpm dev:renderer # React UI (in another terminal)
```

### Project Structure

```
shortfiles/
├── packages/
│   ├── core/              # Shared business logic
│   │   ├── file-scanner/  # Directory scanning
│   │   ├── file-operator/ # File operations (move/copy)
│   │   ├── rule-engine/   # Rule evaluation
│   │   └── undo-manager/  # Undo/redo functionality
│   │
│   ├── ai-providers/      # AI provider implementations
│   │   ├── interfaces/    # Provider interfaces
│   │   ├── providers/     # OpenAI, Gemini, Qwen
│   │   └── prompts/       # AI prompts
│   │
│   └── desktop-app/       # Electron application
│       ├── main/          # Electron main process
│       ├── renderer/      # React UI
│       └── shared/        # Shared types/constants
│
└── package.json           # Monorepo root
```

### Adding a New AI Provider

1. Create a new provider in `packages/ai-providers/src/providers/<provider>/`:

```typescript
import { IAIProvider } from '../../interfaces/provider';

export class NewProvider implements IAIProvider {
  readonly name = 'provider-name';
  readonly supportedModels = ['model-1', 'model-2'];
  readonly defaultModel = 'model-1';

  async initialize(config: AIProviderConfig): Promise<void> {
    // Initialize the provider
  }

  async classify(files: FileInfo[]): Promise<ClassificationResult> {
    // Implement classification
  }

  async suggestRules(files: FileInfo[]): Promise<Rule[]> {
    // Implement rule suggestion
  }

  // ... implement other methods
}
```

2. Register in `packages/ai-providers/src/providers/factory.ts`:

```typescript
import { NewProvider } from './new-provider/provider';

private static providerClasses = new Map([
  // ... existing providers
  ['provider-name', NewProvider],
]);
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
cd packages/core
pnpm build
```

### Packaging

```bash
# Package for current platform
pnpm package

# Package for specific platforms
pnpm package:mac
pnpm package:win
pnpm package:linux
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/core
pnpm test
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Run `pnpm install` to ensure all dependencies are installed
   - Run `pnpm build` to build all packages

2. **Electron window doesn't open**
   - Check that the main process is running: `pnpm dev:main`
   - Check that the renderer is running: `pnpm dev:renderer`

3. **Hot reload not working**
   - Restart the dev process
   - Clear the `dist` folder and rebuild

## API Configuration

### OpenAI

```typescript
{
  apiKey: 'sk-...',
  model: 'gpt-4o-mini', // optional
  baseURL: 'https://api.openai.com/v1', // optional
}
```

### Gemini

```typescript
{
  apiKey: 'AIza...',
  model: 'gemini-1.5-flash', // optional
}
```

### Qwen

```typescript
{
  apiKey: 'sk-...',
  model: 'qwen-turbo', // optional
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `pnpm test`
4. Run linter: `pnpm lint`
5. Submit a pull request

## License

MIT

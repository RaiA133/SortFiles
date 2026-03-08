# SortFiles

<div align="center">

  **AI-Powered File Organization Tool**

  [![Build Desktop App](https://github.com/RaiA133/SortFiles/actions/workflows/build.yml/badge.svg)](https://github.com/RaiA133/SortFiles/actions/workflows/build.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📖 Description

SortFiles automatically organizes your files using AI. It analyzes file names, types, and context to categorize them into meaningful folders - saving you hours of manual sorting.

**Features:**
- 🤖 Multi-AI Provider Support (OpenAI, Gemini, Claude)
- 🎯 Smart classification based on file context
- 👀 Preview changes before executing
- ↩️ Undo support for safe operations
- 🌐 Cross-platform (Windows, macOS, Linux)

## 🚀 Installation

### Download Pre-built Packages

Get the latest release from [Releases](https://github.com/RaiA133/SortFiles/releases):
- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.deb` or `.AppImage`

### Quick Install

```bash
# Ubuntu/Debian
sudo dpkg -i SortFiles-*.deb
sudo update-desktop-database /usr/share/applications

# Fedora/RHEL
chmod +x SortFiles-*.AppImage
./SortFiles-*.AppImage
```

## 🏃 Quick Start

1. **Launch SortFiles** and select your AI provider (OpenAI/Gemini/Claude)
2. **Add API Key** - Click "Get API Key" link in the app
3. **Select Folders** - Choose source (messy) and destination (organized)
4. **Scan & Classify** - Let AI analyze your files
5. **Review & Move** - Check preview, then click "Move Files"

### Example

```
Before:                     After:
Downloads/                  Documents/Organized/
  ├── img_123.jpg            ├── Images/
  ├── report.pdf             │   ├── img_123.jpg
  ├── invoice.pdf            │   └── screenshot.png
  └── screenshot.png         └── Documents/
                              ├── report.pdf
                              └── invoice.pdf
```

## 🛠️ Tech Stack

### Desktop Framework
- **Electron** - Cross-platform desktop runtime
- **Node.js 20+** - Backend runtime

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon set

### AI Providers
- **OpenAI SDK** - GPT-4o, GPT-4 Turbo
- **Google AI SDK** - Gemini 2.5 Pro/Flash
- **Anthropic SDK** - Claude 4.5 Sonnet

### Build Tools
- **electron-builder** - Package & distribute
- **pnpm** - Package manager
- **GitHub Actions** - CI/CD

## 🏗️ System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Electron App                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Renderer   │◄───────►│ Main Process │             │
│  │   (React)    │   IPC   │  (Node.js)   │             │
│  └──────────────┘         └──────────────┘             │
│         │                        │                      │
│         ▼                        ▼                      │
│  ┌──────────────┐         ┌──────────────┐             │
│  │     UI       │         │  AI Provider │             │
│  │  Components  │         │   Factory    │             │
│  └──────────────┘         └──────────────┘             │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌────────────────┐        ┌──────────────┐
│  LocalStorage  │        │ File System  │
│    (Cache)     │        │  Operations  │
└────────────────┘        └──────────────┘
```

### Data Flow

```
1. User selects folders → Scanner collects file info
2. AI Provider analyzes files → Returns classifications
3. Renderer shows preview → User reviews results
4. Main Process moves files → Stores undo history
5. Success notification + undo option
```

## 💻 Development

```bash
# Clone & Install
git clone https://github.com/RaiA133/SortFiles.git
cd SortFiles
pnpm install

# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production

# Packaging
pnpm package:linux          # Build .deb + .AppImage
pnpm package:win            # Build .exe (Windows)
pnpm package:mac            # Build .dmg (macOS)
```

### Project Structure

```
packages/
├── core/                   # Shared business logic
├── ai-providers/           # AI provider implementations
│   ├── openai/
│   ├── gemini/
│   └── claude/
└── desktop-app/            # Electron app
    ├── src/main/          # Main process (Node.js)
    ├── src/renderer/      # Frontend (React)
    └── build/             # Icons & resources
```

## 🔧 Configuration

**API Keys Setup:**

- **OpenAI**: Get key at https://platform.openai.com/api-keys
- **Gemini**: Get key at https://aistudio.google.com/api-keys
- **Claude**: Get key at https://platform.claude.com/settings/keys

Config stored in:
- **Linux**: `~/.config/SortFiles/config.json`
- **macOS**: `~/Library/Application Support/SortFiles/config.json`
- **Windows**: `%APPDATA%/SortFiles/config.json`

## 🐛 Troubleshooting

**"API Key Invalid"**
→ Check key is correct and active in provider dashboard

**"Rate Limit Exceeded"**
→ Wait a few minutes or try different provider

**"Files Not Moving"**
→ Check file permissions and destination is writable

**"App Won't Start"**
→ Clear config: `rm -rf ~/.config/SortFiles` (Linux)

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 📮 Support

- [Issues](https://github.com/RaiA133/SortFiles/issues)
- [Discussions](https://github.com/RaiA133/SortFiles/discussions)

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/RaiA133">RaiA133</a>
</div>

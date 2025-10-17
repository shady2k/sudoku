# Sudoku Game

A modern, offline-first Sudoku game built with Svelte 5 and TypeScript. Play classic Sudoku puzzles with real-time validation, keyboard/mouse support, and auto-save functionality.

## 🎮 Play Now

**[Play Sudoku →](https://shady2k.github.io/sudoku/)**

## ✨ Features

- **🧩 Multiple Difficulty Levels** - Easy, Medium, Hard, and Expert puzzles
- **⌨️ Keyboard & Mouse Support** - Play your way with full input options
- **✅ Real-time Validation** - Instant feedback on mistakes
- **💾 Auto-save** - Never lose your progress
- **🎨 Clean UI** - Modern, responsive design
- **📱 Mobile Friendly** - Works seamlessly on all devices
- **🔒 Offline-first** - No server required, all data stored locally
- **⏱️ Timer** - Track how long it takes to solve puzzles
- **🎯 Hints** - Get help when you're stuck

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/shady2k/sudoku.git
cd sudoku

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Code Quality
npm run lint             # Run ESLint and TypeScript checks
npm run typecheck        # Run TypeScript type checking

# Build & Deploy
npm run build            # Build for production
npm run release patch    # Create patch release (1.0.0 -> 1.0.1)
npm run release minor    # Create minor release (1.0.0 -> 1.1.0)
npm run release major    # Create major release (1.0.0 -> 2.0.0)
```

## 🏗️ Tech Stack

- **Framework**: Svelte 5
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7
- **Testing**: Vitest + Playwright
- **Linting**: ESLint
- **Styling**: CSS
- **Storage**: LocalStorage

## 🎯 Game Features

### Puzzle Generation
- Custom backtracking algorithm with seed-based transformation
- Guarantees unique solutions
- Adjustable difficulty levels based on number of given cells

### User Interface
- Cell highlighting and selection
- Number input with validation
- Notes/pencil marks support
- Undo/redo functionality
- Mistake tracking
- Progress persistence

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Core game logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: Full user workflows with Playwright

## 📝 Development

### Project Structure

```
sudoku/
├── src/
│   ├── components/     # Svelte components
│   ├── services/       # Game logic and utilities
│   ├── stores/         # Svelte stores
│   └── App.svelte      # Main app component
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # E2E tests
└── public/            # Static assets
```

### Code Style

- Strict TypeScript mode enabled
- ESLint with zero warnings policy
- Prettier for code formatting

## 🚢 Deployment

The app is automatically deployed to GitHub Pages on tagged releases:

```bash
# Create and push a new release
npm run release patch
git push --follow-tags
```

This triggers the GitHub Actions workflow that builds and deploys to:
**https://shady2k.github.io/sudoku/**

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Alexandr Korachentsov**

- GitHub: [@shady2k](https://github.com/shady2k)

## 🙏 Acknowledgments

- Built with [Svelte](https://svelte.dev/)
- Powered by [Vite](https://vitejs.dev/)
- Deployed on [GitHub Pages](https://pages.github.com/)

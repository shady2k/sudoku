# Quick Start Guide: Offline Sudoku Game

**Date**: 2025-10-16
**Feature**: 001-offline-sudoku-game

This guide provides quick reference information for developers starting work on the offline Sudoku game implementation.

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Language** | TypeScript 5.x (strict mode) | Type-safe game logic and UI |
| **UI Framework** | Svelte 5 | Minimal bundle size (1.8KB), built-in reactivity |
| **Build Tool** | Vite 7 | Fast HMR, PWA support, TypeScript-first |
| **Testing** | Vitest + Playwright + Testing Library | Unit, integration, E2E, performance |
| **State Management** | Svelte 5 Runes ($state, $derived, $effect) | Zero-dependency reactivity |
| **Storage** | LocalStorage API | Offline persistence (max 5-10MB) |
| **PWA** | @vite-pwa/sveltekit | Service Worker, offline support |

---

## Project Structure

```
src/
├── core/                 # Pure TypeScript game logic (no UI)
│   ├── puzzle/          # Puzzle generation & validation
│   ├── game/            # Session management, moves, candidates
│   └── types/           # TypeScript interfaces
├── storage/             # LocalStorage persistence layer
├── ui/                  # Svelte components
│   ├── components/      # Grid, Cell, Controls, Timer, History
│   ├── hooks/           # useGame, useKeyboard, useTimer
│   └── styles/
└── app.ts               # Entry point

tests/
├── unit/                # Pure function tests (100% coverage required)
├── integration/         # Game flow tests
└── e2e/                 # Full user journey tests (Playwright)
```

---

## Key Requirements at a Glance

### Performance Targets
- Puzzle generation: <2s (SC-007)
- Move validation: <10ms (Constitution II)
- UI feedback: <50ms (SC-009)
- State persistence: <500ms (SC-011)

### Functional Must-Haves (P1)
- ✅ Offline-first (no server, 100% LocalStorage)
- ✅ Real-time move validation with visual feedback
- ✅ Keyboard + mouse navigation
- ✅ Auto-save/resume on browser close
- ✅ Timer with auto-pause on idle (5 minutes)
- ✅ 50-step undo history

### Quality Gates (Constitution)
- ✅ 100% test coverage on `src/core/`
- ✅ 80%+ test coverage on `src/ui/`
- ✅ Zero TypeScript errors (`any` forbidden)
- ✅ Zero linting warnings
- ✅ TDD RED-GREEN-REFACTOR cycle enforced

---

## Development Workflow

### 1. Initial Setup

```bash
# Create project with Vite + Svelte + TypeScript
npm create vite@latest sudoku -- --template svelte-ts

cd sudoku

# Install dependencies
npm install

# Install dev dependencies
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D playwright @playwright/test
npm install -D @testing-library/svelte @testing-library/user-event
npm install -D @vite-pwa/sveltekit

# Initialize Playwright
npx playwright install
```

### 2. Configure TypeScript (strict mode)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 3. Configure Vitest

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      thresholds: {
        'src/core/**': { lines: 100, functions: 100, branches: 100 },
        'src/ui/**': { lines: 80, functions: 80, branches: 80 }
      }
    }
  }
})
```

### 4. TDD Workflow

**Step 1: RED** - Write failing test
```typescript
// tests/unit/puzzle/validator.test.ts
import { describe, it, expect } from 'vitest'
import { isValidMove } from '../../../src/core/puzzle/validator'

describe('isValidMove', () => {
  it('should return false when number exists in row', () => {
    const board = createEmptyBoard()
    board[0][1] = 5
    expect(isValidMove(board, { row: 0, col: 0 }, 5)).toBe(false)
  })
})
```

**Step 2: GREEN** - Minimal implementation
```typescript
// src/core/puzzle/validator.ts
export function isValidMove(
  board: readonly (readonly number[])[],
  position: CellPosition,
  value: SudokuNumber
): boolean {
  // Check row
  for (let col = 0; col < 9; col++) {
    if (col !== position.col && board[position.row][col] === value) {
      return false
    }
  }

  // TODO: Check column and box
  return true
}
```

**Step 3: REFACTOR** - Improve while tests stay green

**Step 4: Run tests**
```bash
npm run test -- --watch  # <100ms feedback loop
```

### 5. Package Scripts

**package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:bench": "vitest bench",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx,.svelte",
    "format": "prettier --write ."
  }
}
```

---

## Key Implementation Notes

### Puzzle Generation Strategy

Use **hybrid approach**: Seed transformation + backtracking verification

```typescript
// Phase 1 (MVP): Use sudoku-core library for rapid prototyping
import { generate } from 'sudoku-core'

const puzzle = generate('medium')

// Phase 2: Replace with custom implementation
// - Pre-generate 10-20 seed puzzles
// - Apply transformations (rotations, shuffles, swaps)
// - Remove cells strategically
// - Verify uniqueness + logic-solvability
```

### State Management with Svelte 5 Runes

```svelte
<script lang="ts">
import { createGameSession } from '$lib/core/game/session'

// Reactive state
let game = $state<GameSession>(null)
let timer = $state(0)

// Derived values
let isCompleted = $derived(game?.isCompleted ?? false)
let canUndo = $derived(game?.history.currentIndex > 0)

// Effects
$effect(() => {
  if (game && !game.isPaused) {
    const interval = setInterval(() => {
      timer = game.elapsedTime + (Date.now() - game.lastActivityAt)
    }, 100)

    return () => clearInterval(interval)
  }
})
</script>
```

### LocalStorage Persistence

```typescript
// Auto-save after every action
async function saveGame(session: GameSession): Promise<void> {
  try {
    const serialized = JSON.stringify(session)
    localStorage.setItem('sudoku:current-session', serialized)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      await archiveOldRecords(100) // Keep most recent 100 records
      // Retry save
      localStorage.setItem('sudoku:current-session', serialized)
    }
  }
}

// Auto-load on app start
async function loadGame(): Promise<GameSession | null> {
  const stored = localStorage.getItem('sudoku:current-session')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null // Corrupted data, start fresh
  }
}
```

---

## Common Patterns

### Cell Validation (FR-005)

```typescript
function validateCell(
  board: number[][],
  position: CellPosition
): boolean {
  const value = board[position.row][position.col]
  if (value === 0) return true // Empty is always valid

  // Check row
  for (let col = 0; col < 9; col++) {
    if (col !== position.col && board[position.row][col] === value) {
      return false
    }
  }

  // Check column
  for (let row = 0; row < 9; row++) {
    if (row !== position.row && board[row][position.col] === value) {
      return false
    }
  }

  // Check 3x3 box
  const boxRow = Math.floor(position.row / 3) * 3
  const boxCol = Math.floor(position.col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== position.row && c !== position.col && board[r][c] === value) {
        return false
      }
    }
  }

  return true
}
```

### Error Counting (FR-010)

Only increment error count when invalid entry **remains** after cell deselection:

```typescript
function onCellDeselect(session: GameSession, position: CellPosition): GameSession {
  const cell = session.cells[position.row][position.col]

  if (cell.value !== 0 && !validateCell(session.board, position)) {
    // Invalid entry persisted, increment error count
    return { ...session, errorCount: session.errorCount + 1 }
  }

  return session
}
```

### Keyboard Navigation (FR-007)

```typescript
function handleKeyDown(event: KeyboardEvent, session: GameSession): GameSession {
  const selected = session.selectedCell
  if (!selected) return session

  switch (event.key) {
    case 'ArrowUp':
      return selectCell(session, { ...selected, row: Math.max(0, selected.row - 1) })
    case 'ArrowDown':
      return selectCell(session, { ...selected, row: Math.min(8, selected.row + 1) })
    case 'ArrowLeft':
      return selectCell(session, { ...selected, col: Math.max(0, selected.col - 1) })
    case 'ArrowRight':
      return selectCell(session, { ...selected, col: Math.min(8, selected.col + 1) })
    case '1': case '2': case '3': case '4': case '5':
    case '6': case '7': case '8': case '9':
      return makeMove(session, selected, parseInt(event.key))
    case 'Backspace': case 'Delete':
      return clearCell(session, selected)
    default:
      return session
  }
}
```

---

## Testing Examples

### Unit Test (Pure Function)

```typescript
describe('DifficultyToClues', () => {
  it('should map difficulty 1 to 50 clues (easiest)', () => {
    expect(difficultyToClues(1)).toBe(50)
  })

  it('should map difficulty 10 to 17 clues (hardest)', () => {
    expect(difficultyToClues(10)).toBe(17)
  })

  it('should return values within valid range', () => {
    for (let d = 1; d <= 10; d++) {
      const clues = difficultyToClues(d as DifficultyLevel)
      expect(clues).toBeGreaterThanOrEqual(17)
      expect(clues).toBeLessThanOrEqual(50)
    }
  })
})
```

### Integration Test (Game Flow)

```typescript
describe('Complete Game Flow', () => {
  it('should play full game with undo', async () => {
    const session = await createGameSession(5) // Medium
    expect(session.success).toBe(true)

    let game = session.data

    // Make moves
    game = makeMove(game, { row: 0, col: 0 }, 5).data
    game = makeMove(game, { row: 0, col: 1 }, 3).data

    expect(game.history.actions.length).toBe(2)

    // Undo
    game = undoMove(game).data
    expect(game.board[0][1]).toBe(0)
    expect(game.history.currentIndex).toBe(0)
  })
})
```

### E2E Test (User Journey)

```typescript
test('should play game with keyboard only', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("New Game")')

  // Navigate with arrow keys
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowDown')

  // Enter number
  await page.keyboard.press('5')

  // Verify cell updated
  const cell = page.locator('[data-row="1"][data-col="1"]')
  await expect(cell).toHaveText('5')

  // Verify no errors
  await expect(cell).not.toHaveClass(/error/)
})
```

---

## Performance Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  bench('puzzle generation', () => {
    generatePuzzle(5)
  }, { time: 2000 }) // Must complete in <2s

  bench('move validation', () => {
    isValidMove(testBoard, { row: 0, col: 0 }, 5)
  }, { time: 10 }) // Must complete in <10ms

  bench('state persistence', async () => {
    await saveGameSession(testSession)
  }, { time: 500 }) // Must complete in <500ms
})
```

---

## Debugging Tips

### Vitest Watch Mode

```bash
npm run test -- --watch
# - Filters: Press 'p' to filter by filename, 't' by test name
# - UI: Press 'u' to launch Vitest UI in browser
# - Coverage: Press 'c' to see coverage report
```

### Playwright Debug Mode

```bash
npm run test:e2e -- --debug
# - Step through tests with Playwright Inspector
# - Pause on failures with await page.pause()
```

### LocalStorage Inspection

```javascript
// Browser console
localStorage.getItem('sudoku:current-session')
JSON.parse(localStorage.getItem('sudoku:current-session'))
```

---

## Next Steps

1. **Phase 0 Complete**: All research decisions made (see `research.md`)
2. **Phase 1 Complete**: Data model and API contracts defined
3. **Phase 2**: Generate tasks with `/speckit.tasks`
4. **Phase 3**: Begin TDD implementation following `tasks.md`

**Ready to start implementation!**

---

## Reference Documents

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research Findings**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Constitution**: [../../.specify/memory/constitution.md](../../.specify/memory/constitution.md)

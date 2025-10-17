# Data Model: Offline Sudoku Game

**Date**: 2025-10-16
**Feature**: 001-offline-sudoku-game

This document defines the data structures and their relationships for the offline Sudoku game.

---

## Core Entities

### Puzzle

Represents the Sudoku grid with initial clues and solution.

**TypeScript Definition:**
```typescript
interface Puzzle {
  /** 9x9 grid of cells (0 = empty, 1-9 = clue/solution) */
  grid: number[][];

  /** Pre-solved solution grid for validation */
  solution: number[][];

  /** Bitmask indicating which cells are pre-filled clues (immutable) */
  clues: boolean[][];

  /** Difficulty rating (number of clues provided, 17-50) */
  difficultyRating: number;

  /** Unique identifier for puzzle (for replay feature) */
  puzzleId: string;

  /** Timestamp when puzzle was generated */
  generatedAt: number;
}
```

**Validation Rules:**
- `grid` must be 9x9 array with values 0-9
- `solution` must be 9x9 array with values 1-9 (fully solved)
- `clues` must match positions where `grid` has non-zero values
- `difficultyRating` must be between 17 (minimum for unique solution) and 50 (maximum clues)
- `puzzleId` must be unique across all generated puzzles
- Puzzle must have unique solution solvable by logic only (no guessing)

**Relationships:**
- Referenced by `GameSession.puzzle`
- Referenced by `GameRecord.puzzleId` (for replay)

---

### Cell

Represents a single position in the 9x9 grid with its current state.

**TypeScript Definition:**
```typescript
interface Cell {
  /** Row position (0-8) */
  row: number;

  /** Column position (0-8) */
  col: number;

  /** Current value (0 = empty, 1-9 = filled) */
  value: number;

  /** Whether this is a pre-filled clue (immutable) */
  isClue: boolean;

  /** Whether the current value violates Sudoku rules */
  isError: boolean;

  /** Manually entered candidate numbers (user pencil marks) */
  manualCandidates: Set<number>;

  /** Auto-generated candidate numbers (if "Show Candidates" active) */
  autoCandidates: Set<number> | null;
}
```

**Validation Rules:**
- `row` and `col` must be 0-8
- `value` must be 0-9
- If `isClue` is true, `value` cannot be changed
- `isError` is calculated by validating against Sudoku rules (row, column, 3x3 box)
- `manualCandidates` can contain 1-9, persists across sessions
- `autoCandidates` is null when "Show Candidates" is off, regenerated on demand

**State Transitions:**
- Empty → Filled: User enters number (triggers validation, automatic candidate elimination per FR-012 if valid)
- Filled → Empty: User deletes number (clears error state, restores candidates)
- Error detection: Triggered on every cell value change or focus change (FR-010)
- Automatic Candidate Elimination (FR-012): When valid number entered in any cell, that number is automatically removed from candidates in all cells in the same row, column, and 3x3 square; invalid entries (rule violations) do NOT trigger elimination

**3x3 Box Calculation:**
```typescript
function getBoxIndex(row: number, col: number): [number, number] {
  return [Math.floor(row / 3), Math.floor(col / 3)];
}
```

---

### GameSession

Represents a single playthrough of a Sudoku puzzle with all current state.

**TypeScript Definition:**
```typescript
interface GameSession {
  /** Unique identifier for this session */
  sessionId: string;

  /** The puzzle being played */
  puzzle: Puzzle;

  /** Current board state (9x9 grid with user progress) */
  board: number[][];

  /** Cell metadata (errors, candidates, etc.) */
  cells: Cell[][];

  /** Timestamp when game started */
  startTime: number;

  /** Total elapsed time in milliseconds (excluding paused time) */
  elapsedTime: number;

  /** Whether timer is currently paused */
  isPaused: boolean;

  /** Timestamp when timer was paused (null if not paused) */
  pausedAt: number | null;

  /** Difficulty level (1-10 scale mapped to clue count) */
  difficultyLevel: number;

  /** Count of errors made (only counts persistent invalid entries per FR-010) */
  errorCount: number;

  /** Whether puzzle is completed */
  isCompleted: boolean;

  /** Timestamp when last action occurred (for auto-pause detection) */
  lastActivityAt: number;

  /** Currently selected cell (null if none) */
  selectedCell: { row: number; col: number } | null;

  /** Whether auto-candidates are currently showing */
  showAutoCandidates: boolean;
}
```

**Validation Rules:**
- `sessionId` must be unique
- `board` must mirror `puzzle.grid` structure (9x9)
- `elapsedTime` only increments when `isPaused` is false
- `pausedAt` is non-null only when `isPaused` is true
- `difficultyLevel` must be 1-10 (maps to clue counts via difficulty slider)
- `errorCount` only increments when invalid entry persists after cell deselection (FR-010)
- `isCompleted` is true only when all cells filled and no errors

**State Transitions:**
- Active → Paused: User idle for 5 minutes (FR-017) or loses page focus (FR-023)
- Paused → Active: User interacts with game (click, keypress, mouse move)
- In Progress → Completed: All cells filled correctly, triggers completion screen

**Persistence:**
- Automatically saved to LocalStorage after every user action (FR-002)
- Restored on page load (FR-003)
- Saved state includes timer pause state and elapsed time

---

### ActionHistory

Represents the undo/redo stack for game moves.

**TypeScript Definition:**
```typescript
interface ActionHistory {
  /** Stack of actions (most recent last) */
  actions: Action[];

  /** Current position in history (for undo/redo) */
  currentIndex: number;

  /** Maximum history size (50 steps per clarification) */
  maxSize: number;
}

interface Action {
  /** Type of action */
  type: 'SET_VALUE' | 'CLEAR_VALUE' | 'SET_CANDIDATES' | 'CLEAR_CANDIDATES';

  /** Cell affected */
  cell: { row: number; col: number };

  /** Previous value/state (for undo) */
  previousValue: number | Set<number>;

  /** New value/state (for redo) */
  newValue: number | Set<number>;

  /** Timestamp when action occurred */
  timestamp: number;

  /**
   * Candidates eliminated by automatic elimination (FR-012)
   * Only populated when type is 'SET_VALUE' and the value is valid
   * Maps cell index to Set of candidates that were removed
   * Used for full state restoration on undo
   */
  eliminatedCandidates?: Map<number, Set<number>>;
}
```

**Validation Rules:**
- `actions` array limited to 50 entries (FR-022)
- Oldest actions removed when limit exceeded (FIFO)
- `currentIndex` must be within `actions` bounds
- `maxSize` fixed at 50

**Operations:**
- **Push**: Add new action, truncate future actions if not at end, enforce size limit; for 'SET_VALUE' actions with valid moves, capture `eliminatedCandidates` snapshot for undo restoration (FR-012, FR-022)
- **Undo**: Revert to `actions[currentIndex - 1]`, decrement `currentIndex`; if action has `eliminatedCandidates`, restore all eliminated candidates to affected cells (full state restoration per FR-022)
- **Redo**: Apply `actions[currentIndex + 1]`, increment `currentIndex`; re-apply candidate elimination if action has `eliminatedCandidates`

**Pers istance:**
- Saved with `GameSession` to LocalStorage
- Restored on session resume

---

### GameRecord

Represents a completed game stored in history for performance tracking.

**TypeScript Definition:**
```typescript
interface GameRecord {
  /** Unique identifier */
  recordId: string;

  /** Completion date/time */
  completedAt: number;

  /** Total elapsed time (milliseconds) */
  totalTime: number;

  /** Total errors made during game */
  errorCount: number;

  /** Difficulty level (1-10) */
  difficultyLevel: number;

  /** Puzzle identifier (for potential replay) */
  puzzleId: string;

  /** Whether this is a personal best for this difficulty */
  isPersonalBest: {
    fastestTime: boolean;
    fewestErrors: boolean;
  };
}
```

**Validation Rules:**
- `recordId` must be unique
- `completedAt` is Unix timestamp in milliseconds
- `totalTime` is total elapsed time (excluding paused periods)
- `errorCount` matches final error count from `GameSession`
- `difficultyLevel` matches `GameSession.difficultyLevel`
- `isPersonalBest` flags calculated on save by comparing to existing records

**Storage:**
- Stored in LocalStorage as array of records
- Limited to 1000 records (SC-006), oldest removed when exceeded
- Indexed by completion date for sorting

**Query Operations:**
- Sort by date, time, errors, difficulty
- Filter by difficulty level
- Calculate statistics (average time, best time, average errors, total games)

---

### UserPreferences

Represents player settings and preferences persisted across sessions.

**TypeScript Definition:**
```typescript
interface UserPreferences {
  /** Preferred difficulty level (1-10) */
  defaultDifficulty: number;

  /** Candidate mode preference */
  candidateMode: 'auto' | 'manual' | 'off';

  /** Theme/appearance settings */
  theme: {
    darkMode: boolean;
    highlightColor: string;
    errorColor: string;
  };

  /** Keyboard shortcuts (customizable) */
  keyboardShortcuts: {
    undo: string;
    redo: string;
    newGame: string;
    toggleCandidates: string;
    [key: string]: string;
  };

  /** History display preferences */
  historyPreferences: {
    sortBy: 'date' | 'time' | 'errors' | 'difficulty';
    sortOrder: 'asc' | 'desc';
    filterDifficulty: number | null;
  };

  /** Auto-pause timeout in minutes (default: 5) */
  autoPauseTimeout: number;
}
```

**Validation Rules:**
- `defaultDifficulty` must be 1-10
- `candidateMode` must be one of the enum values
- `autoPauseTimeout` must be positive integer (minutes)
- `keyboardShortcuts` must not have duplicate bindings

**Persistence:**
- Saved to LocalStorage on every change
- Loaded on application start
- Survives across sessions and game completions

---

## Data Relationships

```
┌─────────────────┐
│  UserPreferences│
│  (singleton)    │
└─────────────────┘

┌─────────────────┐
│     Puzzle      │
│                 │
└────────┬────────┘
         │ 1
         │
         │ referenced by
         │
         ▼ 1
┌─────────────────┐
│   GameSession   │◄──┐
│                 │   │
│  ┌───────────┐  │   │ contains
│  │   Cell    │  │   │
│  │  (9x9)    │  │   │
│  └───────────┘  │   │
│                 │   │
│  ┌────────────┐ │   │
│  │ActionHistory│◄──┘
│  └────────────┘ │
└────────┬────────┘
         │
         │ on completion
         │
         ▼ *
┌─────────────────┐
│   GameRecord    │
│  (up to 1000)   │
└─────────────────┘
```

---

## LocalStorage Schema

**Keys:**
- `sudoku:current-session`: Current `GameSession` (JSON)
- `sudoku:preferences`: `UserPreferences` (JSON)
- `sudoku:history`: Array of `GameRecord` (JSON, max 1000)
- `sudoku:version`: Schema version number (for migrations)

**Size Estimates:**
- Current session: ~5-10KB
- Preferences: ~1KB
- History (1000 records): ~500KB-1MB
- Total: ~500KB-1.1MB (well under 5-10MB LocalStorage quota)

**Serialization:**
```typescript
// Save
localStorage.setItem('sudoku:current-session', JSON.stringify(session));

// Load
const session: GameSession = JSON.parse(localStorage.getItem('sudoku:current-session') || 'null');

// Handle Sets (manual candidates)
// Before save: Convert Set to Array
// After load: Convert Array back to Set
```

**Error Handling:**
- Gracefully handle `QuotaExceededError` by archiving old history
- Validate deserialized data structure before use
- Provide fallback defaults if data corrupted

---

## Type Safety Notes

All interfaces defined with TypeScript strict mode:
- No `any` types (Constitution Principle VI)
- Explicit null/undefined handling
- Discriminated unions for action types
- Readonly arrays where immutability required

**Example Strict Type:**
```typescript
interface Cell {
  readonly row: number; // Immutable after creation
  readonly col: number; // Immutable after creation
  value: number; // Mutable (user input)
  readonly isClue: boolean; // Immutable
  isError: boolean; // Mutable (recalculated)
  manualCandidates: Set<number>; // Mutable
  autoCandidates: Set<number> | null; // Nullable, mutable
}
```

---

## Migration Strategy

**Schema Versioning:**
```typescript
interface StorageSchema {
  version: number;
  data: unknown;
}

function migrateSchema(stored: StorageSchema): GameSession {
  switch (stored.version) {
    case 1:
      return migrateV1toV2(stored.data);
    case 2:
      return stored.data as GameSession;
    default:
      throw new Error(`Unsupported schema version: ${stored.version}`);
  }
}
```

**Breaking Changes:**
- Increment version number
- Provide migration function
- Test with real LocalStorage data

---

This data model provides complete type safety, clear relationships, and efficient persistence for all game requirements (FR-001 through FR-023, SC-001 through SC-012).

# Implementation Tasks: Offline Sudoku Game

**Feature**: Offline Sudoku Game
**Branch**: `001-offline-sudoku-game`
**Date**: 2025-10-16
**Total Tasks**: 149

This document provides a dependency-ordered task list for implementing the offline Sudoku game. Tasks are organized by user story (P1, P2, P3) following the Test-Driven Development (TDD) approach mandated by Constitution Principle III.

---

## Task Format Legend

```
- [ ] [TaskID] [P] [Story] Description with file path
```

- **TaskID**: Sequential identifier (T001, T002, etc.)
- **[P]**: Parallelizable task (can run concurrently with other [P] tasks in same phase)
- **[Story]**: User story label (e.g., [US1], [US2]) - only for user story phases
- **Description**: Clear action with exact file path

---

## Phase 1: Project Setup (9 tasks)

**Goal**: Initialize project structure, dependencies, and development tooling per Constitution Principle III (TDD).

### Tasks

- [X] T001 Initialize npm project with package.json in repository root
- [X] T001a [P] Create app.html with viewport meta tag for mobile support (width=device-width, initial-scale=1)
- [X] T002 [P] Install dependencies: svelte@5, vite@7, typescript@5, vitest, playwright, @testing-library/svelte
- [X] T003 [P] Create tsconfig.json with strict mode enabled (noImplicitAny, strictNullChecks, noUnusedLocals)
- [X] T004 [P] Create vite.config.ts with Svelte plugin and base path for GitHub Pages
- [X] T005 [P] Create vitest.config.ts for unit/integration tests
- [X] T006 [P] Create playwright.config.ts for E2E tests with sharding
- [X] T007 [P] Create eslint.config.js with TypeScript rules and zero warnings policy
- [X] T008 Create GitHub Actions workflow file at .github/workflows/ci-cd.yml with quality gates

**Acceptance**: All config files created, `npm install` succeeds, `npm run lint` passes with zero warnings.

---

## Phase 2: Foundational Types & Utilities (12 tasks)

**Goal**: Implement core data models and utilities used across all user stories. These are blocking prerequisites.

### Tasks

- [X] T009 [P] TEST: Write validation tests for Cell type in tests/unit/models/Cell.test.ts
- [X] T010 [P] Implement Cell interface in src/lib/models/Cell.ts per data-model.md
- [X] T011 [P] TEST: Write validation tests for Puzzle type in tests/unit/models/Puzzle.test.ts
- [X] T012 [P] Implement Puzzle interface in src/lib/models/Puzzle.ts with clue validation
- [X] T013 [P] TEST: Write validation tests for GameSession type in tests/unit/models/GameSession.test.ts
- [X] T014 [P] Implement GameSession interface in src/lib/models/GameSession.ts
- [X] T015 [P] TEST: Write tests for bitwise validation in tests/unit/utils/validation.test.ts
- [X] T016 [P] Implement bitwise validation helpers in src/lib/utils/validation.ts (target: <10ms per FR-005)
- [X] T017 [P] TEST: Write tests for seeded RNG in tests/unit/utils/seededRandom.test.ts
- [X] T018 [P] Implement SeededRandom class in src/lib/utils/seededRandom.ts for reproducible puzzles
- [X] T019 [P] TEST: Write serialization tests in tests/unit/utils/serialization.test.ts
- [X] T020 [P] Implement JSON serialization helpers in src/lib/utils/serialization.ts (Set ↔ Array conversion)

**Acceptance**: All model types defined with strict TypeScript, all utility tests pass, bitwise validation < 10ms.

---

## Phase 3: User Story 1 - Play a New Game with Immediate Feedback (P1) (28 tasks)

**Goal**: Implement core gameplay: puzzle generation, real-time validation, timer, visual highlighting. This is the MVP.

**Independent Test Criteria**: Can start a new game, fill in correct/incorrect numbers, see immediate error feedback, track time, complete puzzle.

### Tasks

#### Puzzle Generation & Validation (TDD)

- [X] T021 [P] [US1] TEST: Write puzzle generator tests in tests/unit/services/PuzzleGenerator.test.ts (target: <500ms per SC-007)
- [X] T022 [US1] Implement complete grid generation using backtracking in src/lib/services/PuzzleGenerator.ts
- [X] T023 [US1] Implement seed transformation (rotations, permutations) in src/lib/services/PuzzleGenerator.ts
- [X] T024 [US1] Implement strategic cell removal with uniqueness verification in src/lib/services/PuzzleGenerator.ts
- [X] T025 [P] [US1] TEST: Write constraint propagation solver tests in tests/unit/services/PuzzleSolver.test.ts
- [X] T026 [US1] Implement Norvig-style constraint propagation solver in src/lib/services/PuzzleSolver.ts
- [X] T027 [US1] Implement unique solution verification using backtracking counter in src/lib/services/PuzzleSolver.ts
- [X] T027a [US1] Verify generated puzzles are logic-solvable using constraint propagation (T026) without backtracking - reject and retry if guessing required per FR-001
- [X] T028 [P] [US1] TEST: Write real-time validator tests in tests/unit/services/GameValidator.test.ts (target: <10ms)
- [X] T029 [US1] Implement FastValidator with bitwise masks in src/lib/services/GameValidator.ts
- [X] T030 [US1] Implement validateMove() function using bitwise operations per game-api.ts contract

#### Game Session Management (TDD)

- [X] T031 [P] [US1] TEST: Write game session creation tests in tests/integration/game-session.test.ts
- [X] T032 [US1] Implement createGameSession() as pure function in src/lib/services/GameSession.ts (module exports, not class) per game-api.ts contract
- [X] T033 [US1] Implement makeMove() with error detection per FR-010 (error counted on cell deselection)
- [X] T034 [US1] Implement selectCell() with error count increment logic
- [X] T035 [US1] Implement isPuzzleCompleted() per game-api.ts contract

#### Timer Service (TDD)

- [X] T036 [P] [US1] TEST: Write timer service tests in tests/unit/services/TimerService.test.ts
- [X] T037 [US1] Implement updateTimer() in src/lib/services/TimerService.ts
- [X] T038 [US1] Implement pauseTimer() and resumeTimer() functions

#### Svelte Stores (Reactive State)

- [X] T039 [P] [US1] TEST: Write game store tests in tests/unit/stores/gameStore.test.ts
- [X] T040 [US1] Implement gameStore using Svelte 5 runes ($state, $derived) in src/lib/stores/gameStore.svelte.ts
- [X] T041 [US1] Add reactive timer update logic to gameStore

#### UI Components (TDD with Testing Library)

- [X] T042 [P] [US1] TEST: Write Cell component tests in tests/unit/components/Cell.test.ts
- [X] T043 [US1] Implement Cell.svelte with error highlighting, row/column/box highlighting per FR-006, and minimum 44×44px touch targets for mobile
- [X] T044 [P] [US1] TEST: Write SudokuGrid component tests in tests/unit/components/SudokuGrid.test.ts
- [X] T045 [US1] Implement SudokuGrid.svelte with 9×9 grid rendering and cell selection
- [X] T046 [P] [US1] TEST: Write Timer component tests in tests/unit/components/Timer.test.ts
- [X] T047 [US1] Implement Timer.svelte displaying MM:SS or HH:MM:SS format per FR-009
- [X] T048 [P] [US1] TEST: Write Statistics component tests in tests/unit/components/Statistics.test.ts
- [X] T049 [US1] Implement Statistics.svelte showing error count and difficulty level
- [X] T050 [P] [US1] TEST: Write Controls component tests in tests/unit/components/Controls.test.ts
- [X] T051 [US1] Implement Controls.svelte with New Game button

#### Main Page Integration

- [X] T052 [US1] Implement main game page in src/routes/+page.svelte integrating all US1 components
- [X] T053 [US1] Add global styles in src/app.css for modern responsive design (320px-4K per SC-005)
- [X] T054 [US1] Create app entry point in src/main.ts with Svelte app initialization

#### E2E Tests

- [X] T055 [US1] Implement E2E test for full gameplay flow in tests/e2e/gameplay.spec.ts per spec.md acceptance scenarios

**Deliverable**: Playable Sudoku game with real-time error validation, timer, and completion detection. This is the MVP.

---

## Phase 4: User Story 2 - Game State Persistence and Auto-Resume (P1) (15 tasks)

**Goal**: Implement LocalStorage persistence, auto-save, and resume functionality per FR-002, FR-003, FR-004.

**Independent Test Criteria**: Start game, make moves, close browser completely, reopen, verify all state restored (puzzle, timer, errors).

### Tasks

#### Storage Service (TDD)

- [X] T056 [P] [US2] TEST: Write storage service tests in tests/unit/services/StorageService.test.ts (target: <500ms save, <1s load per SC-011, SC-002)
- [X] T057 [US2] Implement TypedStorage wrapper class in src/lib/services/StorageService.ts with Zod validation
- [X] T058 [US2] Implement saveGameSession() per storage-api.ts contract with throttling (2-3 second interval)
- [X] T059 [US2] Implement loadGameSession() with schema validation and migration support
- [X] T060 [US2] Implement deleteGameSession() and hasSavedGame() functions
- [X] T061 [US2] Implement serializeGameSession() converting Sets to Arrays
- [X] T062 [US2] Implement deserializeGameSession() converting Arrays back to Sets
- [X] T063 [US2] Add QuotaExceededError handling with auto-prune fallback

#### Integration with Game Store

- [X] T064 [US2] Add auto-save logic to gameStore after every user action using throttle (not debounce)
- [X] T065 [US2] Implement auto-resume on app load in src/main.ts
- [X] T066 [US2] Implement "Resume or New Game" modal in src/components/Modal.svelte per FR-004

#### Page Focus/Blur Handling

- [X] T067 [US2] Implement page visibility listener in src/main.ts to pause timer on focus loss per FR-023
- [X] T068 [US2] Implement beforeunload event listener to save state before browser close per FR-019

#### E2E Tests

- [X] T069 [P] [US2] TEST: Write integration tests for storage in tests/integration/storage.test.ts
- [X] T070 [US2] Implement E2E test for persistence and resume in tests/e2e/persistence.spec.ts

**Deliverable**: Full offline game state persistence with seamless resume after browser closure.

---

## Phase 5: User Story 3 - Keyboard and Mouse Navigation (P1) (10 tasks)

**Goal**: Implement keyboard-only navigation, mouse/touch input, and hybrid input support per FR-007, FR-008.

**Independent Test Criteria**: Complete entire game using only keyboard, then complete another using only mouse.

### Tasks

#### Keyboard Navigation (TDD)

- [X] T071 [P] [US3] TEST: Write keyboard handler tests in tests/unit/components/SudokuGrid.test.ts
- [X] T072 [US3] Implement arrow key navigation (↑ ↓ ← →) in SudokuGrid.svelte
- [X] T073 [US3] Implement number key entry (1-9) in SudokuGrid.svelte
- [X] T074 [US3] Implement Delete/Backspace key to clear cells in SudokuGrid.svelte
- [X] T075 [US3] Add focus management to ensure keyboard events work correctly

#### Mouse/Touch Input

- [X] T076 [P] [US3] TEST: Write click handler tests in tests/unit/components/Cell.test.ts
- [X] T077 [US3] Implement click-to-select in Cell.svelte
- [X] T078 [US3] Implement number pad UI in src/components/Controls.svelte positioned to right of grid on desktop (hidden on mobile per clarification 2025-10-16)
- [X] T079 [US3] Add touch event support for mobile devices (touch-action: manipulation, -webkit-tap-highlight-color: transparent)

#### E2E Tests

- [X] T080 [US3] Implement E2E test for keyboard-only gameplay in tests/e2e/keyboard.spec.ts per spec.md acceptance scenarios

#### Layout Refinement (Critical for FR-020 compliance)

- [X] T080a [US3] Hide number pad on mobile (<768px) using CSS media query in Controls.svelte - add display:none for .number-pad on mobile
- [X] T080b [US3] Update App.svelte layout to position Sudoku grid on left and number pad on right using flexbox/grid on desktop (≥768px) per FR-020 clarification

**Deliverable**: Full keyboard-only and mouse-only gameplay support with hybrid input, with number pad positioned to right of grid on desktop.

---

## Phase 6: User Story 4 - Manual and Auto Candidate Numbers (P2) (9 tasks)

**Goal**: Implement manual pencil marks and auto-generated candidates per FR-011, FR-011a, FR-012.

**Independent Test Criteria**: Manually enter candidates, verify persistence, click "Show Candidates", verify auto-generation and updates.

### Tasks

#### Candidate Logic (TDD)

- [X] T081 [P] [US4] TEST: Write candidate generation tests in tests/unit/services/GameValidator.test.ts
- [X] T082 [US4] Implement generateCandidates() in GameValidator.ts per game-api.ts contract
- [X] T083 [US4] Implement setManualCandidates() in gameStore per game-api.ts contract
- [X] T084 [US4] Implement toggleAutoCandidates() in gameStore with auto-update logic per FR-012

#### UI Components

- [ ] T085 [P] [US4] TEST: Write CandidateNumbers component tests in tests/unit/components/CandidateNumbers.test.ts
- [ ] T086 [US4] Implement CandidateNumbers.svelte to display manual and auto candidates
- [ ] T087 [US4] Add "Show/Hide Candidates" button to Controls.svelte
- [ ] T088 [US4] Integrate candidate mode toggle with Cell.svelte

#### E2E Tests

- [ ] T089 [US4] Implement E2E test for candidate numbers in tests/e2e/candidates.spec.ts

**Deliverable**: Manual pencil marks and auto-generated candidates with automatic updates.

---

## Phase 7: User Story 5 - Flexible Difficulty Selection (P2) (6 tasks)

**Goal**: Implement continuous difficulty slider (1-10) per FR-021, replacing fixed presets.

**Independent Test Criteria**: Adjust difficulty slider, generate multiple puzzles, verify clue count matches difficulty.

### Tasks

#### Difficulty Mapping (TDD)

- [ ] T090 [P] [US5] TEST: Write difficulty mapping tests in tests/unit/services/PuzzleGenerator.test.ts
- [ ] T091 [US5] Implement difficultyToClues() function in PuzzleGenerator.ts (17-50 clue range)
- [ ] T092 [US5] Update generatePuzzle() to accept difficulty parameter (1-10)

#### UI Components

- [ ] T093 [P] [US5] TEST: Write DifficultySelector component tests in tests/unit/components/DifficultySelector.test.ts
- [ ] T094 [US5] Implement DifficultySelector.svelte with slider (1-10) and visual labels
- [ ] T095 [US5] Integrate DifficultySelector into new game modal/screen

**Deliverable**: Continuous difficulty scale with slider interface.

---

## Phase 8: User Story 6 - Number Highlighting for Pattern Recognition (P2) (4 tasks)

**Goal**: Implement number highlighting per FR-013 - when user clicks on a cell containing a number, all cells with that same number are highlighted.

**Independent Test Criteria**: Click on cell with number, verify all matching numbers highlighted with distinct visual style, click elsewhere, verify highlights removed.

### Tasks

- [ ] T096 [P] [US6] TEST: Write number highlighting tests in tests/unit/components/SudokuGrid.test.ts - test click on cell with number, verify all matching cells get 'highlighted-number' class
- [ ] T097 [US6] Add highlightedNumber state to gameStore.svelte.ts - track currently highlighted number (1-9 or null)
- [ ] T098 [US6] Update Cell.svelte to add click handler that sets highlightedNumber in gameStore when cell contains a value
- [ ] T099 [US6] Add CSS styles for highlighted-number class in app.css - distinct background color (e.g., light yellow #fff9c4) different from selected/related highlights

**Deliverable**: Number highlighting for pattern recognition - clicking any number highlights all instances of that number throughout the grid.

---

## Phase 9: User Story 7 - Auto-Pause on Idle (P3) (5 tasks)

**Goal**: Implement auto-pause after 5 minutes of inactivity per FR-017, FR-018.

**Independent Test Criteria**: Start game, wait 5 minutes idle, verify timer pauses, interact, verify timer resumes.

### Tasks

#### Idle Detection (TDD)

- [ ] T100 [P] [US7] TEST: Write idle detection tests in tests/unit/services/TimerService.test.ts
- [ ] T101 [US7] Implement shouldAutoPause() in TimerService.ts per game-api.ts contract
- [ ] T102 [US7] Add idle detection listeners (click, keypress, mousemove) in src/main.ts
- [ ] T103 [US7] Implement auto-resume on user interaction
- [ ] T104 [US7] Add "Paused (idle)" indicator to Timer.svelte

**Deliverable**: Automatic timer pause/resume on idle.

---

## Phase 10: User Story 8 - Game History and Performance Comparison (P3) (12 tasks)

**Goal**: Implement game history, statistics, and personal best tracking per FR-015, FR-016.

**Independent Test Criteria**: Complete multiple games at various difficulties, access history screen, verify records displayed with correct stats.

### Tasks

#### Data Models & Storage (TDD)

- [ ] T105 [P] [US8] TEST: Write GameRecord model tests in tests/unit/models/GameRecord.test.ts
- [ ] T106 [P] [US8] Implement GameRecord interface in src/lib/models/GameRecord.ts per data-model.md
- [ ] T107 [P] [US8] TEST: Write history storage tests in tests/unit/services/StorageService.test.ts
- [ ] T108 [US8] Implement saveGameRecord() with personal best calculation per storage-api.ts contract
- [ ] T109 [US8] Implement loadGameHistory() with 1000 record limit per SC-006
- [ ] T110 [US8] Implement calculateStatistics() per storage-api.ts contract

#### History Store

- [ ] T111 [P] [US8] TEST: Write history store tests in tests/unit/stores/historyStore.test.ts
- [ ] T112 [US8] Implement historyStore using Svelte 5 runes in src/lib/stores/historyStore.svelte.ts

#### UI Components & Page

- [ ] T113 [P] [US8] TEST: Write History component tests in tests/unit/components/History.test.ts
- [ ] T114 [US8] Implement History.svelte with sort/filter controls
- [ ] T115 [US8] Implement history page in src/routes/history/+page.svelte

#### E2E Tests

- [ ] T116 [US8] Implement E2E test for game history in tests/e2e/history.spec.ts

**Deliverable**: Full game history with statistics, sorting, filtering, and personal best tracking.

---

## Phase 11: Undo/Redo Functionality (5 tasks)

**Goal**: Implement undo/redo with 50-step history per FR-022.

### Tasks

#### Action History (TDD)

- [ ] T117 [P] TEST: Write action history tests in tests/unit/models/ActionHistory.test.ts
- [ ] T118 Implement ActionHistory model in src/lib/models/ActionHistory.ts per data-model.md
- [ ] T119 Implement undoMove() and redoMove() in gameStore per game-api.ts contract
- [ ] T120 Add undo/redo buttons to Controls.svelte with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] T121 Integrate action history with makeMove() and setManualCandidates()

**Deliverable**: Undo/redo functionality with 50-step history.

---

## Phase 12: User Preferences Persistence (6 tasks)

**Goal**: Implement user preferences storage per data-model.md.

### Tasks

- [ ] T122 [P] TEST: Write UserPreferences model tests in tests/unit/models/UserPreferences.test.ts
- [ ] T123 Implement UserPreferences interface in src/lib/models/UserPreferences.ts
- [ ] T124 Implement savePreferences() and loadPreferences() in StorageService.ts
- [ ] T125 Implement preferencesStore using Svelte 5 runes in src/lib/stores/preferencesStore.svelte.ts
- [ ] T126 Create preferences/settings page in src/routes/preferences/+page.svelte
- [ ] T127 Integrate default difficulty preference with new game flow

**Deliverable**: Persistent user preferences across sessions.

---

## Phase 13: Performance Optimization & Benchmarking (6 tasks)

**Goal**: Ensure all performance budgets met (Constitution Principle II).

### Tasks

- [ ] T128 [P] Create performance benchmark tests in tests/performance/puzzle-generation.bench.ts (target: <500ms per SC-007)
- [ ] T129 [P] Create performance benchmark tests in tests/performance/validation.bench.ts (target: <10ms)
- [ ] T130 [P] Create performance budget check script in scripts/check-performance-budget.js
- [ ] T131 Optimize puzzle generation if benchmark fails (consider worker threads)
- [ ] T132 Optimize bitwise validation if benchmark fails
- [ ] T133 Add performance benchmarks to CI/CD pipeline in .github/workflows/ci-cd.yml

**Deliverable**: All performance budgets met and enforced in CI.

---

## Phase 14: Polish & Cross-Cutting Concerns (8 tasks)

**Goal**: Final polish, edge case handling, and production readiness.

### Tasks

#### Error Handling & Edge Cases

- [ ] T134 Implement graceful LocalStorage unavailable fallback in src/main.ts
- [ ] T135 Implement corrupted data recovery in StorageService.ts
- [ ] T136 Implement storage quota exceeded handling with user-friendly message
- [ ] T137 Add multi-tab conflict detection with session locks

#### Accessibility & UX

- [ ] T138 Add ARIA labels to all interactive elements per SC-004
- [ ] T139 Test responsive design on 320px mobile and 4K desktop per SC-005
- [ ] T140 Add loading indicators for puzzle generation (perceived performance)
- [ ] T141 Implement completion celebration screen with stats per FR-014

**Deliverable**: Production-ready game with error handling, accessibility, and polish.

---

## Phase 15: Mobile Enhancement (5 tasks)

**Goal**: Optimize for mobile devices with orientation handling, gesture support, and PWA features.

**Prerequisites**: Phases 1-14 complete with mobile-friendly foundation (viewport, touch targets, touch events).

### Tasks

- [ ] T142 [P] TEST: Write orientation change tests in tests/e2e/mobile.spec.ts
- [ ] T143 Implement orientation change handling (portrait/landscape) with layout adjustments
- [ ] T144 [P] Add mobile-specific gestures (swipe to navigate history, long-press for candidates)
- [ ] T145 Optimize PWA manifest.json for mobile (icons, theme colors, display mode)
- [ ] T146 Validate all touch targets meet 44×44px minimum across all screens per FR-020

**Deliverable**: Full mobile optimization with native app-like experience.

---

## Dependency Graph

**User Story Completion Order:**

```
Phase 1: Setup (blocking all)
  ↓
Phase 2: Foundational (blocking all user stories)
  ↓
Phase 3: US1 (P1) ← MVP
  ↓
Phase 4: US2 (P1) ← depends on US1 (needs game session to persist)
  ↓
Phase 5: US3 (P1) ← depends on US1 (needs game grid and controls)
  ↓
Phase 6: US4 (P2) ← depends on US1 (needs cell state and validation)
  ↓
Phase 7: US5 (P2) ← depends on US1 (needs puzzle generator)
  ↓
Phase 8: US6 (P2) ← depends on US1 (needs cell selection)
  ↓
Phase 9: US7 (P3) ← depends on US1, US2 (needs timer and persistence)
  ↓
Phase 10: US8 (P3) ← depends on US1, US2 (needs completion and storage)
  ↓
Phase 11: Undo/Redo ← depends on US1 (needs move history)
  ↓
Phase 12: Preferences ← depends on US2 (needs storage service)
  ↓
Phase 13: Performance ← depends on US1 (needs generators/validators)
  ↓
Phase 14: Polish ← depends on all previous phases
  ↓
Phase 15: Mobile ← depends on all previous phases (final optimization)
```

**Key Dependencies:**
- **US2** requires **US1** (needs game session to persist)
- **US3** requires **US1** (needs game grid to navigate)
- **US4-US8** all require **US1** (core gameplay)
- **US7** requires **US2** (needs timer persistence)
- **US8** requires **US2** (needs storage service for history)

---

## Parallel Execution Examples

### Phase 3 (User Story 1) Parallel Opportunities

**Group A (Puzzle Logic):**
- T021-T024: Puzzle generator tests + implementation
- T025-T027: Solver tests + implementation
- T028-T030: Validator tests + implementation

**Group B (Game Logic):**
- T031-T035: Game session tests + implementation

**Group C (UI Components):**
- T042-T043: Cell component
- T044-T045: Grid component
- T046-T047: Timer component
- T048-T049: Statistics component
- T050-T051: Controls component

**Sequential Dependencies:**
- Group A → Group B (game session needs puzzle generator)
- Group B → Group C (UI needs game session)
- Group C → T052-T055 (integration)

### Phase 4 (User Story 2) Parallel Opportunities

**Group A:**
- T056-T063: Storage service tests + implementation

**Group B (depends on Group A):**
- T064-T068: Integration with stores and event listeners
- T069-T070: Tests

---

## Implementation Strategy

### MVP Scope (Week 1-2)

**Phase 1 + Phase 2 + Phase 3 (US1) = Playable Game**
- Total: 46 tasks
- Deliverable: Core Sudoku gameplay with puzzle generation, real-time validation, timer
- Success Criteria: SC-001, SC-003, SC-005, SC-007, SC-009

### Post-MVP Increments

**Phase 4 (US2)**: +15 tasks → Offline persistence (SC-002, SC-011, SC-012)
**Phase 5 (US3)**: +10 tasks → Full accessibility (SC-004)
**Phases 6-10**: +36 tasks → Enhanced features (P2/P3 stories)
**Phases 11-14**: +19 tasks → Polish and optimization
**Phase 15**: +5 tasks → Mobile enhancement

---

## Testing Strategy Summary

**Test-First Development (Constitution Principle III):**
- ✅ All game logic: Unit tests BEFORE implementation (RED → GREEN → REFACTOR)
- ✅ All UI components: Testing Library tests BEFORE implementation
- ✅ All user stories: E2E tests in Playwright
- ✅ Performance: Benchmark tests with budget enforcement

**Coverage Targets:**
- Core game logic (puzzle generation, validation): 100% coverage
- UI/presentation: 80%+ coverage
- E2E: All acceptance scenarios from spec.md

**Test Execution:**
- Unit/integration: Vitest (fast feedback <100ms)
- E2E: Playwright with sharding (4 shards for CI)
- Performance: Vitest benchmarking with budget checks

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential: T001-T146 (plus T080a and T080b for layout refinement)
✅ [P] markers on parallelizable tasks only
✅ [Story] labels on user story phase tasks only (US1-US8)
✅ Clear file paths in all task descriptions
✅ Dependencies documented in Dependency Graph section
✅ Parallel opportunities identified per phase

---

**Total Tasks**: 149 (T001-T146 + T080a + T080b)
**MVP Tasks**: 47 (Phases 1-3)
**P1 Tasks**: 73 (Phases 1-5, including T080a and T080b)
**P2 Tasks**: 92 (Phases 1-8)
**P3 Tasks**: 125 (Phases 1-10)

**Estimated Timeline**: 6-8 weeks full implementation, 2 weeks MVP

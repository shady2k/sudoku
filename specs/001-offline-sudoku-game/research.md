# Research Findings: Offline Sudoku Game

**Date**: 2025-10-16
**Feature**: 001-offline-sudoku-game

This document consolidates research on key technical decisions for the offline Sudoku game implementation.

---

## UI Framework Selection

### Decision: **Svelte 5**

### Rationale

Svelte 5 is the optimal choice for this offline Sudoku game based on bundle size, performance, TypeScript support, and offline capabilities:

**Bundle Size (Critical for Offline)**
- **Svelte 5**: 3-10KB minified+gzipped for typical apps; framework runtime only 1.8KB
- **Vue 3**: ~20-33KB minified+gzipped core
- **React 18**: ~40-44KB minified+gzipped (react + react-dom)
- **Vanilla TypeScript**: 0KB framework overhead, but requires custom reactive system

For an offline-first application, Svelte's minimal bundle size directly translates to faster initial load and smaller Service Worker cache requirements. A complete Sudoku game built with Svelte 5 can achieve a total bundle size under 50KB including all game logic, compared to 100-150KB+ with React or Vue.

**Performance Metrics**
- Svelte 5 achieves near-instant startup times (<50ms in benchmarks)
- Real-time validation feedback requirement (<50ms per SC-009) easily met through Svelte's compile-time optimizations
- DOM updates are highly efficient due to surgical reactive updates without virtual DOM overhead
- Memory footprint is 30% smaller than React equivalents in comparable applications

**TypeScript Support (Constitution Principle VI)**
- Svelte 5 supports TypeScript in component markup (lang="ts")
- Full strict mode compatibility with explicit type checking
- Language server provides excellent IDE support
- No runtime type overhead - types are stripped at compile time
- Runes system ($state, $derived, $effect) is fully type-safe

**State Management**
- **Built-in reactivity**: Svelte 5's runes system ($state, $derived, $effect) provides zero-dependency state management
- **Universal reactivity**: State logic can be written in pure TypeScript files
- **No external libraries needed**: Unlike React (Zustand/Context API) or Vue (Pinia)
- Perfect fit for game session state, timer, undo stack, and candidate numbers

**Offline/PWA Capabilities**
- Vite PWA plugin provides zero-config PWA support
- Service Worker integration straightforward with @vite-pwa/sveltekit
- Smaller bundle size means faster Service Worker cache installation

### Alternatives Considered

**React 18 with Hooks**
- **Rejected**: 4-5x larger bundle size (40-44KB framework alone)
- **Drawbacks**: Requires external state management, virtual DOM overhead
- **Why not chosen**: Bundle size penalty conflicts with offline-first requirement

**Vue 3 with Composition API**
- **Rejected**: 2-3x larger bundle than Svelte (~20-33KB core)
- **Drawbacks**: Requires Pinia for optimal state management
- **Why not chosen**: Middle ground with no compelling advantage

**Vanilla TypeScript with Modern DOM APIs**
- **Rejected**: Requires building custom reactive system
- **Drawbacks**: Must implement manual DOM diffing, event handling, reactivity
- **Why not chosen**: Violates Constitution Principle V (simplicity)

### Key Libraries/Tools

**Build & Development**
- **Vite 7**: Fast build tool with TypeScript support, HMR
- **@vite-pwa/sveltekit**: Zero-config PWA with Service Worker generation
- **vite-plugin-imagemin**: Asset optimization

**Testing**
- **Vitest**: Fast unit testing framework
- **Testing Library (Svelte)**: Component testing
- **Playwright**: E2E testing

**State Management**
- **Svelte 5 Runes (Built-in)**: No external state library needed

**Storage & Persistence**
- **LocalStorage API (Native)**: Browser-native storage
- **JSON serialization**: Native JavaScript

**TypeScript Configuration**
- **Strict mode enabled**: Full type safety
- **ESLint + TypeScript ESLint**: Zero warnings policy
- **Prettier**: Automated code formatting

**Expected Bundle Size**: 35-55KB minified+gzipped total

---

## Sudoku Puzzle Generation Algorithm - Comprehensive Research

### Decision: **Hybrid Constraint Propagation + Backtracking with Seed-Based Generation**

**Primary Recommendation**: Implement a custom generator combining **Norvig-style constraint propagation** for solving with **seed transformation + cell removal** for puzzle generation, guaranteeing unique, logic-solvable puzzles within <500ms.

### Algorithm Research Findings

#### 1. Solving Algorithm Comparison (Performance Analysis)

**Backtracking (Pure)**
- **Performance**: Slowest approach - over 200 seconds for hard puzzles in basic implementations
- **Mechanism**: Brute force recursive algorithm that fills cells sequentially and backtracks when invalid
- **Drawback**: Solving time scales poorly with difficulty (3-4 orders of magnitude slower than optimized approaches)
- **Use case**: Not suitable as primary solver, but useful for solution uniqueness verification

**Constraint Propagation (Norvig's Approach)**
- **Performance**: 1.27× to 2.91× faster than pure backtracking (speedup increases with difficulty)
- **Mechanism**: Eliminates impossible values using constraint rules before searching
- **Key technique**: Minimum Remaining Values (MRV) heuristic - choose squares with fewest possibilities first
- **Efficiency**: For many puzzles, constraint propagation solves without explicit search (examined only 25 possibilities in one example vs. thousands)
- **Use case**: Primary solver for our implementation

**Dancing Links (DLX)**
- **Performance**: Exceptionally fast - average 1ms per puzzle, under 1ms for most puzzles
- **Mechanism**: Knuth's Algorithm X using doubly-linked lists for exact cover problem
- **Benchmark**: 30-50× faster than naive approaches, 60 test puzzles solved in ~0.17 seconds
- **Efficiency**: Matrix has 236,196 cells with only 2,916 occupied - linked lists enable instant hopping between occupied cells
- **Complexity**: High implementation complexity, may be overkill for our needs
- **Use case**: Consider for future optimization if performance issues arise

**Hybrid Approach (Recommended)**
- **Performance**: Combines speed of constraint propagation with reliability of backtracking
- **Mechanism**: Constraint propagation first, backtracking fallback for difficult cases
- **Expected time**: Few milliseconds for most puzzles, aligns with our <10ms validation requirement
- **Use case**: Ideal for both solving and uniqueness verification

#### 2. Puzzle Generation Strategy

**Recommended: Complete Grid + Strategic Cell Removal ("Dig-Hole" Strategy)**

**Step 1: Generate Complete Solution Grid** (~10-50ms)
- Use backtracking with randomization to generate valid complete 9×9 grid
- Apply seed-based random number generator for reproducibility
- Shuffle digit order (1-9) before backtracking to ensure variety
- **Alternative**: Use pre-generated seed grids with transformations

**Step 2: Seed-Based Transformation** (~1-5ms)
- Store 10-20 pre-validated complete grids as seeds
- Apply transformations for variety (over 5.8 million variations per seed):
  - Rotations: 90°, 180°, 270° (4 variations)
  - Reflections: horizontal, vertical (2 variations)
  - Row/column permutations within bands/stacks (6! × 6! variations)
  - Digit relabeling: shuffle 1-9 mapping (9! variations)
- **Total combinations per seed**: 4 × 2 × 720 × 720 × 362,880 = 5,806,080+
- **Performance**: Transformation time negligible (<5ms)

**Step 3: Strategic Cell Removal with Verification** (~50-500ms)
- **Target clue count**: Calculate from difficulty parameter
- **Removal strategies**:
  - **Random removal**: Shuffle all 81 positions, attempt removal in random order
  - **Symmetric removal**: Remove cells in symmetric pairs (diagonal, rotational) for aesthetically pleasing puzzles
  - **Difficulty-driven removal**: Prioritize cells that increase solving complexity

**Step 4: Dual Verification After Each Removal**
- **Unique solution check**:
  - Run solver seeking two solutions
  - If 2+ solutions found, restore the cell
  - Continue to next cell
- **Logic-solvability check** (critical for our requirement):
  - Verify puzzle solvable using human techniques (no guessing)
  - Implement constraint propagation + basic strategies (naked singles, hidden singles, etc.)
  - If guessing required, restore cell or try different removal

#### 3. Difficulty Control - Research-Backed Approach

**Clue Count Ranges (Empirical Data)**
- **Easy**: 36-46 clues (typically 40-44)
- **Medium**: 32-36 clues
- **Hard**: 28-31 clues
- **Expert**: 25-30 clues
- **Master**: 22-25 clues
- **Absolute minimum**: 17 clues (proven minimum for unique solution)

**Important Finding**: Difficulty is NOT solely determined by clue count, but by:
1. **Solving techniques required** (primary factor)
2. **Complexity of logic steps** (number of inference chains)
3. **Clue positions** (not just quantity)
4. **Dependency structure** between solving steps

**Recommended Difficulty Scoring Algorithm**:
```typescript
interface DifficultyMetrics {
  clueCount: number;
  nakedSingles: number;      // Cost: 1
  hiddenSingles: number;     // Cost: 2
  nakedPairs: number;        // Cost: 10
  pointingPairs: number;     // Cost: 15
  boxLineReduction: number;  // Cost: 20
  xWing: number;             // Cost: 50
  swordfish: number;         // Cost: 100
  advancedTechniques: number; // Cost: 200+
}

// Difficulty score formula
difficultyScore = baseScore + techniqueScore + structuralComplexity

baseScore = (81 - clueCount) * 2
techniqueScore = Σ(technique.cost × technique.uses × diminishingFactor)
  // First use costs full amount, subsequent uses cost 70% (diminishing returns)
structuralComplexity = Σ(dependencyChainLength)
```

**Flexible Difficulty Scale Implementation**:
```typescript
// Map user difficulty (0-100) to clue count + complexity target
function calculateDifficultyParams(userDifficulty: number): PuzzleParams {
  const clueCount = Math.floor(50 - (userDifficulty * 0.33)); // 50 clues (easy) to 17 (master)
  const maxTechniqueComplexity = Math.floor(userDifficulty * 2); // 0-200 complexity points
  return { clueCount, maxTechniqueComplexity };
}
```

#### 4. Solution Uniqueness Verification Algorithm

**Approach: Modified Backtracking with Solution Counter**

```typescript
function hasUniqueSolution(puzzle: Grid): boolean {
  let solutionCount = 0;

  function solve(grid: Grid): boolean {
    if (solutionCount > 1) return true; // Early exit optimization

    const emptyCell = findEmptyCellWithMRV(grid); // MRV heuristic
    if (!emptyCell) {
      solutionCount++;
      return solutionCount <= 1; // Continue search until 2 solutions found
    }

    for (const candidate of getCandidates(grid, emptyCell)) {
      grid[emptyCell.row][emptyCell.col] = candidate;
      if (solve(grid) && solutionCount > 1) return true;
      grid[emptyCell.row][emptyCell.col] = 0; // Backtrack
    }

    return false;
  }

  solve(puzzle.clone());
  return solutionCount === 1;
}
```

**Optimizations**:
- **Early exit**: Stop after finding 2 solutions (don't need to find all)
- **MRV heuristic**: Choose cells with minimum remaining values first
- **Constraint propagation**: Reduce search space before backtracking
- **Expected time**: <50ms for most puzzles, <200ms worst case

#### 5. Seed-Based Reproducible Generation

**Implementation Strategy**:
```typescript
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator (LCG)
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }
}

function generatePuzzleFromSeed(seed: number, difficulty: number): Puzzle {
  const rng = new SeededRandom(seed);

  // 1. Select seed grid deterministically
  const seedGridIndex = Math.floor(rng.next() * SEED_GRIDS.length);
  let grid = SEED_GRIDS[seedGridIndex].clone();

  // 2. Apply deterministic transformations
  grid = applyTransformations(grid, rng);

  // 3. Remove cells deterministically
  const params = calculateDifficultyParams(difficulty);
  grid = removeCellsWithSeed(grid, params, rng);

  return { grid, solution: grid.clone(), seed };
}
```

**Benefits**:
- **Testing**: Generate same puzzle repeatedly for test cases
- **Debugging**: Reproduce reported issues with seed
- **Sharing**: Players can share puzzles via seed
- **Quality**: Seed transformation creates millions of variations from few source grids

#### 6. TypeScript Optimization Techniques

**Data Structures**:
```typescript
// Option 1: Typed arrays for performance (recommended for solver)
type Board = Uint8Array; // 81 elements (0-9 values)
const board = new Uint8Array(81);

// Option 2: 2D array for readability (recommended for generation)
type Grid = number[][]; // 9x9 array
const grid: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));

// Option 3: Bitwise candidate tracking (recommended for validation)
type CandidateMask = number; // 9 bits for candidates 1-9
const rowMasks = new Uint16Array(9);
const colMasks = new Uint16Array(9);
const boxMasks = new Uint16Array(9);
```

**Bitwise Operations for Fast Validation** (<10ms requirement):
```typescript
// Check if digit d is valid at position (r,c)
function isValid(board: Uint8Array, r: number, c: number, d: number): boolean {
  const bit = 1 << (d - 1);
  const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);

  return !(
    (rowMasks[r] & bit) ||
    (colMasks[c] & bit) ||
    (boxMasks[box] & bit)
  );
}

// Set digit (O(1) time)
function setDigit(r: number, c: number, d: number): void {
  const bit = 1 << (d - 1);
  const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);

  rowMasks[r] |= bit;
  colMasks[c] |= bit;
  boxMasks[box] |= bit;
  board[r * 9 + c] = d;
}
```

**Performance**: Bitwise validation is ~10-20× faster than array iterations

**Web Worker Consideration** (Optional Future Enhancement):
- Generation in background thread won't block UI
- Not critical for <500ms requirement, but provides better UX
- Message passing overhead ~1-5ms
- Consider only if generation consistently exceeds 200ms

#### 7. Real-Time Move Validation (<10ms requirement)

**Recommended: Bit Mask Tracking**

```typescript
class FastValidator {
  private rowMasks = new Uint16Array(9);
  private colMasks = new Uint16Array(9);
  private boxMasks = new Uint16Array(9);

  // Initialize from board state
  constructor(board: Grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val !== 0) this.setMask(r, c, val);
      }
    }
  }

  // O(1) validation
  validateMove(row: number, col: number, value: number): boolean {
    const bit = 1 << (value - 1);
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    return !(
      (this.rowMasks[row] & bit) ||
      (this.colMasks[col] & bit) ||
      (this.boxMasks[box] & bit)
    );
  }

  // O(1) update after move
  updateMove(row: number, col: number, oldVal: number, newVal: number): void {
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

    if (oldVal !== 0) {
      const oldBit = 1 << (oldVal - 1);
      this.rowMasks[row] &= ~oldBit;
      this.colMasks[col] &= ~oldBit;
      this.boxMasks[box] &= ~oldBit;
    }

    if (newVal !== 0) {
      const newBit = 1 << (newVal - 1);
      this.rowMasks[row] |= newBit;
      this.colMasks[col] |= newBit;
      this.boxMasks[box] |= newBit;
    }
  }
}
```

**Performance Benchmarks** (from research):
- Bit mask validation: ~63 nanoseconds per validation (1M validations in 0.063s)
- Boolean array validation: ~300-500 nanoseconds per validation
- Naive iteration validation: ~2000-5000 nanoseconds per validation

**Result**: Bit mask approach is 30-80× faster, easily meeting <10ms requirement

### Alternatives Considered & Rejected

#### sudoku-gen (npm library)
- **Rejected**: No TypeScript types, fixed difficulty levels, black box algorithm
- **Critical limitation**: Cannot verify logic-only solvability

#### sudoku-core by komeilmehranfar
- **Verdict**: Good fallback for prototyping/MVP
- **Cons**: Fixed difficulty presets don't match flexible scale requirement

#### Wave Function Collapse (WFC)
- **Rejected**: Overcomplicated for Sudoku, no clear advantage over backtracking
- **Research finding**: WFC is better suited for tile-based procedural generation

#### Pure CSP Solver Approach
- **Partially adopted**: Use CSP techniques in verification phase
- **Why not pure CSP**: Backtracking simpler for uniqueness verification

#### Dancing Links (DLX)
- **Deferred to future optimization**: 30-50× performance gain, but high complexity
- **Decision**: Start with hybrid approach, implement DLX if performance issues arise
- **Note**: Available as npm package `dancing-links` if needed

### Recommended Implementation Algorithm

**Final Algorithm: Norvig-Inspired Hybrid with Seed Transformation**

```typescript
// Main generation function
async function generatePuzzle(difficulty: number, seed?: number): Promise<Puzzle> {
  // 1. Select or generate seed grid (<5ms)
  const baseSeed = seed ?? Date.now();
  const rng = new SeededRandom(baseSeed);
  const completeGrid = selectAndTransformSeed(rng);

  // 2. Calculate difficulty parameters
  const params = calculateDifficultyParams(difficulty);

  // 3. Remove cells strategically (50-500ms)
  const puzzle = await removeCellsUntilDifficulty(completeGrid, params, rng);

  // 4. Final verification
  if (!hasUniqueSolution(puzzle)) {
    // Retry with different seed (rare edge case)
    return generatePuzzle(difficulty, baseSeed + 1);
  }

  return {
    grid: puzzle,
    solution: completeGrid,
    difficulty,
    seed: baseSeed
  };
}

// Cell removal with dual verification
async function removeCellsUntilDifficulty(
  grid: Grid,
  params: PuzzleParams,
  rng: SeededRandom
): Promise<Grid> {
  const puzzle = grid.clone();
  const positions = shufflePositions(rng);
  let removedCount = 0;

  for (const pos of positions) {
    const [r, c] = pos;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Verify unique solution
    if (!hasUniqueSolution(puzzle)) {
      puzzle[r][c] = backup; // Restore
      continue;
    }

    // Verify logic-solvability (critical for our spec)
    if (!isSolvableWithLogic(puzzle, params.maxTechniqueComplexity)) {
      puzzle[r][c] = backup; // Restore
      continue;
    }

    removedCount++;
    if (removedCount >= params.targetRemovals) break;
  }

  return puzzle;
}
```

**Performance Breakdown**:
| Phase | Time Budget | Algorithm |
|-------|-------------|-----------|
| Seed selection | <1ms | Array access |
| Transformation | 1-5ms | Rotation/permutation |
| Cell removal | 50-400ms | Strategic removal + verification |
| Uniqueness check | <50ms per check | Backtracking with counter |
| Logic check | <100ms per check | Constraint propagation |
| **Total** | **100-500ms** | Within spec requirement |

### Implementation Phases

**Phase 1: MVP (Week 1-2)** - Core generation without logic verification
- Implement complete grid generation with backtracking
- Implement random cell removal with uniqueness verification
- Basic difficulty via clue count only
- **Deliverable**: Working puzzle generator, may include "guess required" puzzles

**Phase 2: Logic Verification (Week 3)** - Guarantee no-guess puzzles
- Implement Norvig-style constraint propagation solver
- Add logic-solvability verification during cell removal
- **Deliverable**: Puzzles guaranteed solvable without guessing

**Phase 3: Difficulty Refinement (Week 4)** - Flexible difficulty scale
- Implement solving technique tracking
- Add difficulty scoring based on required techniques
- Fine-tune clue count ranges for each difficulty level
- **Deliverable**: Accurate difficulty control matching user expectations

**Phase 4: Optimization (Week 5)** - Performance tuning
- Implement seed-based generation for reproducibility
- Add bitwise validation for <10ms move validation
- Pre-generate seed grids for instant access
- **Deliverable**: Generation consistently <500ms, validation <10ms

**Phase 5: Polish (Week 6)** - Optional enhancements
- Consider Dancing Links implementation if performance issues
- Add symmetric pattern preference for aesthetics
- Implement puzzle caching for instant start
- **Deliverable**: Production-ready generator with optimal UX

### References & Resources

**Academic Papers**:
- "A Study Of Sudoku Solving Algorithms: Backtracking and Heuristic" (arXiv:2507.09708, 2025)
- "Difficulty Rating of Sudoku Puzzles: An Overview and Evaluation" (arXiv:1403.7373)
- McGuire et al. "There is no 16-Clue Sudoku" (2014) - Proof of 17-clue minimum

**Algorithm Implementations**:
- Peter Norvig's "Solving Every Sudoku Puzzle" (norvig.com/sudoku.html)
- Donald Knuth's Dancing Links (DLX) algorithm
- Sudoku Wiki - Solving techniques reference (sudokuwiki.org)

**Performance Benchmarks**:
- Tdoku solver: World's fastest, ~1ms for hard puzzles (github.com/t-dillon/tdoku)
- Dancing Links: 30-50× faster than naive (github.com/benfowler/dancing-links)

**TypeScript Libraries** (for reference, not dependency):
- `@algorithm.ts/sudoku` - TypeScript solver reference
- `dancing-links` - DLX implementation if needed
- `sudoku-core` - Fallback for MVP prototyping

---

## Testing Framework Selection

### Decision: **Vitest + Playwright + Testing Library**

**Recommended Stack:**
- **Unit/Integration Testing**: Vitest 1.0+
- **E2E Testing**: Playwright 1.40+
- **Component Testing**: @testing-library/svelte
- **Performance Testing**: Vitest benchmarking
- **Coverage Tool**: Vitest native coverage (c8/istanbul)

### Rationale

#### Vitest over Jest

**Why Vitest:**
- **Native TypeScript Support**: Zero-config with esbuild/SWC
- **Speed**: 5-10x faster than Jest for TypeScript projects
- **TDD Workflow**: Blazing-fast watch mode (<100ms feedback)
- **Jest-Compatible API**: Drop-in replacement, minimal learning curve
- **Built-in Coverage**: Native c8/istanbul coverage
- **Performance Benchmarking**: Built-in `bench()` API

**TDD Impact**: Vitest's <100ms feedback loop is critical for TDD. Jest's 300-500ms delay disrupts RED-GREEN-REFACTOR rhythm.

#### Playwright over Cypress

**Why Playwright:**
- **Multi-Browser Testing**: Native Chromium, Firefox, WebKit support
- **TypeScript First-Class**: Excellent TypeScript support out-of-the-box
- **Performance**: Faster execution, parallel runs by default
- **Network Control**: Better offline testing simulation
- **Mobile Testing**: Built-in mobile viewport emulation

**Offline Testing**: Playwright's `page.route()` and `context.setOffline(true)` superior for SC-001

#### Testing Library

**Why Testing Library:**
- **User-Centric Testing**: Queries based on accessibility attributes
- **Framework Agnostic**: Works seamlessly with Vitest
- **Best Practices**: Focuses on user behavior, not implementation
- **Keyboard/Mouse Testing**: `userEvent` simulates real interactions

### Setup Notes

**Installation:**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D playwright @playwright/test
npm install -D @testing-library/svelte @testing-library/user-event
```

**Coverage Thresholds:**
- Core game logic: 100% coverage required
- UI/presentation: 80%+ coverage required

**Performance Benchmarking:**
```typescript
bench('should generate puzzle in <500ms', () => {
  generatePuzzle(40)
}, { time: 500 })
```

**CI/CD Integration:**
- Type checking: `tsc --noEmit`
- Linting: `npm run lint`
- Tests: `npm run test:coverage`
- Benchmarks: `npm run test:bench`
- E2E: `npx playwright test`

### Constitutional Compliance

- **Principle II (Performance)**: Vitest benchmarking enforces response time budgets
- **Principle III (TDD)**: Fast feedback loop + pre-commit hooks enforce test-first
- **Principle IV (UX First)**: Testing Library focuses on user behavior
- **Principle VI (Type Safety)**: Native TypeScript strict mode support

---

## Summary of Technical Decisions

| Category | Decision | Key Rationale |
|----------|----------|---------------|
| **UI Framework** | Svelte 5 | Smallest bundle (1.8KB), built-in reactivity, TypeScript support |
| **Build Tool** | Vite 7 | Fast HMR, PWA plugin, TypeScript-first |
| **Puzzle Generation** | Custom backtracking + seeds | Full control, logic-solvability guarantee, flexible difficulty |
| **Testing** | Vitest + Playwright | Native TypeScript, <100ms TDD feedback, multi-browser E2E |
| **State Management** | Svelte 5 Runes | Zero dependencies, built-in reactivity |
| **Storage** | LocalStorage API | Native browser API, offline-first |
| **Performance Testing** | Vitest bench() | Built-in benchmarking, Constitution compliance |

All decisions align with Constitution Principles and spec requirements (SC-001 through SC-012, FR-001 through FR-023).

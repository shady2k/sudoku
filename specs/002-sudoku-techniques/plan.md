# Implementation Plan: Sudoku Technique Teaching & Analysis System

**Branch**: `002-sudoku-techniques` | **Date**: 2025-10-18 (Revised) | **Spec**: [Sudoku Technique Teaching & Analysis](spec.md)
**Input**: Revised feature specification from `/specs/002-specify-scripts-bash/spec.md`

**Note**: This plan has been revised based on architecture review. Original focus was puzzle generation; new focus is technique analysis and teaching.

## Summary

The system will analyze existing Sudoku puzzles to identify which of 40 known solving techniques they require, and provide educational guidance to help users learn these techniques. The approach keeps the existing puzzle generator unchanged and adds a solver/analyzer that detects technique patterns, provides progressive hints, and offers a technique library for learning. All techniques will be implemented as detector/solver modules with metadata including id, name, difficulty level (Beginner/Intermediate/Advanced/Expert), pattern-type, description, and when-to-use guidance.

## Technical Context

**Language/Version**: TypeScript 5.9.3 with strict mode (per Constitution Principle VI)
**Primary Dependencies**: No external dependencies (pure TypeScript implementation)
**Storage**: Browser LocalStorage for user progress, technique library bundled with app
**Testing**: Vitest + Jest (per existing project structure), Playwright for E2E
**Target Platform**: Web browser (offline-first)
**Project Type**: Single web application extending existing Sudoku game
**Performance Goals**: <2s puzzle analysis, <500ms hint generation (per spec SC-001, SC-003)
**Constraints**: Offline-capable, no modifications to existing PuzzleGenerator (per FR-005)
**Scale/Scope**: 40 techniques across 4 difficulty levels (Beginner/Intermediate/Advanced/Expert), solver/analyzer + hint system + technique library

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Game Logic Integrity ✅ PASS
- **Requirement**: All 40 techniques must be mathematically sound and verifiable
- **Implementation**: Each technique implemented as detector/solver module with unit tests
- **Validation**: Solution path verification and technique detection accuracy testing

### Principle II: Performance & Responsiveness ✅ PASS (Revised)
- **Constitution Requirement**: <500ms for game actions
- **Spec Requirement**: <2s puzzle analysis, <500ms hints
- **Implementation**: Hint generation meets <500ms requirement; analysis runs on puzzle load
- **Resolution**: Analysis can run in background/Web Worker if needed, hints are instant

### Principle III: Test-First Development ✅ PASS
- **Implementation**: TDD mandatory for all 40 technique modules
- **Coverage**: 100% for game logic, 80%+ for UI components
- **Validation**: RED → GREEN → REFACTOR cycle enforced

### Principle IV: User Experience First ✅ PASS
- **Requirement**: Technique selection and learning interface
- **Implementation**: Intuitive technique categorization and practice modes
- **Accessibility**: Keyboard navigation and screen reader support

### Principle V: Maintainability & Simplicity ✅ PASS
- **Architecture**: Modular technique design with clear separation
- **Complexity**: Documented algorithms for advanced techniques
- **YAGNI**: Implement techniques based on user demand

### Principle VI: Type Safety & TypeScript Standards ✅ PASS
- **Implementation**: Strict TypeScript 5.9.3 with no `any` types
- **Validation**: Discriminated unions for technique state management
- **Testing**: Strict typing in all test files

### Principle VII: Communication & Clarification ✅ PASS
- **Process**: All ambiguities resolved through explicit questioning
- **Documentation**: Clear technique explanations and usage patterns

**GATE STATUS**: ✅ PASS - All constitution principles met with revised analysis-focused approach

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── models/
│   ├── types.ts                   # EXISTING - Keep as-is
│   ├── technique.ts               # NEW - Technique interfaces
│   ├── puzzle-analysis.ts         # NEW - Analysis result types
│   └── hint.ts                    # NEW - Hint system types
├── services/
│   ├── PuzzleGenerator.ts         # EXISTING - No changes (keep as-is)
│   ├── GameValidator.ts           # EXISTING - Reuse for analysis
│   ├── StorageService.ts          # EXISTING - Extend for technique progress
│   ├── LogicalSolver.ts           # NEW - Step-by-step solver
│   ├── PuzzleAnalyzer.ts          # NEW - Technique detection
│   ├── HintSystem.ts              # NEW - Progressive hints
│   └── TechniqueLibrary.ts        # NEW - Educational content
├── techniques/                    # NEW - Technique detector/solver modules (flat structure)
│   ├── base/
│   │   ├── BaseTechnique.ts       # Abstract base class
│   │   └── TechniqueRegistry.ts   # Central registry with name-based lookup
│   ├── HiddenSingles.ts           # difficulty: Beginner, pattern: elimination
│   ├── NakedPairs.ts              # difficulty: Beginner, pattern: subset
│   ├── NakedTriples.ts            # difficulty: Beginner, pattern: subset
│   ├── HiddenPairs.ts             # difficulty: Beginner, pattern: subset
│   ├── PointingPairs.ts           # difficulty: Beginner, pattern: intersection
│   ├── BoxLineReduction.ts        # difficulty: Intermediate, pattern: intersection
│   ├── BUG.ts                     # difficulty: Intermediate, pattern: uniqueness
│   ├── XWing.ts                   # difficulty: Intermediate, pattern: fish
│   ├── UniqueRectangles.ts        # difficulty: Intermediate, pattern: uniqueness
│   ├── SimpleColouring.ts         # difficulty: Intermediate, pattern: coloring
│   ├── YWing.ts                   # difficulty: Intermediate, pattern: wing
│   ├── EmptyRectangles.ts         # difficulty: Intermediate, pattern: intersection
│   ├── Swordfish.ts               # difficulty: Intermediate, pattern: fish
│   ├── XYZWing.ts                 # difficulty: Intermediate, pattern: wing
│   ├── [...26 more techniques]    # Advanced/Expert levels, various patterns
│   └── index.ts                   # Export all techniques
├── components/
│   ├── SudokuGrid.svelte          # EXISTING - Extend for hints
│   ├── HintButton.svelte          # NEW - Hint UI
│   ├── TechniqueLibrary.svelte    # NEW - Learning library
│   ├── PuzzleMetadata.svelte      # NEW - Shows technique analysis
│   └── ProgressTracker.svelte     # NEW - Learning progress
├── utils/
│   ├── validation.ts              # EXISTING - Reuse
│   ├── seededRandom.ts            # EXISTING - Keep
│   └── gridHelpers.ts             # EXISTING - Keep
└── workers/                       # OPTIONAL - For heavy analysis
    └── analysis-worker.ts         # NEW - Background analysis

tests/
├── unit/
│   ├── techniques/                # Flat structure matching src/techniques
│   │   ├── HiddenSingles.test.ts
│   │   ├── NakedPairs.test.ts
│   │   ├── XWing.test.ts
│   │   └── [...all 40 techniques]
│   ├── services/
│   │   ├── LogicalSolver.test.ts
│   │   ├── PuzzleAnalyzer.test.ts
│   │   ├── HintSystem.test.ts
│   │   └── TechniqueLibrary.test.ts
│   └── components/
├── integration/
│   ├── puzzle-generation.test.ts
│   ├── technique-learning.test.ts
│   └── storage-service.test.ts
└── e2e/
    └── technique-workflows.test.ts
```

**Structure Decision**: Extend existing offline Sudoku game with technique analysis and teaching features. Each technique implemented as detector/solver module with educational content. Reuses existing puzzle generator, validation utilities, and storage service. All analysis runs client-side with no external dependencies.

**Technique Organization Decision**: Flat structure in `src/techniques/` (not organized by difficulty folders). Rationale:
- Difficulty is metadata (Beginner/Intermediate/Advanced/Expert stored in each technique class), not architecture
- Easier navigation: alphabetical listing, no folder guessing
- Simpler imports: `techniques/XWing` vs `techniques/intermediate/XWing`
- Better IDE support: autocomplete shows all techniques
- Flexible queries: TechniqueRegistry provides name-based lookup
- Related techniques stay together: `XWing.ts` next to `Swordfish.ts` (both fish patterns)

**Technique Metadata Structure**: Each technique includes:
- `id`: kebab-case identifier (e.g., "x-wing")
- `name`: Display name (e.g., "X-Wing")
- `difficulty`: Beginner | Intermediate | Advanced | Expert
- `patternType`: elimination | subset | fish | wing | chain | coloring | uniqueness | intersection | forcing
- `description`: Brief explanation of the technique
- `whenToUse`: Guidance on when this technique applies

## Complexity Tracking

*No constitution violations in revised approach*

**Original Concern**: Puzzle generation for complex techniques might exceed 500ms
**Resolution**: Revised approach focuses on analysis, not generation. Hint generation (the interactive action) meets <500ms requirement. Puzzle analysis (2s max) can run in background on puzzle load, not blocking user interaction.

| Component | Performance Target | Constitution Compliance |
|-----------|-------------------|------------------------|
| Hint Generation | <500ms | ✅ PASS - Interactive action |
| Puzzle Analysis | <2s | ✅ PASS - Background task |
| Technique Detection | <100ms per technique | ✅ PASS - Part of analysis |
| UI Responsiveness | <50ms | ✅ PASS - Maintained |


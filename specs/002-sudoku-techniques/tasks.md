# Tasks: Sudoku Technique Teaching & Analysis System

**Input**: Design documents from `/specs/002-sudoku-techniques/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md

**Tests**: Test-First Development is MANDATORY per Constitution Principle III. All tests must be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions
- Single project structure: `src/`, `tests/` at repository root
- TypeScript 5.9.3 with strict mode
- Svelte 5 components
- Vitest for unit/integration tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create new type definition files: src/models/technique.ts, src/models/puzzle-analysis.ts, src/models/hint.ts
- [ ] T002 [P] Add DifficultyLevel enum (Beginner/Intermediate/Advanced/Expert) to src/models/technique.ts
- [ ] T003 [P] Add PatternType enum (elimination/subset/fish/wing/chain/coloring/uniqueness/intersection/forcing) to src/models/technique.ts
- [ ] T004 Add SolvingTechnique interface to src/models/technique.ts with all metadata fields

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create BaseTechnique abstract class in src/techniques/base/BaseTechnique.ts
- [ ] T006 Create TechniqueRegistry class in src/techniques/base/TechniqueRegistry.ts with name-based lookup
- [ ] T007 [P] Write unit test for BaseTechnique in tests/unit/techniques/BaseTechnique.test.ts (MUST FAIL)
- [ ] T008 [P] Write unit test for TechniqueRegistry in tests/unit/techniques/TechniqueRegistry.test.ts (MUST FAIL)
- [ ] T009 Implement BaseTechnique abstract class methods (detect, apply, canApply, findPatterns)
- [ ] T010 Implement TechniqueRegistry with Map<id, BaseTechnique> and getByName method
- [ ] T011 Create LogicalSolver service in src/services/LogicalSolver.ts (shell only - full implementation in US1)
- [ ] T012 Create PuzzleAnalyzer service in src/services/PuzzleAnalyzer.ts (shell only - full implementation in US1)
- [ ] T013 Create HintSystem service in src/services/HintSystem.ts (shell only - full implementation in US1)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Learn Techniques Through Hints (Priority: P1) 🎯 MVP

**Goal**: Enable users to request hints showing which solving techniques to apply and where

**Independent Test**: Generate any puzzle, get stuck, request hint → system correctly identifies applicable technique with cell references

### Tests for User Story 1 (TDD Mandatory)

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] Write test for HiddenSingles technique detection in tests/unit/techniques/HiddenSingles.test.ts (MUST FAIL)
- [ ] T015 [P] [US1] Write test for NakedPairs technique detection in tests/unit/techniques/NakedPairs.test.ts (MUST FAIL)
- [ ] T016 [P] [US1] Write test for LogicalSolver.solve() in tests/unit/services/LogicalSolver.test.ts (MUST FAIL)
- [ ] T017 [P] [US1] Write test for PuzzleAnalyzer.analyze() in tests/unit/services/PuzzleAnalyzer.test.ts (MUST FAIL)
- [ ] T018 [P] [US1] Write test for HintSystem.getHint() in tests/unit/services/HintSystem.test.ts (MUST FAIL)
- [ ] T019 [P] [US1] Write integration test for hint workflow in tests/integration/hint-system.test.ts (MUST FAIL)

### Implementation for User Story 1

#### Beginner Techniques (Parallel - Different Files)

- [ ] T020 [P] [US1] Implement HiddenSingles technique in src/techniques/HiddenSingles.ts (extends BaseTechnique)
- [ ] T021 [P] [US1] Implement NakedPairs technique in src/techniques/NakedPairs.ts (extends BaseTechnique)
- [ ] T022 [P] [US1] Implement NakedTriples technique in src/techniques/NakedTriples.ts (extends BaseTechnique)
- [ ] T023 [P] [US1] Implement HiddenPairs technique in src/techniques/HiddenPairs.ts (extends BaseTechnique)
- [ ] T024 [P] [US1] Implement HiddenTriples technique in src/techniques/HiddenTriples.ts (extends BaseTechnique)
- [ ] T025 [P] [US1] Implement HiddenQuads technique in src/techniques/HiddenQuads.ts (extends BaseTechnique)
- [ ] T026 [P] [US1] Implement BoxLineReduction technique in src/techniques/BoxLineReduction.ts (extends BaseTechnique)
- [ ] T027 [P] [US1] Implement HiddenTriples technique in src/techniques/HiddenTriples.ts (extends BaseTechnique)
- [ ] T028 [P] [US1] Implement NakedQuads technique in src/techniques/NakedQuads.ts (extends BaseTechnique)
- [ ] T029 [P] [US1] Implement HiddenQuads technique in src/techniques/HiddenQuads.ts (extends BaseTechnique)
- [ ] T030 [P] [US1] Implement PointingPairs technique in src/techniques/PointingPairs.ts (extends BaseTechnique)
- [ ] T031 [P] [US1] Implement BoxLineReduction technique in src/techniques/BoxLineReduction.ts (extends BaseTechnique)

#### Core Services (Sequential Dependencies)

- [ ] T032 [US1] Implement LogicalSolver.solve() method in src/services/LogicalSolver.ts (depends on T020-T028)
- [ ] T033 [US1] Implement LogicalSolver.getSolutionPath() method in src/services/LogicalSolver.ts
- [ ] T034 [US1] Implement PuzzleAnalyzer.analyze() in src/services/PuzzleAnalyzer.ts (depends on T029)
- [ ] T035 [US1] Implement PuzzleAnalyzer.detectTechniques() in src/services/PuzzleAnalyzer.ts
- [ ] T036 [US1] Implement HintSystem.getHint() (vague level) in src/services/HintSystem.ts (depends on T031)
- [ ] T037 [US1] Implement HintSystem.getHint() (specific level) in src/services/HintSystem.ts
- [ ] T038 [US1] Implement HintSystem.getHint() (show level) in src/services/HintSystem.ts

#### UI Components (Parallel - Different Files)

- [ ] T039 [P] [US1] Create HintButton component in src/components/HintButton.svelte
- [ ] T040 [P] [US1] Create HintDisplay component in src/components/HintDisplay.svelte
- [ ] T041 [US1] Extend SudokuGrid component to highlight cells from hints in src/components/SudokuGrid.svelte
- [ ] T042 [US1] Integrate HintButton with gameStore and HintSystem in src/stores/gameStore.svelte.ts
- [ ] T043 [US1] Add hint state management to gameStore in src/stores/gameStore.svelte.ts

#### Testing & Validation

- [ ] T044 [US1] Verify all US1 unit tests now PASS (T014-T018)
- [ ] T045 [US1] Verify integration test passes (T019)
- [ ] T046 [US1] Manual test: Generate puzzle, request hint at each level (vague → specific → show)
- [ ] T047 [US1] Validate 95% technique detection accuracy: Create test corpus of 20+ puzzles with documented solutions from sudoku-exchange.com or Hodoku, run analyzer, verify detected techniques match expected techniques (SC-002)
- [ ] T048 [US1] Validate educational content completeness: Manual checklist review ensuring all 40 techniques have description, whenToUse, howToSpot, and examples fields populated (SC-006)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can get progressive hints on any puzzle

---

## Phase 4: User Story 2 - Technique Learning Library (Priority: P2)

**Goal**: Enable users to browse 40 techniques organized by difficulty/pattern-type with educational content

**Independent Test**: Navigate to technique library → verify all techniques listed with descriptions and examples

### Tests for User Story 2 (TDD Mandatory)

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T043 [P] [US2] Write test for TechniqueLibrary.getAllTechniques() in tests/unit/services/TechniqueLibrary.test.ts (MUST FAIL)
- [ ] T044 [P] [US2] Write test for TechniqueLibrary.getByDifficulty() in tests/unit/services/TechniqueLibrary.test.ts (MUST FAIL)
- [ ] T045 [P] [US2] Write test for TechniqueLibrary.getByPatternType() in tests/unit/services/TechniqueLibrary.test.ts (MUST FAIL)

### Implementation for User Story 2

#### Intermediate Techniques (Parallel - Different Files)

- [ ] T046 [P] [US2] Implement BoxLineReduction technique in src/techniques/BoxLineReduction.ts (extends BaseTechnique)
- [ ] T047 [P] [US2] Implement BUG technique in src/techniques/BUG.ts (extends BaseTechnique)
- [ ] T048 [P] [US2] Implement XWing technique in src/techniques/XWing.ts (extends BaseTechnique)
- [ ] T049 [P] [US2] Implement UniqueRectangles technique in src/techniques/UniqueRectangles.ts (extends BaseTechnique)
- [ ] T050 [P] [US2] Implement SimpleColouring technique in src/techniques/SimpleColouring.ts (extends BaseTechnique)
- [ ] T051 [P] [US2] Implement YWing technique in src/techniques/YWing.ts (extends BaseTechnique)
- [ ] T052 [P] [US2] Implement EmptyRectangles technique in src/techniques/EmptyRectangles.ts (extends BaseTechnique)
- [ ] T053 [P] [US2] Implement Swordfish technique in src/techniques/Swordfish.ts (extends BaseTechnique)
- [ ] T054 [P] [US2] Implement XYZWing technique in src/techniques/XYZWing.ts (extends BaseTechnique)

#### Advanced/Expert Techniques (Parallel - Different Files)

- [ ] T055 [P] [US2] Implement XCycles technique in src/techniques/XCycles.ts (extends BaseTechnique)
- [ ] T056 [P] [US2] Implement XYChain technique in src/techniques/XYChain.ts (extends BaseTechnique)
- [ ] T057 [P] [US2] Implement Medusa3D technique in src/techniques/Medusa3D.ts (extends BaseTechnique)
- [ ] T058 [P] [US2] Implement Jellyfish technique in src/techniques/Jellyfish.ts (extends BaseTechnique)
- [ ] T059 [P] [US2] Implement ExtendedUniqueRectangles technique in src/techniques/ExtendedUniqueRectangles.ts
- [ ] T060 [P] [US2] Implement HiddenUniqueRectangles technique in src/techniques/HiddenUniqueRectangles.ts
- [ ] T061 [P] [US2] Implement WXYZWing technique in src/techniques/WXYZWing.ts (extends BaseTechnique)
- [ ] T062 [P] [US2] Implement AlignedPairExclusion technique in src/techniques/AlignedPairExclusion.ts
- [ ] T063 [P] [US2] Implement Exocet technique in src/techniques/Exocet.ts (extends BaseTechnique)
- [ ] T064 [P] [US2] Implement GroupedXCycles technique in src/techniques/GroupedXCycles.ts (extends BaseTechnique)
- [ ] T065 [P] [US2] Implement FinnedXWing technique in src/techniques/FinnedXWing.ts (extends BaseTechnique)
- [ ] T066 [P] [US2] Implement FinnedSwordfish technique in src/techniques/FinnedSwordfish.ts (extends BaseTechnique)
- [ ] T067 [P] [US2] Implement AlternativeInferenceChains technique in src/techniques/AlternativeInferenceChains.ts
- [ ] T068 [P] [US2] Implement SueDeCoq technique in src/techniques/SueDeCoq.ts (extends BaseTechnique)
- [ ] T069 [P] [US2] Implement DigitForcingChains technique in src/techniques/DigitForcingChains.ts
- [ ] T070 [P] [US2] Implement NishioForcingChains technique in src/techniques/NishioForcingChains.ts
- [ ] T071 [P] [US2] Implement CellForcingChains technique in src/techniques/CellForcingChains.ts
- [ ] T072 [P] [US2] Implement UnitForcingChains technique in src/techniques/UnitForcingChains.ts
- [ ] T073 [P] [US2] Implement AlmostLockedSets technique in src/techniques/AlmostLockedSets.ts
- [ ] T074 [P] [US2] Implement DeathBlossom technique in src/techniques/DeathBlossom.ts (extends BaseTechnique)
- [ ] T075 [P] [US2] Implement PatternOverlayMethod technique in src/techniques/PatternOverlayMethod.ts
- [ ] T076 [P] [US2] Implement QuadForcingChains technique in src/techniques/QuadForcingChains.ts
- [ ] T077 [P] [US2] Implement Fireworks technique in src/techniques/Fireworks.ts (extends BaseTechnique)
- [ ] T078 [P] [US2] Implement SKLoops technique in src/techniques/SKLoops.ts (extends BaseTechnique)
- [ ] T079 [P] [US2] Implement BowmansBingo technique in src/techniques/BowmansBingo.ts (extends BaseTechnique)
- [ ] T080 [P] [US2] Implement VariousStaticPatterns technique in src/techniques/VariousStaticPatterns.ts
- [ ] T081 [P] [US2] Implement ChuteRemotePairs technique in src/techniques/ChuteRemotePairs.ts

#### Technique Library Service

- [ ] T082 [US2] Implement TechniqueLibrary.getAllTechniques() in src/services/TechniqueLibrary.ts (depends on T020-T081)
- [ ] T083 [US2] Implement TechniqueLibrary.getByDifficulty() in src/services/TechniqueLibrary.ts
- [ ] T084 [US2] Implement TechniqueLibrary.getByPatternType() in src/services/TechniqueLibrary.ts
- [ ] T085 [US2] Implement TechniqueLibrary.searchByName() in src/services/TechniqueLibrary.ts
- [ ] T086 [US2] Add educational content for all 40 techniques (description, whenToUse, howToSpot, examples) in src/services/TechniqueLibrary.ts

#### UI Components (Parallel - Different Files)

- [ ] T087 [P] [US2] Create TechniqueLibrary component in src/components/TechniqueLibrary.svelte
- [ ] T088 [P] [US2] Create TechniqueCard component in src/components/TechniqueCard.svelte
- [ ] T089 [P] [US2] Create TechniqueDetail component in src/components/TechniqueDetail.svelte
- [ ] T090 [P] [US2] Create ProgressTracker component in src/components/ProgressTracker.svelte
- [ ] T091 [US2] Integrate TechniqueLibrary with navigation in src/App.svelte

#### Testing & Validation

- [ ] T092 [US2] Verify all US2 unit tests now PASS (T043-T045)
- [ ] T093 [US2] Manual test: Browse all 40 techniques, verify metadata and educational content completeness

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T094 [P] Add PuzzleMetadata component to show technique analysis in src/components/PuzzleMetadata.svelte
- [ ] T095 [P] Optimize technique detection performance (target <100ms per technique) across all techniques
- [ ] T096 [P] Add error handling for timeout scenarios (>2s analysis, >500ms hint) in relevant services
- [ ] T097 [P] Add loading states for analysis and hint generation in UI components
- [ ] T098 [P] Write E2E test for complete hint workflow in tests/e2e/technique-workflows.test.ts
- [ ] T099 [P] Write E2E test for technique library browsing in tests/e2e/technique-workflows.test.ts
- [ ] T100 Add technique index file exporting all 40 techniques in src/techniques/index.ts
- [ ] T101 Performance test: Verify puzzle analysis completes in <2s (SC-001)
- [ ] T102 Performance test: Verify hint generation completes in <500ms (SC-003)
- [ ] T103 [P] Update CLAUDE.md with new technique system documentation
- [ ] T104 Run npm run typecheck to verify strict TypeScript compliance
- [ ] T105 Run npm run lint to verify code quality
- [ ] T106 Run npm test to verify 100% core logic test coverage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run in parallel with US1 if staffed)
- **Polish (Phase 5)**: Depends on US1 and US2 completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent but builds on US1's technique infrastructure

### Within Each User Story

**User Story 1**:
- Tests (T014-T019) MUST FAIL before implementation
- Beginner techniques (T020-T025) in parallel → then services (T026-T032) sequentially → then UI (T033-T037) in parallel

**User Story 2**:
- Tests (T043-T045) MUST FAIL before implementation
- All techniques (T046-T081) in parallel → then services (T082-T086) sequentially → then UI (T087-T091) in parallel

### Parallel Opportunities

- **Setup Phase**: T002, T003 can run in parallel
- **Foundational Phase**: T007, T008 can run in parallel
- **US1 Tests**: T014, T015, T016, T017, T018, T019 can all run in parallel
- **US1 Techniques**: T020-T025 (6 beginner techniques) can all run in parallel
- **US1 UI**: T033, T034 can run in parallel
- **US2 Tests**: T043, T044, T045 can all run in parallel
- **US2 Techniques**: T046-T081 (36 techniques) can all run in parallel - MASSIVE parallelization opportunity
- **US2 UI**: T087-T090 can all run in parallel
- **Polish Phase**: Most tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 Techniques

```bash
# Launch all 6 beginner technique implementations together:
Task T020: "Implement HiddenSingles in src/techniques/HiddenSingles.ts"
Task T021: "Implement NakedPairs in src/techniques/NakedPairs.ts"
Task T022: "Implement NakedTriples in src/techniques/NakedTriples.ts"
Task T023: "Implement HiddenPairs in src/techniques/HiddenPairs.ts"
Task T024: "Implement PointingPairs in src/techniques/PointingPairs.ts"
Task T025: "Implement NakedQuads in src/techniques/NakedQuads.ts"

# All different files, no dependencies - can run simultaneously
```

## Parallel Example: User Story 2 Techniques

```bash
# Launch all 36 intermediate/advanced/expert techniques together:
# T046-T081 can ALL run in parallel (36 different files)
# This is the largest parallelization opportunity in the project
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T013) - CRITICAL checkpoint
3. Complete Phase 3: User Story 1 (T014-T042)
4. **STOP and VALIDATE**: Test US1 independently with hints at all three levels
5. Deploy/demo MVP - users can now learn techniques through progressive hints!

### Incremental Delivery

1. **Foundation** (Phases 1-2): T001-T013 → Infrastructure ready
2. **MVP** (Phase 3): T014-T042 → Hint system functional ✅ Deploy
3. **Full Feature** (Phase 4): T043-T093 → Technique library ✅ Deploy
4. **Production Ready** (Phase 5): T094-T106 → Polish + validation ✅ Final deploy

Each phase adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

- **Developer A**: User Story 1 hints (T014-T042)
- **Developer B-F**: User Story 2 techniques in batches (T046-T081) - 36 techniques, ~7 per developer
- **Developer G**: User Story 2 UI (T087-T091) - can start after US1 foundation

---

## Notes

- **TDD is MANDATORY**: All test tasks must FAIL before implementation per Constitution Principle III
- **[P] tasks**: Different files, no dependencies, can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability
- **Technique parallelization**: 40 total techniques, only 6 needed for MVP (US1)
- **File paths**: All paths are absolute from repository root
- **Type safety**: Strict TypeScript mode enforced, no `any` types (Constitution Principle VI)
- **Performance targets**: <2s analysis (FR-008), <500ms hints (FR-009)
- **Existing code**: PuzzleGenerator.ts, GameValidator.ts, StorageService.ts remain unchanged (FR-005)
- Each user story independently testable per acceptance criteria
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Task Count Summary

- **Total Tasks**: 106 (reduced from 112)
- **Setup Phase**: 4 tasks
- **Foundational Phase**: 9 tasks
- **User Story 1 (MVP)**: 29 tasks (6 tests + 21 implementation + 2 validation)
- **User Story 2**: 51 tasks (3 tests + 48 implementation)
- **Polish Phase**: 13 tasks

**Parallel Opportunities**:
- 6 beginner techniques (US1)
- 36 intermediate/advanced/expert techniques (US2)
- Multiple test suites
- Multiple UI components

**MVP Scope**: Phases 1-3 only (42 tasks) → Hint system fully functional with validation

**Full Feature Scope**: Phases 1-4 (93 tasks) → Hint system + Technique library

**Removed from Scope**:
- Practice mode for specific techniques (originally T044, T086-T088, T092)
- User satisfaction metrics (SC-005, SC-007)
- Technique-based difficulty classification (FR-006)

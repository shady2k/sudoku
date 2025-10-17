# Feature Specification: Sudoku Technique Teaching & Analysis System

**Feature Branch**: `002-sudoku-techniques`
**Created**: 2025-10-18
**Status**: Revised
**Original Input**: "We need implement feature that will generate sudoku puzzle from known techniques. Puzzle need to be logical solvable by one of known methods. It is need to be implemented for generation and future feature that will teach users to logically solve puzzles."

**Revised Focus**: Based on architecture review, this feature focuses on **analyzing existing puzzles** to identify solving techniques and providing **educational guidance** to help users learn those techniques. The existing puzzle generator (src/lib/services/PuzzleGenerator.ts) will remain unchanged and continues to generate valid puzzles with unique solutions.

## Clarifications

### Session 2025-10-18 (Original)

- Q: Should the system generate puzzles that require trial-and-error techniques, or focus only on logical deduction methods? → A: Include all techniques including trial-and-error methods (1-40)
- Q: Given the 40 techniques organized into 5 difficulty categories, how should users navigate and select techniques in the interface? → A: Keep current approach with percentage difficulty
- Q: Should the system support generating puzzles that require multiple techniques simultaneously, or only puzzles solvable by a single primary technique? → A: It is dependent on difficulty level

### Session 2025-10-18 (Architecture Review & Revision)

- **Key Decision**: Keep existing puzzle generator unchanged - it works correctly and generates valid puzzles
- **Focus Shift**: From "generate technique-specific puzzles" to "analyze puzzles and teach techniques"
- **Approach**: Build a solver/analyzer that detects which techniques are present in any puzzle
- **Complexity Reduction**: Analysis is O(n^3) per technique vs generation is O(n! × techniques) - much more feasible
- **Timeline Impact**: 6-8 weeks instead of 3-6 months for full implementation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn Techniques Through Hints (Priority: P1)

As a Sudoku learner, I want to receive hints about which solving techniques to apply and where, so that I can learn to recognize and use these techniques on my own.

**Why this priority**: This is the core educational functionality that helps users learn solving techniques progressively without frustration.

**Independent Test**: Can be fully tested by generating any puzzle, getting stuck, requesting a hint, and verifying the hint correctly identifies an applicable technique with specific cell references.

**Acceptance Scenarios**:

1. **Given** I am stuck on a puzzle, **When** I click "Hint", **Then** the system suggests a technique I can use (e.g., "Look for a Hidden Single")
2. **Given** I request a more specific hint, **When** I click "Show me where", **Then** the system highlights the relevant cells and candidates
3. **Given** I still don't understand, **When** I click "Explain", **Then** the system shows step-by-step reasoning for why this technique applies

---

### User Story 2 - Technique Learning Library (Priority: P2)

As a Sudoku learner, I want to browse and learn about different solving techniques with examples, so that I can expand my solving repertoire systematically.

**Why this priority**: Users need educational resources to understand techniques before practicing them in puzzles.

**Independent Test**: Can be tested by navigating to technique library and verifying each technique has clear explanation, visual examples, and practice exercises.

**Acceptance Scenarios**:

1. **Given** I open the technique library, **When** I browse techniques, **Then** I see all 47 techniques organized by difficulty level (Beginner, Intermediate, Advanced, Expert) and pattern-type
2. **Given** I select a technique (e.g., "X-Wing"), **When** I view its details, **Then** I see: description, when to use it, how to spot it, visual examples, and common mistakes

---

### Edge Cases

#### EC-1: Puzzle Requires Only Basic Techniques
**Scenario**: Puzzle solvable with only Hidden Singles (beginner technique)
**Handling**: Hint system suggests the simplest applicable technique. No special handling—educational value exists at all difficulty levels.

#### EC-2: Puzzle Requires Unimplemented Techniques
**Scenario**: Solver cannot find any applicable technique from the 47 implemented techniques
**Handling**: Display message: "No more hints available - this puzzle may require advanced techniques beyond the current system." Optionally provide brute-force solution step (show next correct number without technique explanation).

#### EC-3: Multiple Techniques Applicable Simultaneously
**Scenario**: At current puzzle state, 3+ different valid techniques could make progress
**Handling**: Prioritize by difficulty level (Beginner → Intermediate → Advanced → Expert). If multiple techniques exist at the same difficulty level, display all options and let user choose which to learn.

#### EC-4: Invalid Puzzle State (User Mistakes)
**Scenario**: User placed incorrect numbers, creating unsolvable state
**Handling**: Leverage existing mistake detection system. If mistakes exist on grid, hint system responds: "Please fix the mistakes on the grid before requesting hints." No hint generation until puzzle state is valid.

#### EC-5: Analysis Timeout (>2 seconds)
**Scenario**: Complex puzzle or slow device causes analysis to exceed 2s performance target
**Handling**: Display loading indicator during analysis. If exceeds 2s, show message "Analysis taking longer than expected..." but continue processing. Enforce hard timeout cap at 30 seconds to prevent infinite loops. Cache analysis results per puzzle to avoid repeated timeout issues.

#### EC-6: Technique Library Educational Content Missing
**Scenario**: Technique implemented but educational content incomplete
**Handling**: Display "Documentation for this technique is being updated. Please try another technique or check back later." Validation task (T042) ensures this scenario is caught before production.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST analyze existing Sudoku puzzles to identify which solving techniques are required
- **FR-002**: System MUST implement a logical solver that can solve puzzles step-by-step using known techniques
- **FR-003**: System MUST provide progressive hint system (vague → specific → show solution step)
- **FR-004**: System MUST detect and label all applied techniques in solution path
- **FR-005**: System MUST maintain existing puzzle generator without modifications (src/lib/services/PuzzleGenerator.ts)
- **FR-006**: System MUST provide educational content for each technique (description, when to use, how to spot, examples)
- **FR-007**: System MUST implement 47 Sudoku solving techniques: (1) Hidden Singles, (2) Naked Pairs, (3) Naked Triples, (4) Hidden Pairs, (5) Hidden Triples, (6) Naked Quads, (7) Hidden Quads, (8) Pointing Pairs, (9) Box/Line Reduction, (10) BUG, (11) X-Wing, (12) Unique Rectangles Type 1, (13) Chute Remote Pairs, (14) Simple Colouring, (15) Y-Wing, (16) Rectangle Elimination (Empty Rectangles), (17) Swordfish, (18) XYZ Wing, (19) X-Cycles, (20) XY-Chain, (21) 3D Medusa, (22) Jellyfish, (23) Unique Rectangles Type 2+, (24) Various Static Patterns, (25) Extended Unique Rectangles, (26) Hidden Unique Rectangles, (27) WXYZ Wing, (28) Aligned Pair Exclusion, (29) Exocet, (30) Grouped X-Cycles, (31) Finned X-Wing, (32) Finned Swordfish, (33) Alternative Inference Chains, (34) Sue-de-Coq, (35) Digit Forcing Chains, (36) Nishio Forcing Chains, (37) Cell Forcing Chains, (38) Unit Forcing Chains, (39) Almost Locked Sets, (40) Death Blossom, (41) Pattern Overlay Method, (42) Quad Forcing Chains, (43) Fireworks, (44) SK Loops, (45) Bowman's Bingo. Each technique includes metadata: id, name, difficulty level (Beginner/Intermediate/Advanced/Expert), pattern-type, description, and when-to-use guidance
- **FR-008**: System MUST complete puzzle analysis in under 2 seconds (revised from generation requirement). **Constitution Exemption**: This requirement is exempt from Constitution Principle II's <500ms interactive action requirement because puzzle analysis runs as a non-blocking background operation during puzzle load, not during active gameplay. See plan.md Constitution Check section for detailed resolution. Hint generation (FR-009) remains subject to <500ms constitution requirement.
- **FR-009**: System MUST complete hint generation in under 500ms for responsive user experience
- **FR-010**: System MUST support technique filtering and search in technique library. Filtering includes: by difficulty level (Beginner/Intermediate/Advanced/Expert), by pattern-type (elimination/subset/fish/wing/chain/coloring/uniqueness/intersection/forcing), and by name/keyword search. Implemented in T083-T085.

### Performance Requirements Clarification

**Analysis vs Interactive Operations**: Puzzle analysis (FR-008, SC-001) is a non-blocking background operation that executes when a puzzle is initially loaded, not during active gameplay. The <500ms constitution requirement (Principle II: Performance & Responsiveness) applies specifically to interactive game actions—most critically, hint generation (FR-009, SC-003).

Analysis may exceed the 500ms interactive threshold but MUST complete within 2 seconds. A hard timeout cap (30 seconds maximum) prevents infinite loops in edge cases. During analysis that exceeds 2s, users see a loading indicator with message "Analysis taking longer than expected..." but can continue interacting with the puzzle.

This separation ensures:
- User interactions remain responsive (<500ms for hints)
- Complex puzzle analysis has adequate time budget (<2s typical, 30s max)
- No blocking operations during gameplay
- Constitution compliance for all interactive features

### Key Entities *(include if feature involves data)*

- **Puzzle**: Unchanged from existing implementation (grid, solution, clues, difficultyRating, puzzleId, generatedAt)
- **PuzzleAnalysis**: NEW - Analysis results containing detected techniques, solution path, technique-based difficulty
- **Technique**: Solving method with metadata (id, name, difficulty: Beginner/Intermediate/Advanced/Expert, pattern-type, description, when-to-use), with detection logic, application logic, and educational content
- **SolutionPath**: Step-by-step logical deduction sequence showing how solver solved the puzzle with technique labels
- **Hint**: Progressive hint data (technique name, vague/specific/show level, affected cells, explanation)
- **TechniqueLibraryEntry**: Educational content for each technique (name, description, category, examples, tips)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: System analyzes puzzles and identifies techniques in under 2 seconds (revised from 5s generation)
- **SC-002**: 95% of detected techniques are verified correct through manual testing with known puzzles
- **SC-003**: Hint system provides relevant suggestions in under 500ms
- **SC-004**: System correctly identifies techniques across 4 difficulty levels (Beginner/Intermediate/Advanced/Expert)
- **SC-005**: Solver successfully completes 99% of valid puzzles using implemented techniques
- **SC-006**: Technique library provides clear explanations for all 47 techniques
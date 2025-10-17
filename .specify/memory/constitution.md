<!--
SYNC IMPACT REPORT - Constitution Update
=========================================
Version Change: 1.1.0 → 1.2.0
Rationale: MINOR version bump. Added new Communication & Clarification Protocol principle.
No breaking changes to existing principles.

Modified Principles: None

Added Sections:
  - New Principle VII: Communication & Clarification Protocol

Removed Sections: None

Technical Context Updates:
  - Communication protocol established for project interactions
  - One-question-per-message approach mandated
  - Explicit clarification requirements for all uncertain situations

Template Consistency Status:
  ✅ plan-template.md - Constitution Check section compatible with new principles
  ✅ spec-template.md - User scenarios structure unchanged
  ✅ tasks-template.md - Test-first workflow still aligned
  ✅ Communication protocol applies to all template usage and interactions

Follow-up TODOs: None - all amendments integrated
=========================================
-->

# Sudoku Project Constitution

## Core Principles

### I. Game Logic Integrity

The correctness of Sudoku game rules and puzzle generation is NON-NEGOTIABLE. All game
logic MUST be mathematically sound and verifiable.

**Rules**:
- Puzzle generation MUST produce valid, uniquely-solvable Sudoku puzzles
- Solution validation MUST correctly enforce all Sudoku constraints (row, column, box uniqueness)
- No shortcuts or approximations in core game logic
- Puzzle difficulty classification MUST be deterministic and testable

**Rationale**: Users trust that puzzles are legitimate and solvable. Incorrect game logic
destroys the product's core value proposition.

### II. Performance & Responsiveness

User interactions MUST feel instantaneous. Puzzle operations MUST complete within strict
time budgets to ensure smooth gameplay experience.

**Rules**:
- Puzzle generation: <500ms for any difficulty level
- Move validation: <10ms response time
- UI interactions: <16ms (60fps) for smooth animations
- Solution checking: <100ms for full puzzle validation
- Solver operations: <2s for hint generation

**Rationale**: Puzzle games require immediate feedback. Any perceptible lag breaks the
flow state that makes the game enjoyable.

### III. Test-First Development

Test-Driven Development (TDD) is MANDATORY for all game logic and core features. Tests
MUST be written before implementation and MUST fail initially.

**Rules**:
- Game logic: unit tests written first, RED → GREEN → REFACTOR cycle strictly enforced
- UI interactions: integration tests define expected behavior before implementation
- Edge cases: boundary conditions tested (empty boards, completed puzzles, invalid moves)
- Regression: bugs must have tests demonstrating the issue before fixing
- Coverage: Core game logic requires 100% test coverage; UI/presentation requires 80%+

**Rationale**: Mathematical correctness of game rules cannot be verified by manual testing
alone. TDD ensures specifications are clear and logic is provably correct.

### IV. User Experience First

Every feature MUST be designed from the user's perspective. The player's experience and
enjoyment are the ultimate measures of success.

**Rules**:
- Features MUST solve actual user problems or enhance gameplay enjoyment
- UI MUST be intuitive; core actions require zero documentation
- Error messages MUST be helpful and actionable (e.g., "This number conflicts with row 3")
- Visual feedback MUST be immediate for all actions (highlights, animations, confirmations)
- Accessibility MUST be considered: keyboard navigation, screen readers, colorblind modes

**Rationale**: Sudoku is a leisure activity. If the interface frustrates or confuses users,
they will abandon the game regardless of technical quality.

### V. Maintainability & Simplicity

Code MUST be simple, readable, and maintainable. Complexity MUST be justified and
documented. Apply YAGNI (You Aren't Gonna Need It) rigorously.

**Rules**:
- No premature optimization; optimize only when performance tests demonstrate need
- Clear separation: game logic, UI presentation, persistence layers kept independent
- One responsibility per module/function; single source of truth for game state
- Comments explain "why", not "what" (code should be self-documenting for "what")
- Complex algorithms (e.g., puzzle generation) require documentation with references
- Explicitness over cleverness: no predictions, fallbacks, or backwards compatibility until
  explicitly specified in requirements

**Rationale**: Sudoku logic can become complex (backtracking, constraint propagation).
Clear, simple code prevents bugs and enables future enhancements. Implicit behaviors and
"helpful" fallbacks create hidden complexity and obscure bugs.

### VI. Type Safety & TypeScript Standards

Type safety is MANDATORY. TypeScript's type system MUST be leveraged fully to catch errors
at compile time and document contracts explicitly.

**Rules**:
- The `any` type is FORBIDDEN; use `unknown`, proper types, or generics instead
- Strict mode MUST be enabled in TypeScript configuration
- All function parameters and return types MUST be explicitly typed
- Type assertions (e.g., `as Type`) require justification in code comments
- Use discriminated unions for state machines and complex conditional logic
- Interface/type definitions MUST be co-located with implementation or in dedicated type files

**Rationale**: Sudoku involves complex state management (board state, move validation,
undo/redo). TypeScript's type system prevents entire classes of runtime errors and makes
refactoring safe. The `any` type defeats these benefits and hides bugs.

### VII. Communication & Clarification Protocol

Direct communication is ESSENTIAL. Ambiguity must be eliminated through explicit questions
rather than assumptions or predictions.

**Rules**:
- One question per message; focus on clarity and precision
- Never guess or make assumptions when uncertain
- Ask clarifying questions immediately when requirements are unclear
- Prefer explicit confirmation over implicit understanding
- All decisions must be based on clear, unambiguous information
- When multiple valid approaches exist, ask for direction rather than choosing arbitrarily

**Rationale**: Software development suffers from miscommunication and assumptions.
Sudoku projects involve complex game logic, user experience decisions, and technical tradeoffs.
Explicit questioning prevents wasted effort, ensures alignment, and builds a foundation of
trust through transparent communication. Assumptions lead to incorrect implementations
and project delays.

## Quality Standards

**Code Quality**:
- Linting and formatting tools MUST pass before commits
- **TypeScript-specific**: All TypeScript compiler errors MUST be resolved (strict mode)
- **TypeScript-specific**: All ESLint/TSLint warnings MUST be fixed; no warning suppression
  without documented justification
- **TypeScript-specific**: Prettier or equivalent formatter MUST be configured and enforced
- Code reviews MUST verify adherence to all principles
- No compiler/interpreter warnings allowed in production builds
- Security: sanitize all user inputs, validate all game state transitions

**Testing Quality**:
- All tests MUST be deterministic (no flaky tests)
- Test names MUST clearly describe what is being tested and expected outcome
- Integration tests MUST cover complete user journeys
- Performance tests MUST validate response time requirements from Principle II
- **TypeScript-specific**: Test files MUST also adhere to strict typing (no `any` in tests)

**Documentation Quality**:
- User-facing documentation for all non-obvious features
- API/function documentation for all public interfaces
- **TypeScript-specific**: Complex type definitions require explanatory comments
- Architecture decisions documented in ADRs (Architecture Decision Records) when
  deviating from standard patterns

## Development Workflow

**Feature Development**:
1. Specification: Define feature with user scenarios and acceptance criteria
2. Planning: Break down into testable increments, identify technical approach
3. Test-First: Write failing tests that define correct behavior
4. Implementation: Make tests pass with simplest correct solution
5. Refactoring: Improve code quality while keeping tests green
6. Validation: Verify against original user scenarios

**Quality Gates**:
- All tests MUST pass before code review
- **TypeScript-specific**: Zero compiler errors, zero linting warnings
- Code review MUST verify principle compliance
- Performance benchmarks MUST pass for core operations
- User acceptance testing for significant features

**Continuous Integration**:
- Automated tests run on every commit
- **TypeScript-specific**: Type checking (`tsc --noEmit`) runs on every commit
- **TypeScript-specific**: Linting runs on every commit
- Performance regression tests run on every PR
- Build MUST be green before merging to main branch

## Governance

**Authority**: This constitution supersedes all other development practices and conventions.
When conflicts arise, constitution principles take precedence.

**Amendments**:
- Amendments require documented justification explaining why change is needed
- Version MUST be incremented per semantic versioning rules
- Breaking changes (removing/redefining principles) require MAJOR version bump
- All dependent templates and documentation MUST be updated to reflect changes

**Compliance**:
- All pull requests MUST demonstrate adherence to principles
- Principle violations MUST be explicitly justified and documented in plan.md
  Complexity Tracking section
- Periodic reviews (quarterly) to ensure ongoing compliance and relevance
- Team members are expected to challenge decisions that violate principles

**Enforcement**:
- Code reviewers are responsible for verifying principle compliance
- Build system enforces automated quality gates (tests, linting, type checking, performance)
- Project lead resolves disputes about principle interpretation

**Version**: 1.2.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-17

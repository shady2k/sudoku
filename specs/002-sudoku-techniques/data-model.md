# Data Model: Logical Sudoku Puzzle Generation

**Date**: 2025-10-18
**Feature**: Logical Sudoku Puzzle Generation

## Core Entities

### Puzzle

```typescript
interface Puzzle {
  readonly id: string;
  readonly grid: BoardState;
  readonly solution: BoardState;
  readonly difficulty: DifficultyLevel;
  readonly requiredTechniques: TechniqueReference[];
  readonly metadata: PuzzleMetadata;
  readonly createdAt: Date;
}

interface BoardState {
  readonly cells: readonly Cell[];
  readonly candidates: readonly CandidateSet[];
  readonly isValid: boolean;
  readonly isComplete: boolean;
  readonly hash: string; // For caching and identification
}

interface Cell {
  readonly row: number;
  readonly col: number;
  readonly box: number;
  readonly value: number | null;
  readonly candidates: CandidateSet;
  readonly isGiven: boolean;
  readonly isHighlighted: boolean;
}

interface CandidateSet {
  readonly bitmask: number; // 9-bit representation
  readonly count: number;
  readonly values: readonly number[];

  has(candidate: number): boolean;
  add(candidate: number): CandidateSet;
  remove(candidate: number): CandidateSet;
  intersect(other: CandidateSet): CandidateSet;
}

interface PuzzleMetadata {
  readonly generatedBy: string; // Technique name or 'mixed'
  readonly generationTime: number; // milliseconds
  readonly uniqueSolution: boolean;
  readonly minDifficulty: number;
  readonly maxDifficulty: number;
  readonly estimatedSolveTime: number; // seconds
}
```

### Technique

```typescript
interface SolvingTechnique {
  readonly id: string;                                          // kebab-case (e.g., "x-wing")
  readonly name: string;                                        // Display name (e.g., "X-Wing")
  readonly difficulty: DifficultyLevel;                         // Beginner | Intermediate | Advanced | Expert
  readonly patternType: PatternType;                            // elimination | subset | fish | wing | chain | etc.
  readonly description: string;                                 // Brief explanation
  readonly whenToUse: string;                                   // Guidance on applicability
  readonly educational: EducationalContent;

  // Core solving methods
  apply(board: BoardState): TechniqueResult;
  canApply(board: BoardState): boolean;
  findPatterns(board: BoardState): Pattern[];

  // Educational methods
  getHint(board: BoardState): Hint | null;
  explain(board: BoardState, pattern: Pattern): Explanation;
  findExamples(board: BoardState): Example[];
}

enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

enum PatternType {
  ELIMINATION = 'elimination',
  SUBSET = 'subset',
  FISH = 'fish',
  WING = 'wing',
  CHAIN = 'chain',
  COLORING = 'coloring',
  UNIQUENESS = 'uniqueness',
  INTERSECTION = 'intersection',
  FORCING = 'forcing'
}

interface TechniqueResult {
  readonly success: boolean;
  readonly board: BoardState;
  readonly appliedPattern: Pattern | null;
  readonly eliminatedCandidates: CandidateElimination[];
  readonly placedValues: CellPlacement[];
  readonly executionTime: number;
}

interface Pattern {
  readonly id: string;
  readonly technique: string;
  readonly cells: readonly Cell[];
  readonly candidate: number | null;
  readonly description: string;
  readonly visualData: VisualPattern;
}

interface VisualPattern {
  readonly highlightedCells: readonly Cell[];
  readonly highlightedCandidates: readonly Candidate[];
  readonly eliminatedCells: readonly Cell[];
  readonly eliminatedCandidates: readonly Candidate[];
  readonly arrows: readonly Arrow[];
  readonly annotations: readonly Annotation[];
}

interface EducationalContent {
  readonly summary: string;
  readonly whenToUse: string;
  readonly howToSpot: string;
  readonly examples: readonly Example[];
  readonly commonMistakes: readonly string[];
  readonly tips: readonly string[];
}

interface Hint {
  readonly technique: string;
  readonly difficulty: DifficultyLevel;
  readonly message: string;
  readonly highlightedCells: readonly Cell[];
  readonly nextStep: Step;
  readonly educationalTip: string;
}

interface Explanation {
  readonly steps: readonly Step[];
  readonly reasoning: string;
  readonly visualAids: readonly VisualAid[];
}

interface Step {
  readonly action: string;
  readonly cells: readonly Cell[];
  readonly result: string;
  readonly explanation: string;
}
```

### Technique Reference

```typescript
interface TechniqueReference {
  readonly id: string;
  readonly name: string;
  readonly difficulty: DifficultyLevel;                    // Beginner | Intermediate | Advanced | Expert
  readonly patternType: PatternType;                       // Pattern classification
}
```

### Generation Rules

```typescript
interface GenerationRule {
  readonly id: string;
  readonly name: string;
  readonly targetTechnique: string;
  readonly constraints: GenerationConstraints;
  readonly parameters: GenerationParameters;
}

interface GenerationConstraints {
  readonly minDifficulty: number;
  readonly maxDifficulty: number;
  readonly allowedTechniques: readonly string[];
  readonly requiredTechniques: readonly string[];
  readonly forbidTechniques: readonly string[];
  readonly uniqueSolution: boolean;
}

interface GenerationParameters {
  readonly minGivens: number;
  readonly maxGivens: number;
  readonly symmetry: SymmetryType;
  readonly patternComplexity: number;
  readonly multipleTechniques: boolean;
  readonly techniqueFrequency: Record<string, number>;
}

enum SymmetryType {
  NONE = 'none',
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
  DIAGONAL = 'diagonal',
  CENTRAL = 'central',
  FULL = 'full'
}
```

### Difficulty System

```typescript
interface DifficultyLevel {
  readonly id: string;
  readonly name: string;
  readonly percentage: number; // 0-100
  readonly techniqueRange: TechniqueRange;
  readonly description: string;
  readonly color: string; // For UI
}

interface TechniqueRange {
  readonly difficultyLevels: readonly DifficultyLevel[];        // Which levels are allowed
  readonly patternTypes: readonly PatternType[];                // Which pattern types appear
  readonly requiredTechniques: readonly string[];               // Specific technique IDs
}
```

### Educational System

```typescript
interface LearningSession {
  readonly id: string;
  readonly userId: string;
  readonly targetTechnique: string;
  readonly puzzles: readonly Puzzle[];
  readonly progress: SessionProgress;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

interface SessionProgress {
  readonly currentPuzzleIndex: number;
  readonly completedPuzzles: number;
  readonly hintsUsed: number;
  readonly averageTime: number; // seconds per puzzle
  readonly successRate: number; // 0-1
  readonly techniqueMastery: Record<string, MasteryLevel>;
}

interface MasteryLevel {
  readonly technique: string;
  readonly level: number; // 1-5
  readonly practiceCount: number;
  readonly successCount: number;
  readonly averageTime: number;
  readonly lastPracticed: Date;
}

interface UserTechniqueProfile {
  readonly userId: string;
  readonly masteredTechniques: readonly string[];
  readonly currentTechniques: readonly string[];
  readonly techniqueStats: Record<string, TechniqueStats>;
  readonly learningPath: LearningPath;
}

interface TechniqueStats {
  readonly technique: string;
  readonly puzzlesAttempted: number;
  readonly puzzlesCompleted: number;
  readonly averageTime: number;
  readonly hintsUsed: number;
  readonly lastAttempt: Date;
  readonly masteryScore: number; // 0-100
}

interface LearningPath {
  readonly currentPhase: number;
  readonly completedPhases: readonly number[];
  readonly nextTechniques: readonly string[];
  readonly recommendations: readonly Recommendation[];
}

interface Recommendation {
  readonly technique: string;
  readonly reason: string;
  readonly priority: number;
  readonly estimatedTime: number; // minutes
}
```

## Validation Rules

### Puzzle Validation
```typescript
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

interface ValidationError {
  readonly type: 'RULE_VIOLATION' | 'INVALID_STATE' | 'CONSTRAINT_BREACH';
  readonly message: string;
  readonly cells: readonly Cell[];
  readonly severity: 'ERROR' | 'WARNING';
}

// Validation rules
const PUZZLE_VALIDATION_RULES = {
  UNIQUE_SOLUTION: 'Puzzle must have exactly one solution',
  VALID_GIVENS: 'Given numbers must not violate Sudoku rules',
  SOLVABLE: 'Puzzle must be solvable using specified techniques',
  MIN_DIFFICULTY: 'Puzzle must meet minimum difficulty requirements',
  TECHNIQUE_REQUIRES: 'Puzzle must require specified techniques'
};
```

### Technique Validation
```typescript
interface TechniqueValidation {
  readonly isCorrect: boolean;
  readonly pattern: Pattern | null;
  readonly result: TechniqueResult | null;
  readonly errors: readonly string[];
}

// Technique-specific validation rules
const TECHNIQUE_VALIDATION_RULES = {
  CORRECT_APPLICATION: 'Technique must be applied correctly',
  VALID_PATTERN: 'Pattern must match technique requirements',
  CORRECT_ELIMINATIONS: 'Eliminated candidates must be invalid',
  CORRECT_PLACEMENTS: 'Placed values must be correct'
};
```

## State Transitions

### Puzzle Generation State
```typescript
enum PuzzleGenerationState {
  INITIALIZING = 'initializing',
  CREATING_SOLUTION = 'creating-solution',
  APPLYING_PATTERNS = 'applying-patterns',
  REMOVING_CELLS = 'removing-cells',
  VALIDATING = 'validating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface PuzzleGenerationProgress {
  readonly state: PuzzleGenerationState;
  readonly percentage: number;
  readonly currentStep: string;
  readonly estimatedTimeRemaining: number;
  readonly errors: readonly string[];
}
```

### Learning Session State
```typescript
enum LearningState {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

interface LearningSessionState {
  readonly state: LearningState;
  readonly currentPuzzle: number;
  readonly timeSpent: number; // seconds
  readonly lastActivity: Date;
}
```

## Relationships

### Entity Relationships
- **Puzzle** → 1..* **TechniqueReference** (required techniques)
- **Puzzle** → 1 **BoardState** (current state)
- **Puzzle** → 1 **BoardState** (solution)
- **SolvingTechnique** → 0..* **Pattern** (applicable patterns)
- **SolvingTechnique** → 1 **EducationalContent** (learning materials)
- **LearningSession** → 1..* **Puzzle** (practice puzzles)
- **UserTechniqueProfile** → 0..* **TechniqueStats** (individual technique stats)
- **GenerationRule** → 1 **TechniqueReference** (target technique)

### Inheritance Relationships
- **BaseTechnique** ← All 40 concrete technique classes (HiddenSingles, NakedPairs, XWing, etc.)
- **Pattern** ← Specialized pattern types if needed (XWingPattern, SwordfishPattern, etc.)
- **Hint** ← Single Hint interface (no inheritance needed, use discriminated union for levels)

## Performance Considerations

### Indexing Strategy
- **Puzzle.hash**: For caching and duplicate detection
- **Technique.id**: For quick technique lookup in TechniqueRegistry
- **TechniqueRegistry**: Map<id, BaseTechnique> for O(1) lookups
- **UserTechniqueProfile.userId**: For user data retrieval
- **LearningSession.id**: For session management

### Caching Strategy
- **Pattern.cache**: Cache pattern recognition results per board state
- **PuzzleAnalysis.cache**: Cache full analysis results by puzzle hash
- **TechniqueRegistry.categoryCache**: Pre-computed lists by category for faster queries

### Memory Optimization
- **Bitmask operations**: Use existing FastValidator patterns
- **Lazy loading**: Load complex techniques on-demand
- **Object pooling**: Reuse BoardState and Pattern objects

## Type Safety Considerations

### Discriminated Unions
```typescript
type TechniqueEvent =
  | { type: 'TECHNIQUE_FOUND'; technique: string; pattern: Pattern }
  | { type: 'TECHNIQUE_APPLIED'; technique: string; result: TechniqueResult }
  | { type: 'TECHNIQUE_FAILED'; technique: string; error: string };

type UserAction =
  | { type: 'REQUEST_HINT'; puzzleId: string; technique?: string }
  | { type: 'APPLY_TECHNIQUE'; puzzleId: string; technique: string }
  | { type: 'SKIP_PUZZLE'; puzzleId: string }
  | { type: 'COMPLETE_SESSION'; sessionId: string };
```

### Strict Type Enforcement
- No `any` types (Constitution Principle VI)
- Explicit return types for all functions
- Readonly interfaces for immutable data
- Branded types for entity IDs
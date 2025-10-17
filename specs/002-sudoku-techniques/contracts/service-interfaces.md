# Service Interfaces: Logical Sudoku Puzzle Generation

**Date**: 2025-10-18
**Architecture**: Browser-based offline application (no external APIs)

## Core Service Interfaces

### Puzzle Generator Service

```typescript
export interface IPuzzleGenerator {
  generatePuzzle(request: PuzzleGenerationRequest): Promise<Puzzle>;
  validatePuzzle(puzzle: BoardState): Promise<PuzzleValidationResult>;
  generateBatch(requests: PuzzleGenerationRequest[]): Promise<Puzzle[]>;
}

export interface PuzzleGenerationRequest {
  techniqueIds: string[];
  difficulty?: {
    min: number;
    max: number;
  };
  multipleTechniques?: boolean;
  educational?: boolean;
  symmetry?: SymmetryType;
  minGivens?: number;
  maxGivens?: number;
}

export interface PuzzleValidationResult {
  isValid: boolean;
  hasUniqueSolution: boolean;
  requiredTechniques: TechniqueReference[];
  estimatedDifficulty: DifficultyLevel;
  validationErrors: ValidationError[];
}
```

### Technique Registry Service

```typescript
export interface ITechniqueRegistry {
  register(technique: SolvingTechnique): void;
  getTechnique(id: string): SolvingTechnique | undefined;
  getTechniquesByCategory(category: TechniqueCategory): SolvingTechnique[];
  getTechniquesByDifficulty(maxDifficulty: number): SolvingTechnique[];
  getAllTechniques(): SolvingTechnique[];
  isTechniqueAvailable(id: string): boolean;
}

export interface SolvingTechnique {
  readonly id: string;
  readonly name: string;
  readonly category: TechniqueCategory;
  readonly difficulty: number;

  // Core solving methods
  apply(board: BoardState): TechniqueResult;
  canApply(board: BoardState): boolean;
  findPatterns(board: BoardState): Pattern[];

  // Educational methods
  getHint(board: BoardState): Hint | null;
  explain(board: BoardState, pattern: Pattern): Explanation;
  findExamples(board: BoardState): Example[];
}
```

### Educational Service

```typescript
export interface IEducationalService {
  createLearningSession(request: LearningSessionRequest): Promise<LearningSession>;
  getNextHint(sessionId: string, puzzle: BoardState): Promise<Hint>;
  updateProgress(sessionId: string, progress: ProgressUpdate): Promise<void>;
  getSessionProgress(sessionId: string): Promise<SessionProgress>;
  getRecommendations(userId: string): Promise<Recommendation[]>;
}

export interface LearningSessionRequest {
  targetTechnique: string;
  difficulty: DifficultyLevel;
  puzzleCount?: number;
  educationalMode?: boolean;
  userLevel?: number;
}

export interface ProgressUpdate {
  sessionId: string;
  puzzleId: string;
  action: 'COMPLETED' | 'HINT_USED' | 'SKIPPED';
  timeSpent: number;
  hintsUsed: number;
}
```

### Storage Service

```typescript
export interface IStorageService {
  // Puzzle storage
  savePuzzle(puzzle: Puzzle): Promise<void>;
  loadPuzzle(id: string): Promise<Puzzle | null>;
  deletePuzzle(id: string): Promise<void>;

  // Learning session storage
  saveLearningSession(session: LearningSession): Promise<void>;
  loadLearningSession(id: string): Promise<LearningSession | null>;
  getActiveSessions(): Promise<LearningSession[]>;

  // User progress storage
  saveUserProgress(progress: UserTechniqueProfile): Promise<void>;
  loadUserProgress(userId: string): Promise<UserTechniqueProfile | null>;

  // Settings storage
  saveSettings(settings: UserSettings): Promise<void>;
  loadSettings(): Promise<UserSettings>;
}

export interface UserSettings {
  educationalMode: boolean;
  showHints: boolean;
  difficulty: DifficultyLevel;
  preferredTechniques: string[];
  animationsEnabled: boolean;
  colorblindMode: boolean;
}
```

### UI Component Interfaces

```typescript
export interface IPuzzleDisplay {
  renderPuzzle(puzzle: Puzzle): void;
  updateCell(row: number, col: number, value: number | null): void;
  highlightCells(cells: Cell[], style: HighlightStyle): void;
  showHint(hint: Hint): void;
  animateTechnique(technique: string, pattern: Pattern): void;
}

export interface ITechniqueSelector {
  loadTechniques(techniques: SolvingTechnique[]): void;
  selectTechnique(techniqueId: string): void;
  filterByCategory(category: TechniqueCategory): void;
  filterByDifficulty(min: number, max: number): void;
}

export interface ILearningPanel {
  startSession(session: LearningSession): void;
  showHint(hint: Hint): void;
  updateProgress(progress: SessionProgress): void;
  showExplanation(explanation: Explanation): void;
}
```

## Event System Interfaces

```typescript
export interface IEventBus {
  emit(event: GameEvent): void;
  on(eventType: string, handler: EventHandler): void;
  off(eventType: string, handler: EventHandler): void;
}

export type GameEvent =
  | PuzzleGeneratedEvent
  | TechniqueAppliedEvent
  | HintRequestedEvent
  | LearningSessionEvent
  | ProgressUpdateEvent;

export interface PuzzleGeneratedEvent {
  type: 'PUZZLE_GENERATED';
  puzzle: Puzzle;
  generationTime: number;
}

export interface TechniqueAppliedEvent {
  type: 'TECHNIQUE_APPLIED';
  technique: string;
  result: TechniqueResult;
  board: BoardState;
}

export interface HintRequestedEvent {
  type: 'HINT_REQUESTED';
  puzzleId: string;
  technique?: string;
}

export interface LearningSessionEvent {
  type: 'LEARNING_SESSION_' + 'STARTED' | 'COMPLETED' | 'PAUSED';
  sessionId: string;
  technique: string;
}
```

## Performance Monitoring Interfaces

```typescript
export interface IPerformanceMonitor {
  startOperation(operation: string): void;
  endOperation(operation: string): void;
  getMetrics(): PerformanceMetrics;
  resetMetrics(): void;
}

export interface PerformanceMetrics {
  puzzleGeneration: {
    averageTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
  };
  techniqueApplication: Record<string, {
    averageTime: number;
    successRate: number;
    usageCount: number;
  }>;
  userInteractions: {
    averageResponseTime: number;
    totalInteractions: number;
  };
}
```

## Configuration Interfaces

```typescript
export interface IConfiguration {
  // Generation settings
  maxGenerationTime: number; // milliseconds
  cacheEnabled: boolean;
  webWorkersEnabled: boolean;

  // Educational settings
  maxHintsPerPuzzle: number;
  hintDifficultyScaling: boolean;
  progressTrackingEnabled: boolean;

  // Performance settings
  enableCaching: boolean;
  cacheSize: number;
  enableWebWorkers: boolean;
  workerPoolSize: number;

  // UI settings
  animationDuration: number;
  highlightColors: Record<string, string>;
  showTechniqueNames: boolean;
}

export const DEFAULT_CONFIGURATION: IConfiguration = {
  maxGenerationTime: 15000,
  cacheEnabled: true,
  webWorkersEnabled: true,
  maxHintsPerPuzzle: 3,
  hintDifficultyScaling: true,
  progressTrackingEnabled: true,
  enableCaching: true,
  cacheSize: 100,
  enableWebWorkers: true,
  workerPoolSize: 2,
  animationDuration: 300,
  highlightColors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    elimination: '#ef4444',
    hint: '#f59e0b'
  },
  showTechniqueNames: true
};
```

## Implementation Patterns

### Service Factory

```typescript
export class ServiceFactory {
  private static services: Map<string, any> = new Map();

  static createPuzzleGenerator(): IPuzzleGenerator {
    if (!this.services.has('puzzleGenerator')) {
      const techniqueRegistry = this.createTechniqueRegistry();
      const storageService = this.createStorageService();
      this.services.set('puzzleGenerator', new PuzzleGeneratorService(
        techniqueRegistry,
        storageService
      ));
    }
    return this.services.get('puzzleGenerator');
  }

  static createTechniqueRegistry(): ITechniqueRegistry {
    if (!this.services.has('techniqueRegistry')) {
      this.services.set('techniqueRegistry', new TechniqueRegistryService());
    }
    return this.services.get('techniqueRegistry');
  }

  static createEducationalService(): IEducationalService {
    if (!this.services.has('educationalService')) {
      const techniqueRegistry = this.createTechniqueRegistry();
      const storageService = this.createStorageService();
      this.services.set('educationalService', new EducationalService(
        techniqueRegistry,
        storageService
      ));
    }
    return this.services.get('educationalService');
  }

  static createStorageService(): IStorageService {
    if (!this.services.has('storageService')) {
      this.services.set('storageService', new LocalStorageService());
    }
    return this.services.get('storageService');
  }
}
```

### Service Usage Examples

```typescript
// Generate a puzzle with specific techniques
async function generateTechniquePuzzle(): Promise<Puzzle> {
  const generator = ServiceFactory.createPuzzleGenerator();

  return await generator.generatePuzzle({
    techniqueIds: ['x-wing', 'swordfish'],
    difficulty: { min: 60, max: 80 },
    educational: true,
    symmetry: SymmetryType.DIAGONAL
  });
}

// Create a learning session
async function startLearningSession(techniqueId: string): Promise<LearningSession> {
  const educationalService = ServiceFactory.createEducationalService();

  return await educationalService.createLearningSession({
    targetTechnique: techniqueId,
    difficulty: { percentage: 70 },
    puzzleCount: 5,
    educationalMode: true,
    userLevel: 2
  });
}

// Get a hint for current puzzle
async function getHintForPuzzle(
  sessionId: string,
  puzzle: BoardState
): Promise<Hint> {
  const educationalService = ServiceFactory.createEducationalService();

  return await educationalService.getNextHint(sessionId, puzzle);
}
```

## Data Transfer Objects

### Puzzle DTOs

```typescript
export interface PuzzleDTO {
  id: string;
  grid: number[][];
  solution: number[][];
  difficulty: DifficultyLevelDTO;
  requiredTechniques: TechniqueReferenceDTO[];
  metadata: PuzzleMetadataDTO;
  createdAt: string;
}

export interface DifficultyLevelDTO {
  id: string;
  name: string;
  percentage: number;
  techniqueRange: TechniqueRangeDTO;
  color: string;
}

export interface TechniqueReferenceDTO {
  id: string;
  name: string;
  category: TechniqueCategory;
  difficulty: number;
  occurrences: number;
}
```

### Learning DTOs

```typescript
export interface LearningSessionDTO {
  id: string;
  targetTechnique: string;
  puzzles: PuzzleDTO[];
  progress: SessionProgressDTO;
  startedAt: string;
  completedAt?: string;
}

export interface SessionProgressDTO {
  currentPuzzleIndex: number;
  completedPuzzles: number;
  hintsUsed: number;
  averageTime: number;
  successRate: number;
  techniqueMastery: Record<string, MasteryLevelDTO>;
}

export interface HintDTO {
  technique: string;
  difficulty: number;
  message: string;
  highlightedCells: CellDTO[];
  nextStep: StepDTO;
  educationalTip: string;
}
```

This service interface design provides a clean, modular architecture for the offline Sudoku application without requiring external APIs, while supporting both puzzle generation and educational features as requested.
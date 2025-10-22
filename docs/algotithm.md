# Sudoku Puzzle Generator - Complete Implementation Specification

## Table of Contents
1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [Difficulty Level Specifications](#difficulty-level-specifications)
4. [Algorithm Components](#algorithm-components)
5. [Implementation Details](#implementation-details)
6. [Testing & Validation](#testing--validation)
7. [Performance Requirements](#performance-requirements)

---

## Overview

### Goal
Implement a Sudoku puzzle generator that creates puzzles across 5 difficulty levels (Extremely Easy to Evil) using the "dig-hole" strategy.

### Two-Phase Approach
1. **Phase 1**: Generate a complete valid Sudoku grid (terminal pattern)
2. **Phase 2**: Remove digits strategically to create puzzle of desired difficulty

### Key Algorithms
- **Las Vegas Algorithm** - for terminal pattern generation
- **Depth-First Search** - for solving and uniqueness verification
- **Dig-Hole Strategy** - for puzzle creation with pruning optimization

---

## Data Structures

### Grid Representation
```python
# 9x9 grid, 0 represents empty cell, 1-9 are digits
Grid = List[List[int]]  # or numpy array (9, 9)

# Example:
grid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    # ... 7 more rows
]
```

### Cell Coordinates
```python
Cell = Tuple[int, int]  # (row, col), both 0-indexed (0-8)
```

### Difficulty Levels
```python
from enum import Enum

class DifficultyLevel(Enum):
    EXTREMELY_EASY = 1
    EASY = 2
    MEDIUM = 3
    DIFFICULT = 4
    EVIL = 5
```

### Configuration Data Structure
```python
@dataclass
class DifficultyConfig:
    level: DifficultyLevel
    min_givens: int
    max_givens: int
    lower_bound_per_row_col: int
    sequence_type: str
    min_search_count: int
    max_search_count: int
    weight_givens: float = 0.4
    weight_distribution: float = 0.2
    weight_techniques: float = 0.2
    weight_searches: float = 0.2
```

---

## Difficulty Level Specifications

### Complete Configuration Table

```python
DIFFICULTY_CONFIGS = {
    DifficultyLevel.EXTREMELY_EASY: DifficultyConfig(
        level=DifficultyLevel.EXTREMELY_EASY,
        min_givens=50,
        max_givens=81,
        lower_bound_per_row_col=5,
        sequence_type="RANDOM",
        min_search_count=0,
        max_search_count=100
    ),
    
    DifficultyLevel.EASY: DifficultyConfig(
        level=DifficultyLevel.EASY,
        min_givens=36,
        max_givens=49,
        lower_bound_per_row_col=4,
        sequence_type="RANDOM",
        min_search_count=100,
        max_search_count=999
    ),
    
    DifficultyLevel.MEDIUM: DifficultyConfig(
        level=DifficultyLevel.MEDIUM,
        min_givens=32,
        max_givens=35,
        lower_bound_per_row_col=3,
        sequence_type="JUMPING",
        min_search_count=1000,
        max_search_count=9999
    ),
    
    DifficultyLevel.DIFFICULT: DifficultyConfig(
        level=DifficultyLevel.DIFFICULT,
        min_givens=28,
        max_givens=31,
        lower_bound_per_row_col=2,
        sequence_type="S_PATTERN",
        min_search_count=10000,
        max_search_count=99999
    ),
    
    DifficultyLevel.EVIL: DifficultyConfig(
        level=DifficultyLevel.EVIL,
        min_givens=22,
        max_givens=27,
        lower_bound_per_row_col=0,  # No minimum!
        sequence_type="LEFT_RIGHT_TOP_BOTTOM",
        min_search_count=100000,
        max_search_count=float('inf')
    )
}
```

### Difficulty Scoring Weights
```python
SCORING_WEIGHTS = {
    'total_givens': 0.4,
    'distribution': 0.2,
    'techniques': 0.2,
    'search_count': 0.2
}

SCORE_RANGES = {
    DifficultyLevel.EXTREMELY_EASY: (0.0, 1.5),
    DifficultyLevel.EASY: (1.5, 2.5),
    DifficultyLevel.MEDIUM: (2.5, 3.5),
    DifficultyLevel.DIFFICULT: (3.5, 4.5),
    DifficultyLevel.EVIL: (4.5, 5.0)
}
```

---

## Algorithm Components

### 1. Terminal Pattern Generation (Las Vegas)

#### Parameters
```python
LAS_VEGAS_CONFIG = {
    'initial_random_givens': 11,  # Optimal value
    'timeout_seconds': 0.1,
    'max_attempts': 1000
}
```

#### Algorithm
```python
def create_terminal_pattern() -> Grid:
    """
    Generate a complete valid 9x9 Sudoku grid.
    
    Returns:
        Complete valid grid (all cells filled 1-9)
    """
    while True:
        grid = create_empty_grid()
        
        # Step 1: Place 11 random givens
        cells = random.sample(range(81), 11)
        for cell_idx in cells:
            row, col = cell_idx // 9, cell_idx % 9
            digit = random.randint(1, 9)
            
            if is_valid_placement(grid, row, col, digit):
                grid[row][col] = digit
        
        # Step 2: Complete with DFS solver (with timeout)
        start_time = time.time()
        if solve_with_timeout(grid, timeout=0.1):
            return grid
        
        # If timeout, retry
```

#### Expected Performance
- Success rate with n=11: ~90-95%
- Average attempts needed: 1-2
- Total time: <200ms typically

---

### 2. Digging Sequences

#### Sequence Implementations

```python
def get_digging_sequence(sequence_type: str) -> List[Cell]:
    """
    Generate the order in which cells will be considered for digging.
    
    Args:
        sequence_type: One of RANDOM, JUMPING, S_PATTERN, LEFT_RIGHT_TOP_BOTTOM
    
    Returns:
        List of (row, col) tuples in digging order
    """
    pass
```

#### Type 1: LEFT_RIGHT_TOP_BOTTOM (for Evil)
```python
def sequence_left_right_top_bottom() -> List[Cell]:
    """
    Scan left to right, top to bottom.
    
    Order: (0,0) → (0,1) → ... → (0,8) → (1,0) → ... → (8,8)
    """
    return [(row, col) for row in range(9) for col in range(9)]
```

#### Type 2: S_PATTERN (for Difficult)
```python
def sequence_s_pattern() -> List[Cell]:
    """
    Alternate direction each row (like reading an 'S').
    
    Row 0: left → right: (0,0) → (0,1) → ... → (0,8)
    Row 1: right → left: (1,8) → (1,7) → ... → (1,0)
    Row 2: left → right: (2,0) → (2,1) → ... → (2,8)
    ...
    """
    sequence = []
    for row in range(9):
        if row % 2 == 0:
            # Left to right
            sequence.extend([(row, col) for col in range(9)])
        else:
            # Right to left
            sequence.extend([(row, col) for col in range(8, -1, -1)])
    return sequence
```

#### Type 3: JUMPING (for Medium)
```python
def sequence_jumping() -> List[Cell]:
    """
    Checkerboard pattern: jump one cell each time.
    
    Visual pattern:
    X . X . X . X . X
    . X . X . X . X .
    X . X . X . X . X
    ...
    
    Process all 'X' cells first, then all '.' cells
    """
    sequence = []
    
    # First pass: checkerboard pattern
    for row in range(9):
        for col in range(9):
            if (row + col) % 2 == 0:
                sequence.append((row, col))
    
    # Second pass: remaining cells
    for row in range(9):
        for col in range(9):
            if (row + col) % 2 == 1:
                sequence.append((row, col))
    
    return sequence
```

#### Type 4: RANDOM (for Easy/Extremely Easy)
```python
def sequence_random() -> List[Cell]:
    """
    Completely random order.
    """
    cells = [(row, col) for row in range(9) for col in range(9)]
    random.shuffle(cells)
    return cells
```

#### Sequence Selection
```python
SEQUENCE_MAP = {
    "LEFT_RIGHT_TOP_BOTTOM": sequence_left_right_top_bottom,
    "S_PATTERN": sequence_s_pattern,
    "JUMPING": sequence_jumping,
    "RANDOM": sequence_random
}
```

---

### 3. Constraint Checking

#### Basic Sudoku Rules
```python
def is_valid_placement(grid: Grid, row: int, col: int, digit: int) -> bool:
    """
    Check if placing digit at (row, col) violates Sudoku rules.
    
    Returns:
        True if placement is valid
    """
    # Check row
    if digit in grid[row]:
        return False
    
    # Check column
    if digit in [grid[r][col] for r in range(9)]:
        return False
    
    # Check 3x3 block
    block_row, block_col = 3 * (row // 3), 3 * (col // 3)
    for r in range(block_row, block_row + 3):
        for c in range(block_col, block_col + 3):
            if grid[r][c] == digit:
                return False
    
    return True
```

#### Restriction Checks
```python
def check_restriction_1(grid: Grid, config: DifficultyConfig) -> bool:
    """
    Check if total givens count is within acceptable range.
    
    Restriction 1: min_givens <= current_givens <= max_givens
    """
    givens_count = sum(1 for row in grid for cell in row if cell != 0)
    return config.min_givens <= givens_count <= config.max_givens


def check_restriction_2(grid: Grid, cell: Cell, lower_bound: int) -> bool:
    """
    Check if removing this cell would violate row/column lower bounds.
    
    Restriction 2: Each row and column must have >= lower_bound givens
    
    Args:
        grid: Current puzzle state
        cell: Cell being considered for digging
        lower_bound: Minimum givens per row/column
    
    Returns:
        True if digging this cell is allowed
    """
    row, col = cell
    
    # Count givens in this row (excluding current cell)
    row_givens = sum(1 for c in range(9) if grid[row][c] != 0 and c != col)
    
    # Count givens in this column (excluding current cell)
    col_givens = sum(1 for r in range(9) if grid[r][col] != 0 and r != row)
    
    # Must maintain lower bound after digging
    return row_givens >= lower_bound and col_givens >= lower_bound
```

---

### 4. Depth-First Search Solver

#### Core Solver
```python
def solve_sudoku(grid: Grid, find_all: bool = False, 
                 max_solutions: int = 2) -> Tuple[int, List[Grid]]:
    """
    Solve Sudoku puzzle using Depth-First Search with backtracking.
    
    Args:
        grid: Puzzle to solve (modified in-place during search)
        find_all: If True, find all solutions; if False, stop at first
        max_solutions: Stop after finding this many solutions
    
    Returns:
        (solution_count, list_of_solutions)
    """
    solutions = []
    
    def dfs(grid: Grid) -> bool:
        # Find next empty cell (left to right, top to bottom)
        for row in range(9):
            for col in range(9):
                if grid[row][col] == 0:
                    # Try each digit 1-9
                    for digit in range(1, 10):
                        if is_valid_placement(grid, row, col, digit):
                            grid[row][col] = digit
                            
                            if dfs(grid):
                                if not find_all:
                                    return True
                            
                            grid[row][col] = 0  # Backtrack
                    
                    return False  # No valid digit found
        
        # All cells filled - found a solution
        solutions.append([row[:] for row in grid])
        return len(solutions) < max_solutions
    
    dfs(grid)
    return len(solutions), solutions


def has_unique_solution(grid: Grid) -> bool:
    """
    Check if puzzle has exactly one solution.
    
    Returns:
        True if puzzle has unique solution
    """
    solution_count, _ = solve_sudoku(grid.copy(), max_solutions=2)
    return solution_count == 1
```

#### Solver with Timeout
```python
def solve_with_timeout(grid: Grid, timeout: float = 0.1) -> bool:
    """
    Attempt to solve grid with time limit.
    
    Used in Las Vegas algorithm for terminal pattern generation.
    
    Returns:
        True if solved within timeout
    """
    import signal
    
    def timeout_handler(signum, frame):
        raise TimeoutError()
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.setitimer(signal.ITIMER_REAL, timeout)
    
    try:
        count, solutions = solve_sudoku(grid, max_solutions=1)
        signal.setitimer(signal.ITIMER_REAL, 0)  # Cancel timer
        return count == 1
    except TimeoutError:
        signal.setitimer(signal.ITIMER_REAL, 0)
        return False
```

#### Search Counter (for difficulty scoring)
```python
def count_enumeration_searches(grid: Grid) -> int:
    """
    Count how many search attempts are needed to solve.
    
    Used for difficulty estimation.
    
    Returns:
        Number of DFS attempts/backtracks
    """
    search_count = 0
    
    def dfs(grid: Grid) -> bool:
        nonlocal search_count
        
        for row in range(9):
            for col in range(9):
                if grid[row][col] == 0:
                    for digit in range(1, 10):
                        search_count += 1  # Count each attempt
                        
                        if is_valid_placement(grid, row, col, digit):
                            grid[row][col] = digit
                            
                            if dfs(grid):
                                return True
                            
                            grid[row][col] = 0
                    
                    return False
        return True
    
    dfs(grid.copy())
    return search_count
```

---

### 5. Uniqueness Check (Reduction to Absurdity)

```python
def is_unique_after_digging(grid: Grid, cell: Cell) -> bool:
    """
    Check if removing digit at cell maintains unique solution.
    
    Uses "reduction to absurdity" method:
    1. Try substituting original digit with each alternative (1-9)
    2. If ANY alternative leads to a valid solution, puzzle is NOT unique
    3. If ALL alternatives fail, puzzle remains unique
    
    Args:
        grid: Current puzzle state
        cell: Cell being considered for digging
    
    Returns:
        True if digging this cell maintains uniqueness
    """
    row, col = cell
    original_digit = grid[row][col]
    
    if original_digit == 0:
        return False  # Already empty
    
    # Try each alternative digit
    for alternative_digit in range(1, 10):
        if alternative_digit == original_digit:
            continue  # Skip original
        
        # Check if alternative satisfies basic constraints
        if not is_valid_placement(grid, row, col, alternative_digit):
            continue  # This alternative is immediately invalid
        
        # Temporarily substitute
        grid[row][col] = alternative_digit
        
        # Check if puzzle still solvable
        solution_count, _ = solve_sudoku(grid.copy(), max_solutions=1)
        
        # Restore original
        grid[row][col] = original_digit
        
        if solution_count >= 1:
            # Found alternative solution!
            # If we dig the original, puzzle will have 2+ solutions
            return False
    
    # All alternatives failed - unique solution guaranteed
    return True
```

**Critical Performance Note**: This is the most expensive operation. For evil puzzles, it may require 100,000+ DFS searches per generation.

---

### 6. Pruning Optimization

```python
class PuzzleDigger:
    """
    Stateful digger with pruning optimizations.
    """
    
    def __init__(self, terminal: Grid, config: DifficultyConfig):
        self.terminal = terminal
        self.config = config
        self.puzzle = [row[:] for row in terminal]  # Deep copy
        self.explored_cells = set()  # Critical for pruning
        self.dig_history = []  # For debugging
    
    def can_dig_cell(self, cell: Cell) -> bool:
        """
        Check if cell can be dug (all restrictions + pruning).
        
        Pruning rules:
        1. Cell must not have been explored before
        2. Cell must not already be empty
        3. Must satisfy restriction checks
        """
        row, col = cell
        
        # Pruning rule 1: Never revisit
        if cell in self.explored_cells:
            return False
        
        # Pruning rule 2: Must have a digit
        if self.puzzle[row][col] == 0:
            return False
        
        # Restriction 1: Total givens
        current_givens = sum(1 for r in self.puzzle for c in r if c != 0)
        if current_givens - 1 < self.config.min_givens:
            return False
        
        # Restriction 2: Row/column lower bounds
        if not check_restriction_2(self.puzzle, cell, 
                                   self.config.lower_bound_per_row_col):
            return False
        
        return True
    
    def dig_cell(self, cell: Cell) -> bool:
        """
        Attempt to dig a cell.
        
        Returns:
            True if successfully dug (maintains unique solution)
        """
        row, col = cell
        
        # Mark as explored (CRITICAL: do this FIRST)
        self.explored_cells.add(cell)
        
        if not self.can_dig_cell(cell):
            return False
        
        # Check uniqueness
        if is_unique_after_digging(self.puzzle, cell):
            # Dig it!
            original = self.puzzle[row][col]
            self.puzzle[row][col] = 0
            self.dig_history.append((cell, original))
            return True
        
        return False
    
    def get_current_givens(self) -> int:
        """Count current givens in puzzle."""
        return sum(1 for row in self.puzzle for cell in row if cell != 0)
```

**Pruning Impact**:
- Without pruning: ~55,000 ms average
- With pruning: ~1,000 ms average
- **50x speedup**

---

### 7. Equivalent Propagation (Diversity)

```python
def apply_random_propagation(grid: Grid) -> Grid:
    """
    Apply random valid transformations to increase puzzle diversity.
    
    All transformations preserve:
    - Puzzle validity
    - Solution uniqueness
    - Difficulty level
    """
    grid = [row[:] for row in grid]  # Copy
    
    num_transformations = random.randint(1, 5)
    
    for _ in range(num_transformations):
        transform_type = random.choice([
            'digit_swap',
            'column_swap',
            'block_column_swap',
            'grid_rotate'
        ])
        
        if transform_type == 'digit_swap':
            grid = propagation_digit_swap(grid)
        elif transform_type == 'column_swap':
            grid = propagation_column_swap(grid)
        elif transform_type == 'block_column_swap':
            grid = propagation_block_column_swap(grid)
        elif transform_type == 'grid_rotate':
            grid = propagation_grid_rotate(grid)
    
    return grid
```

#### Propagation Type 1: Digit Swap
```python
def propagation_digit_swap(grid: Grid) -> Grid:
    """
    Swap two digits globally.
    
    Example: Exchange all 3s with all 7s
    """
    digit1, digit2 = random.sample(range(1, 10), 2)
    
    new_grid = []
    for row in grid:
        new_row = []
        for cell in row:
            if cell == digit1:
                new_row.append(digit2)
            elif cell == digit2:
                new_row.append(digit1)
            else:
                new_row.append(cell)
        new_grid.append(new_row)
    
    return new_grid
```

#### Propagation Type 2: Column Swap
```python
def propagation_column_swap(grid: Grid) -> Grid:
    """
    Swap two columns within the same block-column.
    
    Block-columns: [0,1,2], [3,4,5], [6,7,8]
    Can swap columns 0↔1, 1↔2, 0↔2 (within first block)
    """
    # Choose a block-column (0, 1, or 2)
    block_col = random.randint(0, 2)
    base = block_col * 3
    
    # Choose two columns within that block
    col1, col2 = random.sample([base, base+1, base+2], 2)
    
    new_grid = [row[:] for row in grid]
    for row in range(9):
        new_grid[row][col1], new_grid[row][col2] = \
            new_grid[row][col2], new_grid[row][col1]
    
    return new_grid
```

#### Propagation Type 3: Block-Column Swap
```python
def propagation_block_column_swap(grid: Grid) -> Grid:
    """
    Swap two entire block-columns.
    
    Block-columns: [cols 0-2], [cols 3-5], [cols 6-8]
    """
    block1, block2 = random.sample([0, 1, 2], 2)
    
    new_grid = [row[:] for row in grid]
    for row in range(9):
        for i in range(3):
            col1 = block1 * 3 + i
            col2 = block2 * 3 + i
            new_grid[row][col1], new_grid[row][col2] = \
                new_grid[row][col2], new_grid[row][col1]
    
    return new_grid
```

#### Propagation Type 4: Grid Rotation
```python
def propagation_grid_rotate(grid: Grid) -> Grid:
    """
    Rotate entire grid 90° clockwise.
    """
    return [[grid[8-col][row] for col in range(9)] for row in range(9)]
```

**Note**: Can also implement row swaps and block-row swaps (symmetric to column operations).

---

## Implementation Details

### Main Generation Function

```python
def generate_sudoku_puzzle(difficulty: DifficultyLevel, 
                          timeout: float = 30.0) -> Optional[Grid]:
    """
    Generate a Sudoku puzzle of specified difficulty.
    
    Args:
        difficulty: Target difficulty level
        timeout: Maximum time allowed (seconds)
    
    Returns:
        Generated puzzle (9x9 grid) or None if timeout
    """
    config = DIFFICULTY_CONFIGS[difficulty]
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        # Step 1: Create terminal pattern
        terminal = create_terminal_pattern()
        
        # Step 2: Initialize digger
        digger = PuzzleDigger(terminal, config)
        
        # Step 3: Get digging sequence
        sequence_func = SEQUENCE_MAP[config.sequence_type]
        sequence = sequence_func()
        
        # Step 4: Dig holes
        target_givens = random.randint(config.min_givens, config.max_givens)
        
        for cell in sequence:
            if digger.get_current_givens() <= target_givens:
                break
            
            digger.dig_cell(cell)  # Handles all checks internally
        
        # Step 5: Check if we achieved target
        final_givens = digger.get_current_givens()
        if config.min_givens <= final_givens <= config.max_givens:
            # Step 6: Apply propagation
            puzzle = apply_random_propagation(digger.puzzle)
            
            # Step 7: Verify quality
            if verify_puzzle_quality(puzzle, config):
                return puzzle
    
    return None  # Timeout


def verify_puzzle_quality(puzzle: Grid, config: DifficultyConfig) -> bool:
    """
    Verify generated puzzle meets quality standards.
    """
    # Check unique solution
    if not has_unique_solution(puzzle):
        return False
    
    # Check givens count
    givens = sum(1 for row in puzzle for cell in row if cell != 0)
    if not (config.min_givens <= givens <= config.max_givens):
        return False
    
    # For evil puzzles, verify high search count
    if config.level == DifficultyLevel.EVIL:
        search_count = count_enumeration_searches(puzzle)
        if search_count < 100000:
            return False  # Not hard enough
    
    return True
```

---

### Evil Puzzle Specific Optimizations

```python
def generate_evil_puzzle_optimized(max_attempts: int = 10) -> Optional[Grid]:
    """
    Optimized evil puzzle generation with multiple strategies.
    
    Evil puzzles are hardest to generate, so use multiple attempts
    with slight variations.
    """
    config = DIFFICULTY_CONFIGS[DifficultyLevel.EVIL]
    
    for attempt in range(max_attempts):
        terminal = create_terminal_pattern()
        digger = PuzzleDigger(terminal, config)
        
        # Use strict left-right top-bottom sequence
        sequence = sequence_left_right_top_bottom()
        
        # Aim for lower end of givens range (22-24)
        target_givens = random.randint(22, 24)
        
        for cell in sequence:
            if digger.get_current_givens() <= target_givens:
                break
            
            # For evil, check uniqueness is expensive
            # Only check if restrictions pass
            if digger.can_dig_cell(cell):
                digger.dig_cell(cell)
        
        puzzle = digger.puzzle
        
        # Verify it's actually evil difficulty
        if verify_evil_puzzle(puzzle):
            return apply_random_propagation(puzzle)
    
    return None


def verify_evil_puzzle(puzzle: Grid) -> bool:
    """
    Strict verification for evil puzzles.
    """
    # Must have unique solution
    if not has_unique_solution(puzzle):
        return False
    
    # Check givens count
    givens = sum(1 for row in puzzle for cell in row if cell != 0)
    if not (22 <= givens <= 27):
        return False
    
    # Verify high search complexity
    search_count = count_enumeration_searches(puzzle)
    if search_count < 100000:
        return False
    
    # Verify at least one row/column has very few givens (≤2)
    min_row_givens = min(sum(1 for cell in row if cell != 0) 
                         for row in puzzle)
    min_col_givens = min(sum(1 for row in puzzle if row[col] != 0) 
                         for col in range(9))
    
    if min_row_givens > 2 and min_col_givens > 2:
        return False  # Not sparse enough
    
    return True
```

---

### Utility Functions

```python
def create_empty_grid() -> Grid:
    """Create 9x9 grid filled with zeros."""
    return [[0 for _ in range(9)] for _ in range(9)]


def copy_grid(grid: Grid) -> Grid:
    """Deep copy of grid."""
    return [row[:] for row in grid]


def count_givens(grid: Grid) -> int:
    """Count non-zero cells."""
    return sum(1 for row in grid for cell in row if cell != 0)


def print_grid(grid: Grid) -> None:
    """Pretty print Sudoku grid."""
    for i, row in enumerate(grid):
        if i % 3 == 0 and i != 0:
            print("-" * 21)
        
        for j, cell in enumerate(row):
            if j % 3 == 0 and j != 0:
                print("|", end=" ")
            
            print(cell if cell != 0 else ".", end=" ")
        print()


def grid_to_string(grid: Grid) -> str:
    """Convert grid to string (81 characters, 0 for empty)."""
    return ''.join(str(cell) for row in grid for cell in row)


def string_to_grid(s: str) -> Grid:
    """Convert string to grid."""
    if len(s) != 81:
        raise ValueError("String must be 81 characters")
    
    grid = []
    for i in range(9):
        row = [int(c) for c in s[i*9:(i+1)*9]]
        grid.append(row)
    return grid
```

---

## Testing & Validation

### Test Cases

```python
def test_terminal_generation():
    """Test Las Vegas terminal pattern creation."""
    for _ in range(10):
        terminal = create_terminal_pattern()
        
        # Should be complete
        assert count_givens(terminal) == 81
        
        # Should be valid
        assert is_valid_sudoku(terminal)
        
        print(f"✓ Generated valid terminal pattern")


def test_sequence_generation():
    """Test all sequence types."""
    sequences = {
        'LEFT_RIGHT_TOP_BOTTOM': sequence_left_right_top_bottom(),
        'S_PATTERN': sequence_s_pattern(),
        'JUMPING': sequence_jumping(),
        'RANDOM': sequence_random()
    }
    
    for name, seq in sequences.items():
        # Should contain all 81 cells
        assert len(seq) == 81
        assert len(set(seq)) == 81  # All unique
        
        # Should cover entire grid
        assert set(seq) == set((r, c) for r in range(9) for c in range(9))
        
        print(f"✓ {name} sequence valid")


def test_difficulty_generation():
    """Test puzzle generation for each difficulty."""
    for level in DifficultyLevel:
        print(f"\nTesting {level.name}...")
        
        for attempt in range(3):
            puzzle = generate_sudoku_puzzle(level, timeout=60.0)
            
            if puzzle is None:
                print(f"  ⚠ Attempt {attempt+1} timed out")
                continue
            
            # Verify properties
            givens = count_givens(puzzle)
            config = DIFFICULTY_CONFIGS[level]
            
            assert config.min_givens <= givens <= config.max_givens, \
                f"Givens {givens} not in range [{config.min_givens}, {config.max_givens}]"
            
            assert has_unique_solution(puzzle), "Puzzle has no unique solution"
            
            print(f"  ✓ Attempt {attempt+1}: {givens} givens, unique solution")


def test_evil_puzzle_quality():
    """Specific tests for evil puzzles."""
    print("Testing evil puzzle generation...")
    
    for attempt in range(5):
        puzzle = generate_evil_puzzle_optimized()
        
        if puzzle is None:
            print(f"  Attempt {attempt+1} failed")
            continue
        
        givens = count_givens(puzzle)
        searches = count_enumeration_searches(puzzle)
        
        # Check sparsity
        min_row = min(sum(1 for c in row if c != 0) for row in puzzle)
        min_col = min(sum(1 for row in puzzle if row[col] != 0) for col in range(9))
        
        print(f"  ✓ Attempt {attempt+1}:")
        print(f"    - Givens: {givens}")
        print(f"    - Searches: {searches:,}")
        print(f"    - Min row givens: {min_row}")
        print(f"    - Min col givens: {min_col}")
        
        assert 22 <= givens <= 27
        assert searches >= 100000
        assert min_row <= 2 or min_col <= 2


def is_valid_sudoku(grid: Grid) -> bool:
    """Check if completed grid is valid."""
    # Check all rows
    for row in grid:
        if sorted(row) != list(range(1, 10)):
            return False
    
    # Check all columns
    for col in range(9):
        column = [grid[row][col] for row in range(9)]
        if sorted(column) != list(range(1, 10)):
            return False
    
    # Check all blocks
    for block_row in range(3):
        for block_col in range(3):
            block = []
            for r in range(3):
                for c in range(3):
                    block.append(grid[block_row*3 + r][block_col*3 + c])
            if sorted(block) != list(range(1, 10)):
                return False
    
    return True
```

### Benchmark Tests

```python
def benchmark_generation_speed():
    """Benchmark generation time for each difficulty."""
    import time
    
    results = {}
    
    for level in DifficultyLevel:
        times = []
        successes = 0
        
        for _ in range(10):
            start = time.time()
            puzzle = generate_sudoku_puzzle(level, timeout=30.0)
            elapsed = time.time() - start
            
            if puzzle is not None:
                times.append(elapsed)
                successes += 1
        
        results[level] = {
            'avg_time': sum(times) / len(times) if times else None,
            'success_rate': successes / 10,
            'min_time': min(times) if times else None,
            'max_time': max(times) if times else None
        }
    
    # Print results
    print("\n" + "="*60)
    print("BENCHMARK RESULTS")
    print("="*60)
    
    for level, data in results.items():
        print(f"\n{level.name}:")
        print(f"  Success rate: {data['success_rate']*100:.0f}%")
        if data['avg_time']:
            print(f"  Average time: {data['avg_time']*1000:.0f} ms")
            print(f"  Range: {data['min_time']*1000:.0f} - {data['max_time']*1000:.0f} ms")
```

---

## Performance Requirements

### Expected Performance Targets

| Difficulty | Avg Generation Time | Success Rate | Givens Range |
|------------|-------------------|--------------|--------------|
| Extremely Easy | <100 ms | 100% | 50-81 |
| Easy | <200 ms | 100% | 36-49 |
| Medium | <500 ms | 98%+ | 32-35 |
| Difficult | <1500 ms | 95%+ | 28-31 |
| Evil | 1000-2000 ms | 90%+ | 22-27 |

### Memory Requirements
- Peak memory: ~10 MB
- Typical: <5 MB
- Grid storage: 81 integers = negligible

### Optimization Priorities

1. **Critical** - Pruning in dig-hole algorithm (50x speedup)
2. **Important** - Early termination in uniqueness check (stop at 2 solutions)
3. **Important** - Efficient DFS implementation
4. **Nice to have** - Caching valid placements
5. **Nice to have** - Parallel generation of multiple puzzles

---

## Complete Example Usage

```python
def main():
    """Example usage of the generator."""
    
    print("Sudoku Puzzle Generator")
    print("="*50)
    
    # Generate one puzzle of each difficulty
    for level in DifficultyLevel:
        print(f"\nGenerating {level.name} puzzle...")
        
        start_time = time.time()
        puzzle = generate_sudoku_puzzle(level, timeout=30.0)
        elapsed = time.time() - start_time
        
        if puzzle is None:
            print(f"  ✗ Failed to generate (timeout)")
            continue
        
        givens = count_givens(puzzle)
        print(f"  ✓ Generated in {elapsed*1000:.0f} ms")
        print(f"  ✓ {givens} givens")
        print(f"\n  Puzzle:")
        print_grid(puzzle)
        
        # Verify solution
        solution_count, solutions = solve_sudoku(puzzle.copy(), max_solutions=2)
        print(f"  ✓ Has unique solution: {solution_count == 1}")


def generate_puzzle_batch(difficulty: DifficultyLevel, count: int = 10):
    """Generate multiple puzzles of same difficulty."""
    puzzles = []
    
    print(f"Generating {count} {difficulty.name} puzzles...")
    
    for i in range(count):
        puzzle = generate_sudoku_puzzle(difficulty)
        if puzzle:
            puzzles.append(puzzle)
            print(f"  {i+1}/{count} completed")
        else:
            print(f"  {i+1}/{count} failed")
    
    return puzzles


def interactive_generator():
    """Interactive command-line interface."""
    print("\nSudoku Puzzle Generator")
    print("="*50)
    print("\nSelect difficulty:")
    print("1. Extremely Easy")
    print("2. Easy")
    print("3. Medium")
    print("4. Difficult")
    print("5. Evil")
    
    choice = input("\nEnter choice (1-5): ")
    
    level_map = {
        '1': DifficultyLevel.EXTREMELY_EASY,
        '2': DifficultyLevel.EASY,
        '3': DifficultyLevel.MEDIUM,
        '4': DifficultyLevel.DIFFICULT,
        '5': DifficultyLevel.EVIL
    }
    
    if choice not in level_map:
        print("Invalid choice!")
        return
    
    level = level_map[choice]
    print(f"\nGenerating {level.name} puzzle...")
    
    puzzle = generate_sudoku_puzzle(level)
    
    if puzzle is None:
        print("Failed to generate puzzle (timeout)")
        return
    
    print("\nYour puzzle:")
    print_grid(puzzle)
    
    print(f"\nGivens: {count_givens(puzzle)}")
    
    # Option to see solution
    if input("\nShow solution? (y/n): ").lower() == 'y':
        _, solutions = solve_sudoku(puzzle.copy(), max_solutions=1)
        if solutions:
            print("\nSolution:")
            print_grid(solutions[0])


if __name__ == "__main__":
    # Run tests
    print("Running tests...\n")
    test_terminal_generation()
    test_sequence_generation()
    test_difficulty_generation()
    test_evil_puzzle_quality()
    
    print("\n" + "="*50)
    print("All tests passed!")
    print("="*50)
    
    # Run benchmark
    benchmark_generation_speed()
    
    # Interactive mode
    interactive_generator()
```

---

## Additional Notes

### Known Limitations

1. **Evil Puzzle Minimum**: Algorithm achieves 22 givens minimum, not theoretical 17
2. **Generation Time Variance**: Evil puzzles can occasionally take 5-10 seconds
3. **Search Count**: Estimating exact search count for difficulty is approximate

### Future Enhancements

1. **Parallel Generation**: Generate multiple puzzles simultaneously
2. **Progressive Difficulty**: Allow fine-tuned difficulty between levels
3. **Pattern Templates**: Pre-defined aesthetic patterns for givens placement
4. **Solving Techniques Analysis**: Detect which human techniques are required
5. **Symmetry Constraints**: Generate puzzles with symmetric givens patterns

### Dependencies

```python
# requirements.txt
# No external dependencies required for core algorithm
# Optional for enhanced features:
# numpy>=1.20.0  # For faster array operations
# multiprocessing  # For parallel generation
```

### File Structure

```
sudoku_generator/
├── __init__.py
├── generator.py          # Main generation logic
├── solver.py             # DFS solver
├── difficulty.py         # Difficulty configs and scoring
├── sequences.py          # Digging sequence implementations
├── propagation.py        # Equivalent transformations
├── utils.py              # Helper functions
├── tests/
│   ├── test_generator.py
│   ├── test_solver.py
│   └── test_sequences.py
└── examples/
    ├── basic_usage.py
    └── batch_generation.py
```

---

## Implementation Checklist

- [ ] Implement basic grid structures and utilities
- [ ] Implement constraint checking functions
- [ ] Implement DFS solver with backtracking
- [ ] Implement Las Vegas terminal pattern generation
- [ ] Implement all four digging sequences
- [ ] Implement restriction checks
- [ ] Implement uniqueness verification
- [ ] Implement pruning optimization
- [ ] Implement PuzzleDigger class
- [ ] Implement equivalent propagation functions
- [ ] Implement main generation function
- [ ] Implement evil puzzle optimizations
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Run benchmarks
- [ ] Verify all difficulty levels generate correctly
- [ ] Optimize performance bottlenecks
- [ ] Add documentation and examples

---

**End of Specification**

This document contains all necessary data, algorithms, and implementation details to create a complete Sudoku puzzle generator that can produce puzzles from Extremely Easy to Evil difficulty, with special optimizations for generating the hardest puzzles.
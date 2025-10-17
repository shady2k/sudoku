# Educational Content Template for Sudoku Techniques

**Purpose**: Defines required structure and quality standards for technique educational content (validates FR-006, SC-006)

**Version**: 1.0.0
**Created**: 2025-10-18
**Validates**: spec.md FR-006, SC-006
**Referenced by**: tasks.md T090 (formerly T086)

---

## Overview

Every technique implementation MUST include educational content to help users learn and apply the technique. This template ensures consistency, completeness, and quality across all 47 techniques.

---

## Required Fields

### 1. `id` (string)

**Format**: kebab-case identifier matching filename
**Pattern**: `^[a-z0-9]+(-[a-z0-9]+)*$`
**Length**: 3-40 characters

**Examples**:
- `hidden-singles`
- `x-wing`
- `unique-rectangles-type-1`
- `unique-rectangles-type-2-plus`

**Validation**: Must match technique class filename (e.g., `HiddenSingles.ts` → `id: "hidden-singles"`)

---

### 2. `name` (string)

**Format**: Title Case display name
**Length**: 2-40 characters
**Rules**: Use proper capitalization, hyphens for compound terms

**Examples**:
- ✅ "Hidden Singles"
- ✅ "X-Wing"
- ✅ "3D Medusa"
- ✅ "Unique Rectangles Type 2+"
- ❌ "hidden singles" (not title case)
- ❌ "XWing" (missing hyphen)

---

### 3. `difficulty` (enum)

**Type**: `"Beginner" | "Intermediate" | "Advanced" | "Expert"`
**Mapping**: Must align with your research difficulty categories

**Distribution**:
- **Beginner** (1-9): Hidden Singles, Naked Pairs, Naked Triples, Hidden Pairs, Hidden Triples, Naked Quads, Hidden Quads, Pointing Pairs, Box/Line Reduction
- **Intermediate** (10-18): BUG, X-Wing, Unique Rectangles Type 1, Chute Remote Pairs, Simple Colouring, Y-Wing, Empty Rectangles, Swordfish, XYZ Wing
- **Advanced** (19-28): X-Cycles, XY-Chain, 3D Medusa, Jellyfish, Unique Rectangles Type 2+, Various Static Patterns, Extended Unique Rectangles, Hidden Unique Rectangles, WXYZ Wing, Aligned Pair Exclusion
- **Expert** (29-45): Exocet, Grouped X-Cycles, Finned X-Wing, Finned Swordfish, Alternative Inference Chains, Sue-de-Coq, Digit Forcing Chains, Nishio Forcing Chains, Cell Forcing Chains, Unit Forcing Chains, Almost Locked Sets, Death Blossom, Pattern Overlay Method, Quad Forcing Chains, Fireworks, SK Loops, Bowman's Bingo

---

### 4. `patternType` (enum)

**Type**: `"elimination" | "subset" | "fish" | "wing" | "chain" | "coloring" | "uniqueness" | "intersection" | "forcing"`

**Definitions**:

- **elimination**: Techniques that remove candidates by constraint propagation (e.g., Hidden Singles)
- **subset**: Techniques based on locked candidate sets (e.g., Naked Pairs, Hidden Triples)
- **fish**: Techniques using row/column candidate patterns (e.g., X-Wing, Swordfish, Jellyfish)
- **wing**: Techniques using pivot cells and pincers (e.g., XY-Wing, XYZ-Wing, WXYZ-Wing)
- **chain**: Techniques using alternating inference chains (e.g., XY-Chain, Alternative Inference Chains)
- **coloring**: Techniques using conjugate pair coloring (e.g., Simple Colouring, 3D Medusa)
- **uniqueness**: Techniques exploiting unique solution requirement (e.g., Unique Rectangles, BUG)
- **intersection**: Techniques using box/line interactions (e.g., Pointing Pairs, Box/Line Reduction)
- **forcing**: Trial-and-error techniques (e.g., Nishio Forcing Chains, Bowman's Bingo)

**Example Mapping**:
```typescript
{
  id: "x-wing",
  patternType: "fish"  // Uses row/column patterns
}
```

---

### 5. `description` (string)

**Purpose**: Brief 1-2 sentence overview of what the technique does
**Length**: 20-150 words
**Tone**: Clear, instructional, accessible to intermediate learners
**Structure**: [What it is] + [What it accomplishes]

**Template**:
```
[Technique name] is a [pattern-type] technique that [action/mechanism].
It allows you to [outcome/benefit].
```

**Examples**:

✅ **Good**:
```
Hidden Singles is an elimination technique that identifies cells where only one
candidate is possible based on row, column, and box constraints. It allows you to
place numbers with certainty when all other candidates have been eliminated.
```

✅ **Good**:
```
X-Wing is a fish pattern technique that uses two rows (or columns) containing the
same candidate in exactly two columns (or rows). It allows you to eliminate that
candidate from other cells in those columns (or rows).
```

❌ **Bad** (too brief):
```
X-Wing finds patterns in rows and columns.
```

❌ **Bad** (too technical, no outcome):
```
X-Wing exploits bivalue conjugate pairs in orthogonal dimensions to propagate
constraints via strong inference links.
```

---

### 6. `whenToUse` (string)

**Purpose**: Guidance on when this technique applies
**Length**: 30-100 words
**Structure**: Conditional statements using "when", "after", "look for"
**Focus**: Puzzle state conditions, not detailed mechanics

**Template**:
```
Use [technique] when [puzzle state condition]. Look for [high-level pattern].
This technique is most effective [context/difficulty scenario].
```

**Examples**:

✅ **Good**:
```
Use Hidden Singles after placing initial clues or after any number placement.
Look for empty cells where considering row, column, and box constraints together
leaves only one possible candidate. This is the most fundamental technique and
should be checked repeatedly throughout solving.
```

✅ **Good**:
```
Use X-Wing when you've exhausted simpler techniques like Naked Pairs and Pointing
Pairs. Look for situations where a candidate appears in exactly two positions in
two different rows (or columns). This technique is most effective in intermediate
to advanced puzzles.
```

❌ **Bad** (no conditions):
```
Use this technique to solve puzzles.
```

❌ **Bad** (too vague):
```
Apply when you're stuck.
```

---

### 7. `howToSpot` (string)

**Purpose**: Step-by-step visual recognition guide
**Length**: 50-200 words
**Structure**: **MUST** use numbered steps or bullet points
**Focus**: Actionable visual scanning pattern

**Template**:
```
1. [First scanning action]
2. [Pattern recognition step]
3. [Validation/verification step]
4. [Application/elimination step]
```

**Examples**:

✅ **Good**:
```
1. Select an empty cell to analyze
2. List all possible candidates (1-9) not already present in the same row
3. Eliminate candidates that appear in the same column
4. Eliminate candidates that appear in the same 3×3 box
5. If only one candidate remains, you've found a Hidden Single - place it immediately
6. Repeat for all empty cells
```

✅ **Good**:
```
1. Choose a candidate number (e.g., 5) to analyze across the entire grid
2. Look for two rows where this candidate appears in exactly two columns
3. Verify these two columns are the same for both rows (forming a rectangle)
4. Check if this creates an X-Wing pattern (candidate in 4 corners only)
5. Eliminate this candidate from all other cells in those two columns
```

❌ **Bad** (no structure):
```
Look at the grid and find cells where the technique applies. Then eliminate candidates.
```

❌ **Bad** (too abstract):
```
Analyze constraint propagation vectors and identify conjugate pair intersections.
```

---

### 8. `examples` (array of objects)

**Count**: Minimum 2, maximum 5
**Quality**: Progress from simple to complex
**Structure**: Each example MUST include all fields below

#### Example Object Structure:

```typescript
interface TechniqueExample {
  puzzleState: string;        // 81-character string (. for empty)
  targetCells: {row: number, col: number}[];  // 0-indexed
  explanation: string;        // 30-80 words
  result: string;            // What happens after applying technique
}
```

#### Example Template:

```json
{
  "puzzleState": "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
  "targetCells": [
    {"row": 0, "col": 2},
    {"row": 0, "col": 3}
  ],
  "explanation": "In row 1, columns 3 and 4 are empty. Analyzing column 3: candidates 1,2,4 are already present in the column, leaving only 5 and 9. Analyzing column 4: similar elimination leaves only 5 and 9. Checking the box constraint: 5 appears in row 2 of this box, so row 1 col 3 cannot be 5. Therefore, it must be 9.",
  "result": "Place 9 in row 1, column 3 (0-indexed: row 0, col 2). This eliminates 9 from column 4, revealing a Hidden Single (5) in row 1, column 4."
}
```

#### Validation Rules:

- `puzzleState` MUST be exactly 81 characters (0-9 or `.`)
- `targetCells` MUST reference valid cells (row/col 0-8)
- `explanation` MUST be 30-80 words
- `result` MUST describe concrete outcome (placements or eliminations)

---

### 9. `commonMistakes` (string, optional but recommended)

**Purpose**: Warn learners about frequent errors
**Length**: 20-80 words
**Tone**: Helpful, not condescending
**Structure**: [Common error] + [Why it's wrong] + [Correct approach]

**Template**:
```
Don't [common mistake]. This fails because [reason]. Instead, [correct approach].
```

**Examples**:

✅ **Good**:
```
Don't confuse Hidden Singles with Naked Singles. A Naked Single has only one
candidate visible in the cell, while a Hidden Single may appear to have multiple
candidates until you check row, column, AND box constraints simultaneously.
Always verify all three constraints.
```

✅ **Good**:
```
Don't apply X-Wing when candidates appear more than twice in a row. X-Wing
requires EXACTLY two occurrences in each of the two rows. If a candidate appears
three times, you need a different technique like Swordfish.
```

❌ **Bad** (vague):
```
Be careful when applying this technique.
```

---

### 10. `relatedTechniques` (array of strings, optional)

**Purpose**: Link to prerequisite or advanced variations
**Format**: Array of technique IDs (kebab-case)
**Types**: Prerequisites (learn first), alternatives (similar difficulty), extensions (advanced versions)

**Example**:
```json
{
  "id": "x-wing",
  "relatedTechniques": [
    "swordfish",           // Extension: 3-row fish
    "finned-x-wing",       // Extension: with extra candidates
    "jellyfish"            // Extension: 4-row fish
  ]
}
```

**Example 2**:
```json
{
  "id": "swordfish",
  "relatedTechniques": [
    "x-wing",              // Prerequisite: 2-row fish
    "jellyfish",           // Extension: 4-row fish
    "finned-swordfish"     // Extension: with extra candidates
  ]
}
```

---

## Validation Checklist (for T043 validation task)

### Completeness Check:
- [ ] All 47 techniques have `id`, `name`, `difficulty`, `patternType`, `description`, `whenToUse`, `howToSpot`
- [ ] All techniques have ≥2 example objects in `examples` array
- [ ] All beginner/intermediate techniques have `commonMistakes` field populated

### Quality Check:
- [ ] All `description` fields are 20-150 words
- [ ] All `whenToUse` fields are 30-100 words
- [ ] All `howToSpot` fields use numbered steps or bullet points
- [ ] All `example.explanation` fields are 30-80 words
- [ ] All `puzzleState` strings are exactly 81 characters

### Content Check:
- [ ] Tone is consistent across all techniques (instructional, accessible)
- [ ] No jargon without explanation
- [ ] No placeholder text ("TODO", "Coming soon", "TBD")
- [ ] No spelling/grammar errors (run spell checker)
- [ ] Cross-references use valid technique IDs from the 47-technique list

### Technical Check:
- [ ] `id` matches filename convention (`XWing.ts` → `"x-wing"`)
- [ ] `difficulty` matches your research categorization
- [ ] `patternType` is one of the 9 valid enum values
- [ ] `targetCells` coordinates are valid (0-8 range)
- [ ] `puzzleState` contains only valid characters (0-9 or `.`)

---

## Minimum Quality Standards

### ❌ REJECT content if:
- Description is ≤10 words (too brief)
- `howToSpot` has no structured steps (just prose paragraphs)
- `examples` array is empty
- Contains placeholder text ("TODO", "Coming soon", "lorem ipsum")
- `puzzleState` is not exactly 81 characters
- Uses technical jargon without definitions (e.g., "conjugate pairs", "strong inference links") in beginner/intermediate techniques

### ⚠️ FLAG for improvement if:
- Description is >150 words (too verbose)
- `examples` has only 1 example (minimum is 2)
- `commonMistakes` field is empty for beginner/intermediate techniques
- `explanation` in examples is <20 words (too brief) or >100 words (too verbose)
- No `relatedTechniques` for techniques that have clear prerequisites or extensions
- Tone is inconsistent (overly casual or overly academic)

---

## Implementation Notes

### Storage Format:

Educational content can be stored as:

**Option A**: Embedded in technique classes
```typescript
export class HiddenSingles extends BaseTechnique {
  readonly educationalContent = {
    id: "hidden-singles",
    name: "Hidden Singles",
    // ... rest of content
  };
}
```

**Option B**: Separate JSON file
```json
// src/data/technique-content.json
{
  "hidden-singles": {
    "id": "hidden-singles",
    "name": "Hidden Singles",
    // ... rest of content
  }
}
```

**Recommendation**: Use Option B (separate JSON) for easier content updates without recompilation.

### Example Full Entry:

```json
{
  "id": "hidden-singles",
  "name": "Hidden Singles",
  "difficulty": "Beginner",
  "patternType": "elimination",
  "description": "Hidden Singles is an elimination technique that identifies cells where only one candidate is possible based on row, column, and box constraints. It allows you to place numbers with certainty when all other candidates have been eliminated from a cell.",
  "whenToUse": "Use Hidden Singles after placing initial clues or after any number placement. Look for empty cells where considering row, column, and box constraints together leaves only one possible candidate. This is the most fundamental technique and should be checked repeatedly throughout solving.",
  "howToSpot": "1. Select an empty cell to analyze\n2. List all possible candidates (1-9) not already present in the same row\n3. Eliminate candidates that appear in the same column\n4. Eliminate candidates that appear in the same 3×3 box\n5. If only one candidate remains, you've found a Hidden Single\n6. Place the number immediately and repeat for all empty cells",
  "examples": [
    {
      "puzzleState": "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
      "targetCells": [{"row": 0, "col": 2}],
      "explanation": "In row 1, column 3 (0-indexed: row 0, col 2), analyzing candidates: 1 appears in row, 2 appears in box, 4 appears in column, 6 appears in row, 8 appears in column. Only candidate 9 remains after eliminating all constraints.",
      "result": "Place 9 in row 1, column 3. This is a Hidden Single because it was the only remaining candidate after elimination."
    },
    {
      "puzzleState": "..3.2.6..9..3.5..1..18.64....81.29..7.......8..67.82....26.95..8..2.3..9..5.1.3..",
      "targetCells": [{"row": 4, "col": 4}],
      "explanation": "Center cell (row 5, column 5 in 1-indexed, or row 4, col 4 in 0-indexed) in the middle box. Checking all constraints, candidates 1,2,3,6,7,9 are eliminated by row/column/box. Only 4 and 5 remain, but 4 appears elsewhere in the box, leaving only 5.",
      "result": "Place 5 in row 5, column 5 (center cell). This demonstrates a Hidden Single in a more complex scenario."
    }
  ],
  "commonMistakes": "Don't confuse Hidden Singles with Naked Singles. A Naked Single has only one candidate visible in the cell's pencil marks, while a Hidden Single may appear to have multiple candidates until you check row, column, AND box constraints simultaneously. Always verify all three constraints together, not separately.",
  "relatedTechniques": ["naked-pairs", "pointing-pairs", "box-line-reduction"]
}
```

---

## Version History

- **1.0.0** (2025-10-18): Initial template created for 47-technique specification

---

**Next Step**: Use this template as reference when implementing T090 (educational content addition)

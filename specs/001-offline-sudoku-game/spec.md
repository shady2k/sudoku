# Feature Specification: Offline Sudoku Game

**Feature Branch**: `001-offline-sudoku-game`
**Created**: 2025-10-16
**Status**: Draft
**Input**: User description: "User can play without internet. Only local storage, no server. Modern design. User can press button to fill candidates numbers. Game need to indicate that mistakes made immediately. We should have flexible hardness levels, not just easy, hard, expert. We need support play only from keyboard or using both with mouse. We should store previous game results to compare your results. We should measure time and errors rate. If user idle for a long time we should auto-pase timer and auto continue. Then we click or select cell we should highlight rows, columns, sqaures. Then click on number, we should highlight numbers in game. User can interrupt game in any moment, close browser, and after open we should resume last game."

## Clarifications

### Session 2025-10-16

- Q: What constitutes an "error" for the error count metric? → A: Only entries that remain invalid when player moves to another cell count as errors
- Q: How many undo steps should the game preserve? → A: 50 steps (sufficient for most games)
- Q: What aspect of puzzle difficulty should the adjustable difficulty scale control? → A: Number of pre-filled clues, with every puzzle guaranteed solvable without guessing
- Q: Should the timer automatically resume when the page regains focus after being unfocused? → A: No, keep paused until user interacts
- Q: Should players be able to manually add/edit their own notes or pencil marks in cells? → A: Yes, manual notes/candidates supported alongside auto-fill candidates feature
- Q: How should auto-pause idle timeout work? → A: Track timestamp of last user interaction; if no interaction for 3 minutes, pause timer at the last interaction timestamp
- Q: How should players enter "note/candidate mode" to add pencil marks versus entering a final number in a cell? → A: Toggle mode via dedicated button (click "Notes Mode" button, then all number entries are notes until toggled off) with keyboard hotkey support
- Q: What specific keyboard hotkey should toggle Notes Mode? → A: 'N' key
- Q: What should happen if puzzle generation fails (e.g., algorithm timeout or unable to create valid puzzle)? → A: Display error message asking user to try again manually
- Q: Should the game provide an undo function that also reverses candidate/note changes, or only final number entries? → A: Undo reverses both final number entries AND manual candidate/note changes
- Q: How should the difficulty scale be presented to users (what range/units)? → A: Percentage scale 0-100% (0% = hardest, 100% = easiest)
- Q: What keyboard hotkeys should be assigned to the main game control buttons (Show/Hide Candidates, Undo, New Game, Pause/Resume)? → A: C (Candidates toggle), Z/Ctrl+Z (Undo), Space (Pause/Resume), Ctrl+N (New Game)
- Q: Where exactly should the pause indicator icon be positioned relative to the timer display? → A: Icon immediately to the left of timer text (e.g., "⏸ 05:23")
- Q: What specific UI layout constraint is meant by "static layout - we don't move elements"? → A: UI elements maintain fixed positions and sizes regardless of state changes (e.g., buttons don't shift when text changes, timer doesn't resize container)
- Q: Should all button labels display their keyboard shortcut hints in the UI (e.g., "Notes (N)", "Undo (Z)")? → A: Yes, all buttons show their hotkey in the label or tooltip (e.g., "Notes (N)")
- Q: Should the number pad interface (for mouse input) also display keyboard hints for numbers 1-9? → A: No, number pad is for mouse/touch only; keyboard users type 1-9 directly without needing the visual pad
- Q: When a player has an active game and presses Ctrl+N (or New Game button), what options should appear in the modal dialog? → A: Difficulty slider + "Start New Game" button + "Cancel" button (with warning that current game will be lost)
- Q: Should the app show a modal when loading with a saved game, or automatically resume the saved game? → A: Automatically resume the saved game immediately; modal only appears when no saved game exists or when player explicitly requests new game via Ctrl+N
- Q: When the modal appears (no saved game or after completing a game), should it have a "Cancel" button, or must the player start a new game? → A: No "Cancel" button when no saved game exists - player must create a new game to use the app
- Q: When a player completes a game, what happens immediately after the completion message is shown? → A: Automatically show New Game modal (no Cancel button) after dismissing completion message
- Q: Should the Escape key close the New Game modal (when "Cancel" button is shown for active games)? → A: Yes, Escape key closes modal (same as clicking "Cancel" when available)
- Q: Where should the number pad be positioned and on which devices should it appear? → A: Number pad positioned to the right of grid on desktop; no number pad on mobile (users interact directly via touch)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a New Game with Immediate Feedback (Priority: P1)

A player opens the game, selects a difficulty level, and starts playing. As they fill in numbers, the game immediately shows when they make a mistake. The timer tracks their progress, and they can see which cells, rows, columns, and squares are related to their current selection.

**Why this priority**: This is the core game experience. Without the ability to play a game with real-time feedback, there is no product. This story delivers immediate value and is the foundation for all other features.

**Independent Test**: Can be fully tested by starting a new game, filling in both correct and incorrect numbers, and verifying that mistakes are highlighted immediately. Delivers a complete, playable game experience.

**Acceptance Scenarios**:

1. **Given** the player opens the game for the first time (or after completing a game), **When** the application loads, **Then** a modal dialog appears with a difficulty slider (0-100%) and "Start New Game" button (no "Cancel" button since no game exists to return to)
2. **Given** the player adjusts the difficulty slider in the modal, **When** they click "Start New Game", **Then** a new Sudoku puzzle is generated and displayed with the timer starting at 00:00 and the modal closes
3. **Given** the player is viewing the puzzle, **When** they click or navigate to a cell, **Then** that cell is highlighted along with all cells in the same row, column, and 3x3 square
4. **Given** the player has selected a cell, **When** they enter a number that violates Sudoku rules, **Then** the incorrect cell is immediately marked with a visual indicator (e.g., red highlight or icon)
5. **Given** the player has selected a cell, **When** they enter a correct number, **Then** the number is placed in the cell with no error indication
6. **Given** the player completes the puzzle correctly, **When** the last cell is filled, **Then** the game displays a completion message with final time and error count
7. **Given** the player sees the completion message, **When** they dismiss it, **Then** the New Game modal automatically appears with difficulty slider and "Start New Game" button (no "Cancel" button)

---

### User Story 2 - Game State Persistence and Auto-Resume (Priority: P1)

A player can interrupt their game at any moment by closing the browser tab or window. When they reopen the game, they are automatically returned to exactly where they left off, with the puzzle state, timer, and all progress preserved.

**Why this priority**: This is essential for offline play and user retention. Players expect to be able to close and resume games without losing progress. This is fundamental to the user experience and must be in the MVP.

**Independent Test**: Can be fully tested by starting a game, making several moves, closing the browser completely, reopening it, and verifying all game state (puzzle, timer, errors) is restored exactly as it was.

**Acceptance Scenarios**:

1. **Given** the player is in the middle of a game, **When** they close the browser tab or window, **Then** the current game state (puzzle, progress, timer value, error count) is automatically saved to local storage
2. **Given** the player has a saved game in progress, **When** they open the game in the browser, **Then** the saved game is automatically loaded and displayed with all progress restored (puzzle, entered numbers, timer value, error count)
3. **Given** the player was idle when they closed the browser, **When** the saved game auto-loads, **Then** the timer remains paused until they interact with the game
4. **Given** the player has an active game, **When** they press Ctrl+N or click "New Game" button, **Then** a modal appears with difficulty slider, "Start New Game" button, "Cancel" button, and warning that current game will be lost
5. **Given** the new game modal is open with active game, **When** they click "Cancel" or press Escape key, **Then** the modal closes and they return to their current game
6. **Given** the new game modal is open with no active game (first load or after completion), **When** they press Escape key, **Then** the modal closes and they return to their current game (Escape acts as Cancel even when Cancel button not shown)

---

### User Story 3 - Keyboard and Mouse Navigation (Priority: P1)

A player can choose to play using only the keyboard, only the mouse, or a combination of both. Keyboard shortcuts allow efficient navigation between cells and number entry, making the game accessible to different play styles.

**Why this priority**: Input flexibility is essential for user accessibility and preference. Some players prefer keyboard-only for speed, while others prefer mouse. This must be included in the MVP for a quality user experience.

**Independent Test**: Can be fully tested by completing an entire game using only keyboard controls, then completing another game using only mouse controls, and verifying all actions are possible with each method.

**Acceptance Scenarios**:

1. **Given** the player is viewing the puzzle, **When** they use arrow keys (↑ ↓ ← →), **Then** the cell selection moves in the corresponding direction
2. **Given** the player has selected a cell with keyboard navigation, **When** they press a number key (1-9), **Then** that number is entered into the cell
3. **Given** the player has selected a cell, **When** they press the Delete or Backspace key, **Then** the cell is cleared
4. **Given** the player is playing the game, **When** they press 'N' key, **Then** Notes Mode is toggled on/off
5. **Given** the player is playing the game, **When** they press 'C' key, **Then** the Show/Hide Candidates feature is toggled
6. **Given** the player is playing the game, **When** they press 'Z' or 'Ctrl+Z' key, **Then** the last action is undone
7. **Given** the player is playing the game, **When** they press 'Space' key, **Then** the timer is paused/resumed
8. **Given** the player is on any screen, **When** they press 'Ctrl+N' key, **Then** the New Game modal dialog is opened with difficulty slider, "Start New Game" button, and "Cancel" button (with warning if active game exists)
9. **Given** the player is viewing the puzzle, **When** they click on any cell with the mouse, **Then** that cell becomes selected
10. **Given** the player is on desktop with a selected cell, **When** they click on a number in the number pad (positioned to the right of the grid), **Then** that number is entered into the cell
11. **Given** the player is using mixed input, **When** they switch between keyboard and mouse at any time, **Then** the game responds correctly to both input methods without conflict

---

### User Story 4 - Manual and Auto Candidate Numbers (Priority: P2)

A player can manually enter candidate numbers (pencil marks/notes) in empty cells to track their solving strategy. Additionally, players who need assistance can press a button to automatically fill all empty cells with small candidate numbers showing all possible values that don't violate Sudoku rules. This supports both manual solving techniques and computational assistance.

**Why this priority**: This is a valuable assistance feature that enhances the learning experience and helps prevent frustration. However, the core game is playable without it, making it a P2 feature.

**Independent Test**: Can be fully tested by manually entering candidate numbers in cells, verifying they persist, then clicking the "Show Candidates" button and verifying that all empty cells show the correct auto-generated possible numbers based on current board state.

**Acceptance Scenarios**:

1. **Given** the player is viewing the game, **When** they click the "Notes Mode" button or press the 'N' key, **Then** the game enters note/candidate mode and the button shows an active state
2. **Given** the player is in note/candidate mode with an empty cell selected, **When** they type numbers 1-9 (keyboard) or click numbers on the number pad (mouse), **Then** those numbers appear as small candidate marks in the cell
3. **Given** the player is in note/candidate mode, **When** they click the "Notes Mode" button again or press the hotkey, **Then** the mode is toggled off and subsequent number entries are treated as final numbers
4. **Given** the player has manually entered candidate numbers in a cell, **When** they enter note mode and type the same numbers again (or click them), **Then** those candidates are removed (toggle behavior)
5. **Given** the player is in the middle of a game with some cells filled, **When** they click the "Show Candidates" button or press 'C' key, **Then** all empty cells display small auto-generated numbers (1-9) representing valid possibilities based on Sudoku rules
6. **Given** auto-generated candidates are showing, **When** the player enters a number in a cell, **Then** the auto-generated candidates in related cells (same row, column, and square) are automatically updated to remove that number, but manual candidates remain unchanged
7. **Given** auto-generated candidates are showing, **When** they click the "Hide Candidates" button or press 'C' key again, **Then** all auto-generated candidates are removed from the display but manual candidates remain visible
8. **Given** a cell has candidate numbers (manual or auto), **When** the player (not in note mode) enters a final number in that cell, **Then** the candidate numbers are replaced by the entered number

---

### User Story 5 - Flexible Difficulty Selection (Priority: P2)

Instead of fixed difficulty presets, players can customize their game difficulty using adjustable parameters such as the number of pre-filled cells or puzzle complexity ratings. This allows players to find their perfect challenge level.

**Why this priority**: While difficulty selection is important, a basic single-level game is still valuable. The flexibility adds significant value but isn't essential for initial launch. Players can still enjoy the game with a single difficulty level.

**Independent Test**: Can be fully tested by adjusting difficulty parameters, generating multiple puzzles at different settings, and verifying that the puzzles have the expected number of clues and solving complexity.

**Acceptance Scenarios**:

1. **Given** the player is on the new game screen, **When** they view difficulty options, **Then** they see a slider for adjusting difficulty level with a percentage scale from 0% (hardest) to 100% (easiest)
2. **Given** the player adjusts the difficulty slider, **When** they start a new game, **Then** the puzzle generated has a number of pre-filled clues corresponding to the selected percentage (higher percentage = more clues = easier)
3. **Given** the player has played games at different difficulties, **When** they view their game history, **Then** each game shows the difficulty percentage it was played at for accurate comparison

---

### User Story 6 - Number Highlighting for Pattern Recognition (Priority: P2)

When a player clicks on a number (either in the grid or on a number pad), all instances of that number throughout the puzzle are highlighted. This helps players see patterns and identify where numbers are already placed.

**Why this priority**: This is a quality-of-life feature that improves gameplay experience but isn't essential for basic functionality. Players can manually scan for numbers, making this an enhancement rather than a requirement.

**Independent Test**: Can be fully tested by clicking on various numbers in the grid and verifying that all matching numbers are highlighted, then clicking elsewhere to verify the highlighting is removed.

**Acceptance Scenarios**:

1. **Given** the player is viewing the puzzle, **When** they click on a cell containing a number, **Then** all other cells containing the same number are highlighted with a distinct visual style
2. **Given** the player is viewing the puzzle with a number pad interface, **When** they click on a number in the number pad, **Then** all cells in the grid containing that number are highlighted
3. **Given** numbers are highlighted, **When** the player clicks on a different number or empty cell, **Then** the previous highlights are removed and new highlights are applied based on the new selection
4. **Given** numbers are highlighted, **When** the player clicks on an empty area, **Then** all number highlights are removed

---

### User Story 7 - Auto-Pause on Idle (Priority: P3)

When a player stops interacting with the game for an extended period, the timer automatically pauses to avoid inflating their completion time. When they return and interact with the game, the timer automatically resumes.

**Why this priority**: While this improves time tracking accuracy, it's not critical for initial release. Players can manually pause if needed, and time tracking is still functional without auto-pause. This is a polish feature.

**Independent Test**: Can be fully tested by starting a game, waiting for the idle timeout period without interaction, verifying the timer pauses, then interacting with the game and verifying the timer resumes.

**Acceptance Scenarios**:

1. **Given** the player is in an active game, **When** they have not clicked, typed, or moved the mouse for 3 minutes, **Then** the timer pauses at the timestamp of the last user interaction and a pause icon appears to the left of the timer (e.g., "⏸ 05:23")
2. **Given** the game is auto-paused due to idle, **When** the player clicks anywhere, presses any key, or moves the mouse over the game area, **Then** the timer automatically resumes and the pause icon disappears
3. **Given** the game is auto-paused, **When** the player closes the browser tab or window, **Then** the game state is saved with the paused time

---

### User Story 8 - Game History and Performance Comparison (Priority: P3)

Players can view a history of their completed games, including completion time, error count, and difficulty level. This allows them to track their improvement over time and compare performances.

**Why this priority**: While valuable for long-term engagement, the core game experience doesn't require history tracking. Players can enjoy individual games without comparison data. This is an engagement feature rather than a core requirement.

**Independent Test**: Can be fully tested by completing multiple games at various difficulty levels, accessing the history screen, and verifying all game records are displayed with correct statistics.

**Acceptance Scenarios**:

1. **Given** the player has completed multiple games, **When** they navigate to the history screen, **Then** they see a list of past games sorted by date (most recent first)
2. **Given** the player is viewing their game history, **When** they look at a history entry, **Then** each entry shows the date, difficulty level, completion time, and error count
3. **Given** the player is viewing their game history, **When** they filter or sort by difficulty level, **Then** they can compare their performance at similar difficulty levels
4. **Given** the player has history data, **When** they view summary statistics, **Then** they see aggregate metrics such as average completion time, best time, average errors, and total games played
5. **Given** the player completes a new personal best, **When** the game ends, **Then** a "New Record!" message is displayed highlighting which metric improved

---

### Edge Cases

- What happens when the player closes the browser in the middle of a game? (The game state is automatically saved to local storage and restored when they return, with the timer paused at the saved value)
- What happens when the player manually edits local storage data or clears browser data? (The game gracefully handles missing or corrupted data by starting fresh without crashing, showing a "no saved game" state)
- What happens when the player completes a puzzle but the solution contains errors due to forcing invalid entries? (The game prevents completion and highlights remaining errors)
- What happens when the player's browser doesn't support required local storage features? (The game displays a friendly error message explaining the browser requirements)
- What happens when multiple tabs of the game are open simultaneously? (The most recent game state from any tab is saved and loaded, ensuring consistency)
- What happens when the device runs out of local storage space? (The game handles the storage quota error gracefully, informing the user and potentially archiving older game history)
- What happens when the player navigates away from the game page without closing the tab? (The game state is saved, and the timer is paused when the page loses focus and remains paused until explicit user interaction)
- What happens when the player has been away for days or weeks and returns to a saved game? (The game loads normally with the timer still paused at the saved value, ready to resume)
- What happens when puzzle generation fails due to algorithm timeout or inability to create a valid puzzle? (The system displays a clear error message explaining the failure and provides a "Try Again" button for the user to manually retry puzzle generation)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate valid Sudoku puzzles with configurable difficulty levels based on user selection, where difficulty is controlled by the number of pre-filled clues (more clues = easier), and every puzzle MUST be solvable using logic without guessing; if generation fails, system MUST display an error message with a "Try Again" button for manual retry
- **FR-002**: System MUST store all game state (current puzzle, progress, timer, errors) in browser local storage after every user action
- **FR-003**: System MUST automatically load and display the most recent saved game immediately when the application loads (if saved game exists)
- **FR-004**: System MUST display a New Game modal dialog ONLY when: (a) no saved game exists on initial load, OR (b) player explicitly triggers new game via Ctrl+N or New Game button; modal contains difficulty slider and "Start New Game" button; "Cancel" button is included ONLY when an active game exists (to prevent accidental loss), not shown when no game to return to; Escape key closes modal (same behavior as "Cancel" button when present)
- **FR-005**: System MUST validate each number entry in real-time and immediately indicate when a number violates Sudoku rules
- **FR-006**: System MUST provide visual highlighting of the selected cell's row, column, and 3x3 square
- **FR-007**: System MUST support keyboard-only operation with hotkeys for all controls: arrow keys (cell navigation), 1-9 (number entry), Delete/Backspace (clear cell), N (toggle Notes Mode), C (toggle Show/Hide Candidates), Z/Ctrl+Z (Undo), Space (Pause/Resume timer), Ctrl+N (open New Game modal with difficulty slider and warning if active game exists)
- **FR-008**: System MUST support mouse/touch input for all game interactions including cell selection; on desktop, system MUST display an on-screen number pad positioned to the right of the grid for mouse-based number entry (number pad buttons do not display keyboard hints as they are for mouse users only); on mobile devices, number pad MUST NOT be displayed as users interact directly with cells via touch
- **FR-009**: System MUST track and display elapsed game time in MM:SS or HH:MM:SS format with pause indicator icon positioned immediately to the left of the timer text when paused (e.g., "⏸ 05:23")
- **FR-010**: System MUST track and display the count of errors made during the game (an error is counted only when an invalid entry remains in a cell when the player moves selection to another cell)
- **FR-011**: System MUST provide a toggleable "Notes Mode" (via button and 'N' key) that switches between entering final numbers and entering candidate numbers (notes/pencil marks) in empty cells; when active, number entries add/remove candidates instead of final values
- **FR-011a**: System MUST provide a "Show Candidates" feature (via button and 'C' key) that automatically fills empty cells with all possible valid numbers
- **FR-012**: System MUST automatically update auto-generated candidate numbers when the player enters values that eliminate possibilities (manual notes are not auto-updated)
- **FR-013**: System MUST highlight all instances of a selected number throughout the puzzle grid
- **FR-014**: System MUST detect puzzle completion, display a summary screen with final time and error count, and automatically show the New Game modal (without "Cancel" button) after the completion message is dismissed
- **FR-015**: System MUST save completed game records to local storage including date, time, errors, and difficulty
- **FR-016**: System MUST provide a history view showing all previously completed games with sorting and filtering options
- **FR-017**: System MUST track the timestamp of the last user interaction and auto-pause the timer at that timestamp after 3 minutes of inactivity
- **FR-018**: System MUST auto-resume the timer when the user interacts with the game after an idle pause
- **FR-019**: System MUST persist game state when the browser is closed and restore it when reopened
- **FR-020**: System MUST provide a modern, responsive user interface that works on desktop and mobile devices with static layout where UI elements maintain fixed positions and sizes regardless of state changes (no layout shifts when content updates); on desktop, the layout MUST position the Sudoku grid on the left with the number pad to its right; on mobile, the number pad is omitted; all interactive buttons MUST display their keyboard shortcut hints in labels or tooltips (e.g., "Notes (N)", "Undo (Z)")
- **FR-021**: System MUST allow players to customize difficulty using a percentage scale (0-100%, where 0% is hardest and 100% is easiest) that adjusts the number of pre-filled clues rather than fixed presets
- **FR-022**: System MUST provide an undo function (via button and Z/Ctrl+Z keys) to revert the last action, including both final number entries and manual candidate/note changes (preserving up to 50 steps of history)
- **FR-023**: System MUST pause the timer when the page loses focus and keep it paused until the user explicitly interacts with the game (does not auto-resume on focus)

### Key Entities

- **Game Session**: Represents a single playthrough of a Sudoku puzzle. Attributes include: unique identifier, start time, current elapsed time, pause state, difficulty level, error count, completion status, current board state, and last modified timestamp.

- **Puzzle**: Represents the Sudoku grid with initial clues and solution. Attributes include: 9x9 grid of cells, initial pre-filled cells (clues), solution grid, difficulty rating (percentage 0-100%, mapped to number of clues provided), guarantee of logical solvability without guessing.

- **Cell**: Represents a single position in the 9x9 grid. Attributes include: row position (0-8), column position (0-8), current value (1-9 or empty), whether it's a pre-filled clue or user-entered, error state (valid/invalid), manual candidate numbers (user pencil marks), auto-generated candidate numbers (if shown).

- **Game Record**: Represents a completed game stored in history. Attributes include: completion date/time, total elapsed time, total error count, difficulty level (percentage), puzzle identifier (for potential replay), personal best flags.

- **User Preferences**: Represents player settings and preferences. Attributes include: preferred difficulty level (percentage), notes mode state (toggled on/off), candidate display mode (auto-show/manual/off), theme/appearance settings, keyboard shortcuts configuration (including notes mode hotkey), history display preferences (sort order, filters), auto-pause timeout setting.

- **Action History**: Represents the undo/redo stack for game actions. Attributes include: sequence of actions (cell, action type [final number entry or candidate change], previous state, new state, timestamp), current position in history, maximum history size (50 steps).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can start and complete a Sudoku game entirely offline without any network requests after initial page load
- **SC-002**: Game state is automatically saved and restored within 1 second of browser restart, allowing players to resume seamlessly
- **SC-003**: Invalid number entries are visually indicated within 100 milliseconds of entry, providing immediate feedback
- **SC-004**: Players can complete all game actions (navigation, entry, mode switching, undo, pause, new game) using only keyboard controls without requiring mouse input, with all buttons accessible via defined hotkeys
- **SC-005**: The game interface is fully responsive and playable on screens ranging from 320px mobile devices to 4K desktop displays
- **SC-006**: Game history can store and retrieve at least 1000 completed games without noticeable performance degradation
- **SC-007**: Puzzle generation completes within 2 seconds for any difficulty level, ensuring players don't wait
- **SC-008**: Players can identify their personal best time and lowest error count for each difficulty level within 5 seconds of opening history
- **SC-009**: 95% of user interactions (cell selection, number entry, highlighting) receive visual feedback within 50 milliseconds
- **SC-010**: The game functions correctly in offline mode for at least 90 days without requiring re-authentication or re-download
- **SC-011**: 100% of game state changes are persisted to local storage within 500 milliseconds, ensuring no data loss on unexpected browser closure
- **SC-012**: Players can close and reopen the browser at any point and resume their game with zero data loss 100% of the time

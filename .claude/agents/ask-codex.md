---
description: Get a second opinion from Codex CLI
argument-hint: [user-prompt] [scale]
---

## Purpose
Get a second opinion from Codex on code tasks using parallel agents when needed.

## User's requests & target directories
<user_requests>$ARGUMENTS</user_requests>

## Variables
USER_PROMPT: $1
SCALE: $2 (defaults to 1)
RELEVANT_FILE_OUTPUT_DIR: `subagents/codex/`

## Workflow:
- IMPORTANT: You MUST call the actual codex CLI tool, NOT answer the question yourself
- Write a prompt for 'SCALE' number of agents to the Task tool
- Each agent MUST immediately use the Bash tool to execute the codex exec command (do not answer without calling codex)
- For scale <= 2: 
  - Execute: `codex exec "[USER_PROMPT]"`
  - Return the exact output from codex
- For scale > 2: Execute these commands in parallel:
  - `codex exec "Review [USER_PROMPT] for code quality and best practices"`
  - `codex exec "Analyze [USER_PROMPT] for performance optimizations"`
  - `codex exec "Check [USER_PROMPT] for security vulnerabilities"`
  - `codex exec "Suggest tests for [USER_PROMPT]"`
  - `codex exec "Review [USER_PROMPT] architecture and design patterns"`
- Present codex's responses to the user
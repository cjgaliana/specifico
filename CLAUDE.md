# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Specifico** is a SPEC-driven development CLI tool and Claude Code plugin. It enforces a structured, specification-first workflow: **spec → plan → tasks → execute → verify → merge**. Each feature lives on its own git branch and produces structured artifacts (JSON + Markdown) tracked in a shared `MEMORY.json` registry.

Users install it via `npx specifico`, which copies template slash commands into `.claude/commands/specifico/`. Those commands (e.g. `/specifico:spec`, `/specifico:execute`) invoke the bundled `cli.js` via subprocess.

## Commands

```bash
npm run build        # Bundle src/index.ts with esbuild → template/cli.js and .claude/commands/specifico/cli.js
npm run prepublishOnly  # Runs build (used before npm publish)
```

There are no test or lint scripts configured.

## Architecture

### CLI Entry Point
[src/index.ts](src/index.ts) is the main dispatcher. It handles subcommands: `next-id`, `git`, `state`, `memory`, `spec`, `tasks`. All responses are JSON: `{success, data}` or `{success, error}`.

### Core Modules
- [src/state.ts](src/state.ts) — State machine for phase transitions (`spec → plan → tasks → execute → verify → merged/abandoned`). STATE.json lives inside each spec directory.
- [src/memory.ts](src/memory.ts) — Central `MEMORY.json` registry tracking entities and API endpoints across all merged specs. Detects schema conflicts before new specs execute.
- [src/tasks.ts](src/tasks.ts) — Dependency graph for tasks, cycle detection, next-ready task calculation.
- [src/git.ts](src/git.ts) — Wrapper over `simple-git`. Validates commit message format: `specifico(001/T003): <title>`.
- [src/storage.ts](src/storage.ts) — File I/O for JSON/text, spec directory listing.
- [src/id.ts](src/id.ts) — Monotonic counter (`.counter` file) for sequential spec IDs (`001`, `002`, …).
- [src/types.ts](src/types.ts) — Zod schemas for all domain types: `Phase`, `State`, `Entity`, `ApiEndpoint`, `Spec`, `Plan`, `Task`, `Memory`, conflict types.

### Template Slash Commands
[template/](template/) contains `.md` files installed as Claude Code slash commands. Each command calls the bundled `cli.js` subprocess. Key commands: `spec.md`, `plan.md`, `tasks.md`, `execute.md`, `verify.md`, `merge.md`, `status.md`, `refine.md`, `memory-update.md`, `memory-rebuild.md`.

### Storage Layout (inside the user's project)
```
specifico/
├── MEMORY.json          ← shared entity/API registry (conflict detection)
├── .counter             ← monotonic ID source
└── 001-feature-name/
    ├── SPEC.md + SPEC.json
    ├── PLAN.md + PLAN.json
    ├── TASKS.md + TASKS.json
    ├── STATE.json
    └── DECISIONS.md
```

### Build Output
`npm run build` bundles `src/index.ts` into two copies of the same file:
- `template/cli.js` — distributed with the npm package
- `.claude/commands/specifico/cli.js` — used locally during development

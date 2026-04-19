# Specifico

SPEC-driven development system for Claude Code. Enforces a structured, specification-first workflow where every feature follows a strict lifecycle: **spec → plan → tasks → execute → verify → merge**.

Each feature lives on its own branch, produces structured artifacts (JSON + Markdown), and contributes to a shared memory of entities and API contracts that prevents inconsistency across your codebase.

## Install

```bash
npx specifico
```

Run this in the root of any project you want to use Specifico in. It installs the Claude Code slash commands into `.claude/commands/specifico/`.

To upgrade or reinstall without a prompt:

```bash
npx specifico --force
```

## Requirements

- [Claude Code](https://claude.ai/code) CLI or desktop app
- Git repository

## Usage

Open your project in Claude Code. All commands are available as `/specifico:<command>`.

### Adding Specifico to an existing repo

If your repo already has code, run `/specifico:init` first. It scans the codebase for existing data models and API endpoints, confirms them with you, and writes an initial `MEMORY.json`. Future specs then conflict-check against these real contracts instead of starting from scratch.

```
/specifico:init
/specifico:spec "add payment flow"
...
```

### Full lifecycle example (new repo)

```
/specifico:spec "build user authentication with JWT"
/specifico:plan
/specifico:tasks
/specifico:execute        ← repeat until all tasks done
/specifico:verify
/specifico:memory-update
/specifico:merge
```

---

## Commands

### `/specifico:init`

Bootstraps Specifico in an existing repository. Scans the codebase for data model definitions (TypeScript interfaces, Prisma models, Pydantic/SQLAlchemy models, SQL tables, etc.) and API routes (Express, Next.js, FastAPI, NestJS, etc.), presents the findings for your review and correction, then writes the initial `specifico/MEMORY.json`.

Also initialises `specifico/` and `.counter` if they don't exist yet.

Run this once, before creating your first spec, when adding Specifico to a project that already has code.

---

### `/specifico:spec "<feature>"`

Creates a new spec for a feature. Generates a sequential ID (`001`, `002`, …), creates a dedicated branch (`specifico/001-user-auth`), and produces:

- `specifico/001-user-auth/SPEC.md` — human-readable spec
- `specifico/001-user-auth/SPEC.json` — structured: problem, goals, non-goals, entities, API endpoints, acceptance criteria
- `specifico/001-user-auth/STATE.json` — current phase tracker
- `specifico/001-user-auth/DECISIONS.md` — append-only decision log

Checks existing memory for entity/API conflicts before proceeding.

---

### `/specifico:plan`

Drafts the implementation plan for the current spec. Validates spec completeness first, then produces:

- `PLAN.md` — approach, components, data flow, risks, open questions
- `PLAN.json` — structured plan data

Transitions state: `spec → plan`.

---

### `/specifico:tasks`

Breaks the plan into atomic, ordered tasks. Each task maps to one or more acceptance criteria and has explicit dependencies. Validates the dependency graph for cycles.

- `TASKS.md` — checklist with dependency annotations
- `TASKS.json` — structured task list

Transitions state: `plan → tasks`.

---

### `/specifico:execute`

Implements the next ready task (or a specific task if passed as argument). Claude Code writes the code, commits it, and updates task state.

Before writing any code, checks MEMORY.json for entity/API contract conflicts — blocks if any are found.

Commit format:
```
specifico(001/T003): add JWT validation middleware
```

Transitions state: `tasks → execute` (idempotent — safe to re-run).

---

### `/specifico:verify`

Evaluates the implementation against every acceptance criterion in the spec. For each criterion, finds evidence in the codebase (file:line) and assigns a `pass`, `fail`, or `partial` verdict.

If all pass: sets `verifyPassed: true`, suggests next steps.  
If any fail: lists gaps and suggests which tasks to re-run.

Transitions state: `execute → verify`.

---

### `/specifico:merge`

Merges the spec branch into main. Requires verification to have passed.

```
specifico/001-user-auth → main
```

Transitions state: `verify → merged`.

---

### `/specifico:status [spec-id]`

Shows progress across all specs, or detailed status for a specific one:

```
ID    SLUG               PHASE     TASKS      BRANCH
001   user-auth          execute   5/8 done   specifico/001-user-auth
002   payment-flow       plan      —          specifico/002-payment-flow
```

---

### `/specifico:refine "<spec-id> <what to change>"`

Updates a spec mid-lifecycle and resets state to the earliest invalidated phase. Appends the rationale to `DECISIONS.md`. Downstream artifacts (plan, tasks, verify) are invalidated and must be re-run.

---

### `/specifico:memory-update <spec-id>`

Extracts entity and API endpoint definitions from a completed spec and merges them into `specifico/MEMORY.json`. Blocks on schema conflicts.

---

### `/specifico:memory-rebuild`

Reconstructs `MEMORY.json` from scratch by replaying all merged specs in order. Useful after manual edits or corruption.

---

## Storage layout

All Specifico artifacts live in a `specifico/` folder at your project root (committed to the repo):

```
specifico/
├── MEMORY.json                  ← shared entity/API registry
├── .counter                     ← monotonic ID counter
├── 001-user-auth/
│   ├── SPEC.md + SPEC.json
│   ├── PLAN.md + PLAN.json
│   ├── TASKS.md + TASKS.json
│   ├── STATE.json
│   └── DECISIONS.md
└── 002-payment-flow/
    └── ...
```

## Memory system

`MEMORY.json` accumulates the entities and API contracts introduced by each merged spec. Before executing any task, Specifico checks incoming entity/API definitions against memory and **blocks on conflicts** — type mismatches, removed fields, changed HTTP methods.

This prevents specs from silently diverging from each other over time.

## Git workflow

- One branch per spec: `specifico/<id>-<slug>`
- One commit per task: `specifico(<id>/<task-id>): <title>`
- Merge into main only after verification passes

## License

MIT

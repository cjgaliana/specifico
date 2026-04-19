---
description: Update a spec artifact and propagate changes forward
argument-hint: "<spec-id> <what to change>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:refine` — updating an artifact mid-lifecycle and resetting state appropriately.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec

Parse spec ID from `$ARGUMENTS` (first word). The rest of `$ARGUMENTS` describes what to change.

### 2. Read current state

```bash
$CLI state read "$SPEC_DIR"
```

### 3. Determine change scope

From the description in `$ARGUMENTS`, determine the earliest artifact affected:

| Change affects | Reset to phase |
|---|---|
| SPEC only (problem, goals, ACs, entities, APIs) | `spec` |
| PLAN only (approach, components, risks) | `plan` |
| TASKS only (task descriptions, dependencies) | `tasks` |

### 4. Warn about downstream invalidation

Show the user what will be invalidated:

```
⚠ Refining at the <scope> level will reset state to "<phase>".
  The following will need to be re-run:
  - /specifico:plan       ← re-draft (if scope is spec)
  - /specifico:tasks      ← re-generate
  - /specifico:implement  ← re-implement any affected tasks
  - /specifico:verify     ← re-verify

Confirm? (yes/no)
```

Only continue if the user confirms.

### 5. Make the changes

Update the relevant artifact(s) — SPEC.md + SPEC.json, PLAN.md + PLAN.json, or TASKS.md + TASKS.json — based on the user's description.

### 6. Reset state to earliest invalidated phase

```bash
$CLI state transition "$SPEC_DIR" "<reset-phase>"
```

Note: This may require multiple transitions (e.g., from `execute` back to `spec` means going execute → tasks → plan → spec). Chain them.

### 7. Append to DECISIONS.md

```markdown
## [<date>] Refinement: <brief description>

**Scope**: <spec|plan|tasks>
**Reason**: <why this change was needed>
**Impact**: Reset to phase: <phase>
```

### 8. Confirm

```
✓ Refinement applied to <ID>-<slug>
  Changed: <artifact>
  State reset to: <phase>

Next step: /specifico:plan (if reset to spec or plan) OR /specifico:tasks (if reset to tasks) OR /specifico:implement
```

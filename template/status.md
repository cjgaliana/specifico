---
description: Show current phase, progress, and blockers for specs
argument-hint: "<spec-id or leave empty for all>"
allowed-tools: [Bash, Read]
---

You are executing `/specifico:status` — showing the current state of Specifico specs.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### If no arguments (show all specs)

List all spec directories under `$PROJECT_ROOT/.specifico/`. For each, read `STATE.json` and `TASKS.json` (if exists). Display a summary table:

```
ID    SLUG                  PHASE     TASKS      BRANCH
001   user-authentication   execute   5/8 done   specifico/001-user-authentication
002   payment-flow          plan      —          specifico/002-payment-flow
003   email-notifications   merged    8/8 done   (merged)
```

Then show the recommended next command for the most recently active spec.

### If spec-id provided

Read STATE.json, SPEC.json, TASKS.json, and the last entry in DECISIONS.md for the given spec.

Display:
```
Spec: <ID>-<slug>
Phase: <phase>
Branch: <branch>
Created: <date>
Updated: <date>

Acceptance Criteria: N criteria
Verify: <passed/failed/pending>

Tasks:
  ✓ T001: <title> (sha: abc123)
  ✓ T002: <title>
  ● T003: <title>  ← next ready
  ○ T004: <title>  (waiting on T003)
  ○ T005: <title>  (waiting on T003)

Blockers: <none / list>

Last Decision:
  <last entry from DECISIONS.md>

Recommended:
  - If phase is "spec":    /specifico:plan <ID>
  - If phase is "plan":    /specifico:tasks <ID>
  - If phase is "tasks":   /specifico:implement <ID>
  - If phase is "execute": /specifico:implement <ID>
  - If phase is "verify":  /specifico:merge <ID>
  - If phase is "merged":  /specifico:spec (to create next feature)
```

Legend: ✓ = done, ● = ready to execute, ○ = waiting on dependencies

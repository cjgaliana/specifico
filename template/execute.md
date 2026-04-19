---
description: Implement the next pending task (or a specific task)
argument-hint: "<spec-id> [task-id]"
allowed-tools: [Bash, Read, Write, Glob, Grep]
---

You are executing `/specifico:execute` — implementing code for the next ready task in a Specifico spec.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec

Parse spec ID from `$ARGUMENTS` (first word) or current git branch. Find `$SPEC_DIR`.

### 2. Validate phase

```bash
$CLI state read "$SPEC_DIR"
```

Phase must be `tasks` or `execute`. Abort otherwise.

### 3. Verify correct branch

```bash
BRANCH=$($CLI git current-branch | jq -r '.data')
EXPECTED="specifico/<ID>-<slug>"
```

If branch does not match, warn the user and ask them to switch: `git checkout specifico/<ID>-<slug>`

### 4. Check memory conflicts

Read `$SPEC_DIR/SPEC.json`. Extract entities and apiEndpoints. Build a delta JSON:
```json
{ "entities": [...], "apiEndpoints": [...] }
```

```bash
$CLI memory check-delta '<delta-json>'
```

If this exits with an error (BLOCK conflicts), **stop immediately**. Display the conflicts clearly. Do not write any code until conflicts are resolved via `/specifico:refine`.

### 5. Get the next ready task

If a specific task-id was passed in `$ARGUMENTS` (second word), use that. Otherwise:
```bash
TASK=$($CLI tasks next "$SPEC_DIR" | jq '.data')
```

If null (no ready tasks), check if all tasks are done. If yes: "All tasks complete → run `/specifico:verify`". If no: some tasks are blocked by incomplete dependencies — show which.

### 6. Transition to execute phase (idempotent)

```bash
$CLI state transition "$SPEC_DIR" execute
```

This is a no-op if already in execute phase.

### 7. Implement the task

Read the task's `title` and `description`. Read `$SPEC_DIR/PLAN.json` for architectural guidance. Read `$PROJECT_ROOT/specifico/MEMORY.json` for entity/API contracts to follow exactly.

Write the code. Follow the plan's component structure. Do not deviate from established entity schemas or API contracts in MEMORY.json.

### 8. Commit

```bash
$CLI git commit "specifico(<ID>/T<NNN>): <task-title>"
```

The commit message **must** match the format `specifico(<id>/<task-id>): <title>`.

### 9. Mark task done

```bash
SHA=$($CLI git get-sha HEAD | jq -r '.data')
$CLI tasks mark-done "$SPEC_DIR" "<task-id>" "$SHA"
```

### 10. Update completedTasks in STATE.json

Read current state, add the completed task ID to `completedTasks`, write back.

### 11. Check remaining tasks

```bash
NEXT=$($CLI tasks next "$SPEC_DIR" | jq '.data')
```

- If NEXT is not null: "Task <task-id> done. Next ready task: <next-id>. Re-run `/specifico:execute` to continue."
- If NEXT is null: "All tasks complete! Run `/specifico:verify` to validate the implementation."

---
description: Break the plan into an ordered, atomic task list
argument-hint: "<spec-id or leave empty>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:tasks` — generating the task list for a Specifico spec.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec

Parse spec ID from `$ARGUMENTS` or from the current git branch. Find `$SPEC_DIR`.

### 2. Validate prerequisite phase

```bash
$CLI state read "$SPEC_DIR"
```

Phase must be `plan`. Abort if not.

### 3. Read SPEC.json and PLAN.json

Load the acceptance criteria, components, and approach from both files.

### 4. Generate tasks

Create atomic tasks T001, T002, … T00N. Each task must:
- Be implementable in a **single git commit**
- Reference one or more acceptance criteria by index
- Have an explicit `dependsOn` list (task IDs that must complete first)
- Have a clear title (imperative mood) and description

Rules:
- Setup/scaffolding tasks come first and have no dependencies
- Integration tasks depend on the components they integrate
- A verification/wiring task must come after the component tasks it wires together
- The final task should be a smoke-test or integration validation

### 5. Validate the dependency graph

```bash
# Write TASKS.json first, then validate
$CLI tasks validate "$SPEC_DIR"
```

If cycles detected, fix the task dependency graph before proceeding.

### 6. Write TASKS.json

Write to `$SPEC_DIR/TASKS.json`:
```json
{
  "specId": "<ID>",
  "tasks": [
    {
      "id": "T001",
      "title": "<imperative title>",
      "description": "<what to implement>",
      "dependsOn": [],
      "status": "pending"
    }
  ]
}
```

### 7. Write TASKS.md

Human-readable checklist. Show the dependency-ordered list. Mark each task with:
```
- [ ] T001: <title> (no deps)
- [ ] T002: <title> (after T001)
- [ ] T003: <title> (after T001, T002)
```

### 8. Transition state

```bash
$CLI state transition "$SPEC_DIR" tasks
$CLI journal update-spec "$ID" "tasks" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

### 9. Confirm

```
✓ Task list created for <ID>-<slug>
  Tasks: N
  Execution order: T001 → T002 → T003 → ...

Next step: /specifico:execute
```

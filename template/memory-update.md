---
description: Extract entity/API delta from a completed spec and merge into MEMORY.json
argument-hint: "<spec-id>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:memory-update` — syncing a spec's data contracts into the global memory.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec

Parse spec ID from `$ARGUMENTS`. Find `$SPEC_DIR`.

### 2. Validate state

```bash
$CLI state read "$SPEC_DIR"
```

Phase must be `verify` (with `verifyPassed: true`) or `merged`. Abort if not.

### 3. Build the memory delta

Read `$SPEC_DIR/SPEC.json`. Extract `entities` and `apiEndpoints` arrays. This is the delta:

```json
{
  "entities": [...],
  "apiEndpoints": [...]
}
```

### 4. Check for conflicts

```bash
$CLI memory check-delta '<delta-json>'
```

If this exits with a non-zero code (BLOCK conflicts detected), display the conflicts clearly and stop:

```
✗ Memory conflict detected — cannot update:
  Entity "User" field "email" type mismatch: existing=string, incoming=number
  
  Resolve the conflict by running /specifico:refine <ID> to fix the entity definition,
  then re-verify before updating memory.
```

If only WARN conflicts (non-zero but conflicts all have severity "warn"), display them but continue.

### 5. Apply the delta

```bash
$CLI memory apply-delta '<delta-json>'
```

### 6. Confirm

```
✓ Memory updated from spec <ID>-<slug>
  Entities: N added/updated
  API endpoints: M added/updated
  MEMORY.json: .specifico/MEMORY.json

Next step: /specifico:merge <ID>
```

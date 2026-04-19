---
description: Merge a verified spec branch into main
argument-hint: "<spec-id>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:merge` — merging a completed and verified spec into main.

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
STATE=$($CLI state read "$SPEC_DIR")
```

- Phase must be `verify`
- `verifyPassed` must be `true`

If phase is `verify` but `verifyPassed` is false:
```
✗ Cannot merge: verification did not pass.
  Run /specifico:execute to fix failing criteria, then /specifico:verify again.
```

If phase is not `verify`:
```
✗ Cannot merge: current phase is "<phase>". Complete the lifecycle first.
```

### 3. Confirm with user

Ask: "This will merge `specifico/<ID>-<slug>` into your current branch (`main`). Proceed? (yes/no)"

Only continue if the user confirms.

### 4. Merge

```bash
$CLI git merge "specifico/<ID>-<slug>"
```

### 5. Transition state to merged

```bash
$CLI state transition "$SPEC_DIR" merged
$CLI journal update-spec "$ID" "merged" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

### 6. Confirm

```
✓ Spec <ID>-<slug> merged successfully.

Recommended next steps:
  /specifico:memory-update <ID>   — sync this spec's entities/APIs into global memory
  /specifico:status               — view remaining active specs
```

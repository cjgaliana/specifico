---
description: Implement all pending tasks then verify, looping until fully done and verified
argument-hint: "<spec-id> [task-id]"
allowed-tools: [Bash, Read, Write, Glob, Grep]
---

You are executing `/specifico:implement` — implementing tasks and verifying the spec end-to-end without stopping. You will loop through all remaining tasks, then verify against every acceptance criterion. If verification fails, you will fix the gaps and re-verify, repeating until all criteria pass.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Phase 1 — Setup (run once)

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

### 5. Transition to execute phase (idempotent)

```bash
$CLI state transition "$SPEC_DIR" execute
$CLI journal update-spec "$ID" "execute" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

This is a no-op if already in execute phase.

---

## Phase 2 — Task implementation loop

Repeat the following until no ready tasks remain:

### A. Get the next ready task

If a specific task-id was passed in `$ARGUMENTS` (second word), use it for the first iteration only. Otherwise:

```bash
TASK=$($CLI tasks next "$SPEC_DIR" | jq '.data')
```

- If TASK is null and some tasks are still incomplete, their dependencies are unmet — show which and stop.
- If TASK is null and all tasks are marked done, exit this loop and proceed to **Phase 3**.

### B. Implement the task

Read the task's `title` and `description`. Read `$SPEC_DIR/PLAN.json` for architectural guidance. Read `$PROJECT_ROOT/.specifico/MEMORY.json` for entity/API contracts to follow exactly.

Write the code. Follow the plan's component structure. Do not deviate from established entity schemas or API contracts in MEMORY.json.

### C. Commit

```bash
$CLI git commit "specifico(<ID>/T<NNN>): <task-title>"
```

Commit message **must** match `specifico(<id>/<task-id>): <title>`.

### D. Mark task done

```bash
SHA=$($CLI git get-sha HEAD | jq -r '.data')
$CLI tasks mark-done "$SPEC_DIR" "<task-id>" "$SHA"
```

### E. Update completedTasks in STATE.json

Read current state, add the completed task ID to `completedTasks`, write back.

Print: `✓ Task <task-id> done — checking for next task…`

**→ Return to step A.**

---

## Phase 3 — Verification loop

All tasks are done. Now verify the implementation against the spec's acceptance criteria. Repeat this phase until all criteria pass.

### A. Evaluate each acceptance criterion

Read `$SPEC_DIR/SPEC.json` → `acceptanceCriteria` array.

For **each** criterion:
1. Search the codebase for relevant code (use Grep, Glob, Read)
2. Evaluate: does the implementation satisfy this criterion?
3. Assign verdict: `pass`, `fail`, or `partial`
4. Provide evidence: specific file path and line number

Format findings as:
```
AC-1: <criterion text>
  Verdict: PASS
  Evidence: src/auth/middleware.ts:42 — JWT validation applied to all protected routes

AC-2: <criterion text>
  Verdict: FAIL
  Gap: No rate limiting found. Expected: max 5 login attempts per minute.
```

### B. Write verify results to SPEC.json

Update `$SPEC_DIR/SPEC.json` to include `verifyResults`:
```json
"verifyResults": [
  { "criterion": "<AC text>", "verdict": "pass", "evidence": "file:line — explanation" }
]
```

### C. All criteria pass?

**If all pass → proceed to Phase 4.**

**If any fail or partial:**

For each failing criterion:
1. Identify exactly what code is missing or incorrect.
2. Implement the fix directly — no separate task needed.
3. Commit each fix:
   ```bash
   $CLI git commit "specifico(<ID>/fix): <short description of what was fixed>"
   ```

After all fixes are committed, print: `Fixes applied — re-running verification…`

**→ Return to Phase 3, step A.**

---

## Phase 4 — Finalise

All tasks are implemented and all acceptance criteria pass.

### A. Transition state

```bash
$CLI state transition "$SPEC_DIR" verify
$CLI journal update-spec "$ID" "verify" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

Read state, set `verifyPassed: true`, write back.

### B. Report

```
✓ All tasks complete and verification PASSED for <ID>-<slug>
  Tasks completed:   N
  Criteria verified: M/M

Next steps:
  1. /specifico:memory-update   — sync entities/APIs into global memory
  2. /specifico:merge           — merge branch into main
```

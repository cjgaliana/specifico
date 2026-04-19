---
description: Validate the implementation against SPEC acceptance criteria
argument-hint: "<spec-id or leave empty>"
allowed-tools: [Bash, Read, Glob, Grep, Write]
---

You are executing `/specifico:verify` — evaluating the implementation against the spec's acceptance criteria.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec and validate phase

Phase must be `execute`. Abort if not.

### 2. Confirm all tasks are done

```bash
NEXT=$($CLI tasks next "$SPEC_DIR" | jq '.data')
```

If NEXT is not null, abort:
```
✗ Cannot verify: task <task-id> is still pending. Run /specifico:execute first.
```

### 3. Evaluate each acceptance criterion

Read `$SPEC_DIR/SPEC.json` → `acceptanceCriteria` array.

For **each** criterion:
1. Search the codebase for relevant code (use Grep, Glob, Read)
2. Evaluate: does the implementation satisfy this criterion?
3. Assign verdict: `pass`, `fail`, or `partial`
4. Provide evidence: specific file path and line number where the implementation lives

Format your findings as:
```
AC-1: <criterion text>
  Verdict: PASS
  Evidence: src/auth/middleware.ts:42 — JWT validation applied to all protected routes

AC-2: <criterion text>
  Verdict: FAIL
  Gap: No rate limiting found. Expected: max 5 login attempts per minute.
```

### 4. Write verify results to SPEC.json

Update `$SPEC_DIR/SPEC.json` to include `verifyResults`:
```json
"verifyResults": [
  { "criterion": "<AC text>", "verdict": "pass", "evidence": "file:line — explanation" }
]
```

### 5. Update STATE.json

```bash
$CLI state transition "$SPEC_DIR" verify
```

Set `verifyPassed` based on whether all verdicts are `pass`:
- All pass → `"verifyPassed": true`
- Any fail or partial → `"verifyPassed": false`

Read state, update `verifyPassed`, write back.

### 6. Report and recommend

**If all pass:**
```
✓ Verification PASSED for <ID>-<slug>
  All N acceptance criteria satisfied.

Next steps:
  1. /specifico:memory-update   — sync entities/APIs into global memory
  2. /specifico:merge           — merge branch into main
```

**If any fail:**
```
✗ Verification FAILED for <ID>-<slug>
  Passed:  N/M
  Failed:  M-N/M

Failing criteria:
  AC-2: <text>
    Gap: <explanation>
  AC-5: <text>
    Gap: <explanation>

Run /specifico:execute to fix the failing criteria, then re-run /specifico:verify.
```

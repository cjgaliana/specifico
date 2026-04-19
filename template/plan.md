---
description: Generate an implementation plan for the current spec
argument-hint: "<spec-id (e.g. 001) or leave empty to use current branch>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:plan` — drafting an implementation plan for a Specifico spec.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Resolve the spec

If `$ARGUMENTS` is provided (e.g. `001`), use it as the spec ID. Otherwise, parse the current git branch:
```bash
BRANCH=$($CLI git current-branch | jq -r '.data')
# Extract ID from "specifico/001-user-auth" → "001"
```

Find the spec directory: `$PROJECT_ROOT/specifico/<ID>-<slug>/`

### 2. Validate prerequisite phase

```bash
STATE=$($CLI state read "$SPEC_DIR")
```

If `phase` is not `spec`, abort with:
```
✗ Cannot plan: current phase is "<phase>". Run /specifico:spec first.
```

### 3. Validate spec completeness

```bash
$CLI spec validate "$SPEC_DIR"
```

If validation fails (missing fields), list them and stop. Do not proceed until the spec is complete.

### 4. Read context

- Read `$SPEC_DIR/SPEC.json` — full spec
- Read `$PROJECT_ROOT/specifico/MEMORY.json` — existing entities/APIs
- Read the current codebase for relevant existing patterns

### 5. Draft the plan

Produce a detailed implementation plan covering:
- **Approach**: High-level strategy
- **Components**: What modules/services/layers will be created or modified (name, description, responsibilities)
- **Data flow**: How data moves through the system end-to-end
- **Risks**: What could go wrong, and mitigation strategies
- **Open questions**: Anything that needs human decision before execution

Reference MEMORY.json entities and API contracts directly where applicable. Do not invent new entity shapes that conflict with existing ones.

### 6. Write PLAN.json

Write to `$SPEC_DIR/PLAN.json`:
```json
{
  "id": "<ID>",
  "slug": "<slug>",
  "approach": "<narrative>",
  "components": [
    { "name": "<name>", "description": "<desc>", "responsibilities": ["<r1>", "..."] }
  ],
  "dataFlow": "<end-to-end description>",
  "risks": ["<risk 1>", "..."],
  "openQuestions": ["<question>", "..."],
  "createdAt": "<ISO>",
  "updatedAt": "<ISO>"
}
```

### 7. Write PLAN.md

Human-readable markdown with sections for approach, components, data flow, risks, and open questions.

### 8. Append to DECISIONS.md

Append the key architectural decision made during planning:
```markdown
## [<date>] Architecture approach selected

<one-paragraph rationale for the approach chosen>
```

### 9. Transition state

```bash
$CLI state transition "$SPEC_DIR" plan
$CLI journal update-spec "$ID" "plan" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

### 10. Confirm

```
✓ Plan created for <ID>-<slug>
  Approach: <one-line summary>
  Components: N
  Risks: N

Next step: /specifico:tasks
```

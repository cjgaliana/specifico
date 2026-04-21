---
description: Create a new SPEC for a feature or change
argument-hint: "<feature title or description>"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:spec` — creating a new specification in the Specifico SPEC-driven development system.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Read existing memory

Read `$PROJECT_ROOT/.specifico/MEMORY.json` if it exists for existing entities and API endpoints.
Read `$PROJECT_ROOT/.specifico/MEMORY.md` if it exists for project features, architecture patterns, and conventions relevant to this feature.

### 2. Get the next spec ID

```bash
ID=$($CLI next-id)
```

### 3. Derive the slug

Slugify the user's request: `$ARGUMENTS`. Convert to lowercase, replace spaces and special characters with hyphens.

Example: "Build user authentication" → `user-authentication`

### 4. Gather spec details

If `$ARGUMENTS` is a bare short title or unclear, ask the user for:
- **Problem statement**: What specific problem does this solve?
- **Goals**: What will this feature accomplish? (list)
- **Non-goals**: What is explicitly out of scope?
- **Acceptance criteria**: What testable conditions must pass for this to be complete?
- **Entities touched**: What data models does this feature introduce or modify?
- **API endpoints**: What HTTP endpoints does this introduce or modify?

If `$ARGUMENTS` is a detailed description, extract the above from it directly.

### 5. Surface relevant memory

From MEMORY.json, show the user any existing entities or API endpoints that overlap with what they described. From MEMORY.md, surface relevant project context (patterns/conventions). Make it clear what contracts already exist and must not be broken.

### 6. Create the spec directory and branch

```bash
SLUG="<derived-slug>"
SPEC_DIR="$PROJECT_ROOT/.specifico/${ID}-${SLUG}"
mkdir -p "$SPEC_DIR"
$CLI git branch-create "specifico/${ID}-${SLUG}"
```

### 7. Write SPEC.json

Write a valid SPEC.json to `$SPEC_DIR/SPEC.json` with this structure:
```json
{
  "id": "<ID>",
  "slug": "<slug>",
  "title": "<title>",
  "problem": "<problem statement>",
  "goals": ["<goal 1>", "..."],
  "nonGoals": ["<non-goal 1>", "..."],
  "entities": [
    { "name": "<EntityName>", "fields": { "<field>": { "type": "<type>", "required": true, "description": "<desc>" } } }
  ],
  "apiEndpoints": [
    { "path": "/example", "method": "POST", "description": "<desc>", "requestSchema": {}, "responseSchema": {} }
  ],
  "acceptanceCriteria": ["<AC 1>", "..."],
  "outOfScope": ["<item>", "..."],
  "createdAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>"
}
```

### 8. Write SPEC.md

Write a human-readable SPEC.md to `$SPEC_DIR/SPEC.md` covering: title, problem, goals/non-goals, entities, API contracts, and acceptance criteria as a numbered list.

### 9. Initialize STATE.json

```bash
$CLI state write "$SPEC_DIR" '{"id":"<ID>","slug":"<slug>","phase":"spec","branch":"specifico/<ID>-<slug>","createdAt":"<ISO>","updatedAt":"<ISO>","completedTasks":[],"blockers":[]}'
```

### 9.5. Record spec in journal

```bash
$CLI journal add-spec "$ID" "$SLUG" "<title>" "spec" "specifico/$ID-$SLUG" "<ISO>"
```

### 10. Initialize DECISIONS.md

Write an empty DECISIONS.md with a header:
```
# Decisions — <ID>-<slug>

Created: <date>
```

### 11. Confirm

Print a summary:
```
✓ Spec <ID>-<slug> created
  Branch: specifico/<ID>-<slug>
  Dir:    .specifico/<ID>-<slug>/
  Phase:  spec

Next step: /specifico:plan
```

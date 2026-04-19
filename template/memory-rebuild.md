---
description: Reconstruct MEMORY.json from all merged specs
argument-hint: "(no arguments)"
allowed-tools: [Bash, Read, Write]
---

You are executing `/specifico:memory-rebuild` — reconstructing the global memory from scratch by aggregating all merged specs.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
```

## Steps

### 1. Warn the user

```
⚠ This will overwrite specifico/MEMORY.json entirely by re-processing all merged specs.
  Any manual edits to MEMORY.json will be lost.

Proceed? (yes/no)
```

Only continue if the user confirms.

### 2. Rebuild

```bash
RESULT=$($CLI memory rebuild)
```

This scans all spec directories where `STATE.json.phase === "merged"`, processes them in ID order, and reconstructs MEMORY.json from their SPEC.json entity/API declarations.

### 3. Confirm

Parse the result and report:
```
✓ MEMORY.json rebuilt from N merged specs
  Entities:      <count>
  API endpoints: <count>
  Last updated:  <timestamp>

Next step: /specifico:status
```

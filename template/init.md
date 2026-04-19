---
description: Bootstrap MEMORY.json by scanning an existing codebase for entities and API patterns
argument-hint: "(no arguments)"
allowed-tools: [Bash, Read, Write, Glob, Grep]
---

You are executing `/specifico:init` — bootstrapping Specifico in an existing repository by extracting its current data models and API contracts into MEMORY.json.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
SPECIFICO_DIR="$PROJECT_ROOT/specifico"
MEMORY_FILE="$SPECIFICO_DIR/MEMORY.json"
```

## Steps

### 1. Check for existing installation

If `$MEMORY_FILE` exists, warn the user:

```
⚠ specifico/MEMORY.json already exists.
  Running /specifico:init will overwrite it with a fresh scan of the codebase.
  Any memory accumulated from merged specs will be lost. Use /specifico:memory-rebuild instead to reconstruct from specs.

Proceed? (yes/no)
```

Only continue if the user confirms or the file does not exist.

### 2. Scan the codebase for entities

Search for data model definitions. Look broadly — adapt to whatever stack this repo uses:

- **TypeScript/JavaScript**: `interface`, `type`, `class`, `enum`, Zod schemas (`z.object`), Prisma models (`model`), Mongoose schemas (`new Schema`), TypeORM entities (`@Entity`)
- **Python**: dataclasses, Pydantic models (`BaseModel`), SQLAlchemy models (`Base`)
- **Go**: structs with JSON tags
- **Database**: SQL `CREATE TABLE` statements, migration files

For each candidate, extract:
- Entity name
- Fields with their types and whether they appear required or optional

Focus on domain entities (User, Order, Product, etc.) — skip framework internals, config types, and utility types.

### 3. Scan the codebase for API endpoints

Search for route/endpoint definitions. Adapt to the stack:

- **Express/Fastify**: `router.get`, `app.post`, `router.use`, etc.
- **Next.js**: `export default` handlers in `pages/api/` or `app/api/` route files
- **NestJS**: `@Get`, `@Post`, `@Controller` decorators
- **Python/FastAPI**: `@app.get`, `@router.post`
- **Go**: `http.HandleFunc`, `chi`, `gin` route registrations
- **OpenAPI/Swagger**: existing `openapi.yaml` or `swagger.json`

For each endpoint, extract:
- HTTP method
- Path (normalize to use `:param` style)
- Brief description (from comments, function name, or surrounding context)
- Request/response shape if clearly visible in the same block

### 4. Present findings and confirm

Show the user a summary of what was found:

```
Found in <repo-name>:

Entities (<N>):
  • User          — id, email, name, createdAt
  • Order         — id, userId, total, status
  • ...

API Endpoints (<M>):
  • GET  /users/:id
  • POST /orders
  • ...

Patterns noted:
  • <e.g. "REST API, Express, Prisma ORM">
  • <e.g. "Auth via JWT in Authorization header">
  • <e.g. "All responses wrapped in { data, error }">
```

Then ask:
```
Does this look right?
- Type "yes" to proceed
- Type corrections or additions (e.g. "add field role:string to User", "remove the internal endpoint /health")
- Type "no" to abort
```

Apply any corrections the user gives before writing. Repeat until the user confirms.

### 5. Build the memory delta

Construct the delta JSON from confirmed entities and endpoints:

```json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "id": { "type": "string", "required": true, "description": "Primary key" },
        "email": { "type": "string", "required": true, "description": "" }
      }
    }
  ],
  "apiEndpoints": [
    {
      "path": "/users/:id",
      "method": "GET",
      "description": "Fetch a user by ID",
      "requestSchema": {},
      "responseSchema": {}
    }
  ]
}
```

Use `"unknown"` as the type for any field whose type could not be determined.

### 6. Initialize the specifico directory

```bash
mkdir -p "$SPECIFICO_DIR"
```

If `$SPECIFICO_DIR/.counter` does not exist, create it:

```bash
echo -n "000" > "$SPECIFICO_DIR/.counter"
```

Do not overwrite an existing `.counter` — it tracks real spec IDs.

### 7. Write MEMORY.json

```bash
$CLI memory apply-delta '<delta-json>'
```

This writes `specifico/MEMORY.json` with the discovered entities and endpoints as the baseline memory. Future specs will conflict-check against this baseline.

### 8. Confirm

```
✓ Specifico initialized

  specifico/MEMORY.json written
  Entities:      <N>
  API endpoints: <M>

  Future specs will conflict-check against these contracts.
  Run /specifico:spec "<feature>" to create your first spec.
```

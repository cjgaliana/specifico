---
description: Bootstrap MEMORY.md by scanning an existing codebase for tech stack and existing features
argument-hint: "(no arguments)"
allowed-tools: [Bash, Read, Write, Glob, Grep]
---

You are executing `/specifico:init` — bootstrapping Specifico in an existing repository by extracting its current tech stack and features into MEMORY.md.

## Setup

```bash
CLI="node $(dirname $0)/cli.js"
PROJECT_ROOT="$(pwd)"
SPECIFICO_DIR="$PROJECT_ROOT/specifico"
MEMORY_FILE="$SPECIFICO_DIR/MEMORY.md"
```

## Steps

### 1. Check for existing installation

If `$MEMORY_FILE` exists, warn the user:

```
⚠ specifico/MEMORY.md already exists.
  Running /specifico:init will overwrite it with a fresh scan of the codebase.
  Any memory accumulated from merged specs will be lost.

Proceed? (yes/no)
```

Only continue if the user confirms or the file does not exist.

### 2. Scan the codebase for tech stack

Detect which technologies this project uses. Look broadly for clues:

- **Package managers & languages**:
  - `package.json` → Node.js project; check `devDependencies` and `dependencies` for major frameworks
  - `pyproject.toml` or `requirements.txt` → Python; identify frameworks and key libraries
  - `go.mod` → Go project
  - `Cargo.toml` → Rust project
  - `.csproj` or `.sln` → C# / .NET

- **Frameworks & runtimes**:
  - JavaScript: React, Vue, Angular, Next.js, Svelte, Express, Fastify, NestJS, Remix, Astro
  - Python: Django, Flask, FastAPI, SQLAlchemy, Pydantic
  - Go: chi, gin, echo, GORM
  - Databases: PostgreSQL, MySQL, MongoDB, SQLite, Firebase

- **Other tech**:
  - Type checking: TypeScript, mypy
  - ORM/Query: Prisma, Sequelize, TypeORM, SQLAlchemy, GORM, Mongoose
  - Auth: Passport, NextAuth, Django Auth, Spring Security
  - Testing: Jest, Vitest, pytest, RSpec
  - API docs: Swagger/OpenAPI, GraphQL

For each detected tech, record it in a list.

### 3. Scan the codebase for existing features

Look for implemented functionality by examining:

- **Source file structure**: Directory names often reflect features (e.g., `src/auth/`, `modules/payments/`, `services/notifications/`)
- **README.md**: Often lists key features
- **API routes**: Grep for route handlers to identify endpoints / features
- **Database tables/models**: Grep for model definitions to infer what data is being managed
- **Configuration files**: `config/`, `.env.example` may reveal features (e.g., STRIPE_API_KEY → payment feature)
- **Comments in code**: High-level architectural comments

Extract feature names and brief descriptions. Examples:
- "User authentication via email/password"
- "Payment processing with Stripe integration"
- "Email notifications with Sendgrid"
- "Admin dashboard with analytics"

### 4. Present findings and confirm

Show the user a summary:

```
Found in <repo-name>:

Tech Stack:
  • Node.js / TypeScript
  • React
  • Express.js
  • PostgreSQL
  • Prisma ORM

Existing Features:
  • User authentication (email/password login)
  • Product catalog with search
  • Shopping cart and checkout
  • Email notifications

Patterns noted:
  • REST API with Express
  • React SPA frontend
  • Server-side session management
  • Monorepo structure (frontend + backend)
```

Then ask:
```
Does this look right?
- Type "yes" to proceed
- Type corrections or additions:
  - tech: TypeScript, GraphQL, (remove or add technologies)
  - feature: User dashboard (add/remove features)
- Type "no" to abort
```

Apply corrections the user gives before writing.

### 5. Initialize the specifico directory

```bash
mkdir -p "$SPECIFICO_DIR"
```

Initialize the journal:

```bash
$CLI journal read > /dev/null
```

This ensures `journal.json` is created.

### 6. Initialize and populate MEMORY.md

Initialize the markdown memory:

```bash
$CLI memory-md init
```

Update tech stack:

```bash
$CLI memory-md update-tech-stack '["TypeScript", "React", "Express", "PostgreSQL", "Prisma", ...]'
```

Add detected patterns:

```bash
$CLI memory-md add-pattern "REST API architecture"
$CLI memory-md add-pattern "Server-side session management"
```

(Add as many patterns as you identified)

### 7. Confirm

```
✓ Specifico initialized

  specifico/MEMORY.md written
  Tech stack:      <N> technologies identified
  Existing features: <M> features documented

  The MEMORY.md will be updated each time specs are merged.
  Run /specifico:spec "<feature>" to create your first spec.
```


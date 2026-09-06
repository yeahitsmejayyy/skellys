---
name: skelly-backend
description: Start a new backend, API or server from the Skelly backend template — Bun, SQLite, tRPC, typed end to end. Use when someone is beginning a product and needs a backend to build on, asks for an API with a database, or wants a server their frontend can be typed against.
---

# Skelly Backend

A backend skeleton that boots in seconds: Bun, `bun:sqlite`, tRPC v11, Zod. You clone it,
prove it runs, then build the user's first real endpoint on it.

**Do not read the whole tree.** The map below is what you need. Open a file when you are
about to change it, not before — reading source you are not editing is the expensive habit
this template exists to avoid.

## Scaffolding: the one thing to get right

`skelly` appears in these repos in three roles, and the author's identity appears in a fourth
without ever spelling `skelly`. They are not interchangeable. **Never run a global
find-and-replace on `skelly`** — that is the failure this procedure exists to prevent.

| | What | What to do |
|---|---|---|
| **A. Identity tokens** | package names, the db filename, nav labels | rename — `scaffold.json` lists every one, scoped to its file |
| **B. Files about Skelly** | README, SECURITY, ARCHITECTURE, the banner | delete. Substitute the slug and read it back: if it is not now a true statement about the user's project, it goes |
| **C. Demo content** | the landing page, the example schema | leave completely alone, and report it. It is the reference implementation the template exists to provide |
| **D. Author identity** | LICENSE, author metadata | delete or blank, never rename. Substituting a slug into a copyright line transfers a false claim, not ownership |

## Procedure

1. **Project name → slug.** Ask if you were not given one. Lowercase and kebab-case it, then
   constrain to `[a-z0-9]([a-z0-9-]*[a-z0-9])?`: drop anything outside `[a-z0-9-]`, collapse
   repeated hyphens, trim the ends. "Acme (US)" becomes `acme-us`. **If nothing survives, stop
   and ask.** The slug is interpolated into package names and into a literal path, so an
   unconstrained value is both wrong and unsafe.
2. **Read `scaffold.json`** next to this file. It holds `dir`, `run`, `rename`, `purge` and
   `demo`.
3. **Clone** into `<slug>/<dir>/`, created in the working directory. If that path exists and is
   non-empty, stop and ask.
   ```bash
   git clone --depth 1 <repo> <slug>/<dir>
   rm -rf <slug>/<dir>/.git
   ```
4. **Delete every path in `purge`.**
5. **Apply every `rename`**, substituting `{{slug}}`, replacing every occurrence of `from` in the
   file named by `file`. Use your file-editing tools, not `sed` — `sed -i` differs between macOS
   and Linux. If a file is missing or `from` is not found, warn, keep going, and record it: the
   template has drifted from the manifest.
6. **Check for drift the manifest does not know about.** Search the scaffolded directory
   case-insensitively for `skelly` and `yeahitsmejayyy`, in contents *and* in file and directory
   names. Subtract the paths listed in `demo` — those are meant to match. Classify anything left
   with the table above, report it, and say what you would do. Do not fix it silently.
7. **Write `<slug>/<dir>/README.md`**: the project name as the heading, `summary` as one line,
   and `run` verbatim as the command to start it. Do not invent the command — step 4 deleted the
   README that would have told you, which is why `run` exists.
8. **At the project root, once:** `git init` and `git add -A`. **Do not commit.** Hand the user a
   one-line commit message as text.

## Prove it runs before you change anything

Start the server in the background, then check it:

```bash
bun run dev
curl -s localhost:3001/trpc/health.check
```

You want `{"result":{"data":{"app":"skelly backend","status":"ok",...}}}`. Show the user
that response. If it fails, fix that before writing a feature — a broken boot is almost
always `schema.sql` (see Gotchas).

## The map

```
src/
├─ server.ts            Bun.serve on :3001, CORS, routes /trpc/* into tRPC
├─ trpc.ts              initTRPC; exports router + publicProcedure; context is EMPTY on purpose
├─ appRouter.ts         root router; exports `type AppRouter` (the frontend's contract)
├─ routes/
│  └─ healthCheck.ts    the one example procedure — copy its shape
└─ db/
   ├─ client.ts         opens skelly.db, applies schema.sql at boot, fails closed
   └─ schema.sql        REQUIRED; your tables live here
```

- **Procedures** are grouped into sub-routers per file in `routes/`, mounted in `appRouter.ts`.
- **The context is deliberately empty.** It is part of the `AppRouter` type the admin imports,
  so putting a `Database` in it would drag Bun types into a browser app. Routes that need the
  database `import { db } from "../db/client"` directly. Put request-scoped things (a session,
  a user id) in the context if you ever need them — never runtime handles.
- **`src/env.ts` is an empty placeholder.** Ignore it unless you need config.

Scripts: `bun run dev`, `bun run build`, `bun start`, `bun run types:emit`.

## The first change

Build whatever the user actually asked for, in this shape. Using notes as the example:

1. **Table** — add to `src/db/schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS notes (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
2. **Route module** — `src/routes/notes.ts`, following `healthCheck.ts`: `router({ ... })` with
   `publicProcedure`. Queries read, mutations write. Validate every input with Zod
   (`.input(z.object({ title: z.string().min(1) }))`). Import `db` from `../db/client` and use
   `db.query(...)` / `db.run(...)`.
3. **Mount it** — in `src/appRouter.ts`, add `notes: notesRouter` beside `health`.
4. **Restart and prove it with curl**, and show the user the output:
   ```bash
   curl -s -X POST localhost:3001/trpc/notes.create \
     -H 'content-type: application/json' -d '{"title":"hello"}'
   curl -s localhost:3001/trpc/notes.list
   ```
5. If an admin exists beside this repo, run `bun run types:emit` so its types can follow.

Commit when it works.

## Report when you finish

- Where it landed, and the command to start it.
- Every warning from step 5 and every drift hit from step 6.
- **Every `demo` entry, out loud, with its note.** This is the difference between the user
  knowing their landing page still advertises Skelly and finding out after they ship.
- That `LICENSE` was removed, so the project carries no licence until they add one.
- Offer to run the `run` command. Do not run it unprompted.
## Gotchas

- **Port 3001**, and CORS is open only to `http://localhost:5173` (the admin's dev server).
  Both are set at the top of `src/server.ts`.
- **Run from the repo root.** `db/client.ts` resolves `skelly.db` and `schema.sql` from
  `process.cwd()`, so starting the server from anywhere else fails.
- **`schema.sql` is applied in full at every boot and the server refuses to start if it is
  invalid.** That is deliberate. Because tables use `CREATE TABLE IF NOT EXISTS`, *adding* a
  table only needs a restart — you do not need to delete `skelly.db`. Changing an existing
  column does need a migration or a fresh database file.
- **After any change to the router, run `bun run types:emit`.** It writes the contract to
  `dist/types/appRouter.d.ts` and refuses to emit if server types leaked into it.
- Do not add `db` (or anything Bun- or Node-flavoured) to the tRPC context.

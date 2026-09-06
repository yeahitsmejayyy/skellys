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

## 1. Scaffold

Clone into a folder named `skelly-backend` inside the user's product folder, and detach it
from Skelly's history so this is *their* repo from the first commit:

```bash
git clone --depth 1 https://github.com/yeahitsmejayyy/skelly-backend.git skelly-backend
cd skelly-backend
rm -rf .git
git init -q && git add -A && git commit -qm "Start from a Skelly"
bun install
```

Keep the folder name `skelly-backend` if the user may also want an admin: the admin's type
sync looks for `../skelly-backend` by default.

## 2. Prove it runs before you change anything

Start the server in the background, then check it:

```bash
bun run dev
curl -s localhost:3001/trpc/health.check
```

You want `{"result":{"data":{"app":"skelly backend","status":"ok",...}}}`. Show the user
that response. If it fails, fix that before writing a feature — a broken boot is almost
always `schema.sql` (see Gotchas).

## 3. The map

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

## 4. The first change

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

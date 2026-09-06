---
name: skelly-admin
description: Start a new admin dashboard, internal portal or back office from the Skelly admin template — React, Vite, Tailwind, shadcn/ui, tRPC typed against a Skelly backend. Use when someone needs the signed-in app they run their product from, or a dashboard over an existing Skelly backend.
---

# Skelly Admin

The signed-in portal: React 19 on Vite, Tailwind v4, shadcn/ui, a collapsible sidebar, and a
tRPC client typed against the backend's router. You clone it, prove the pipe to the backend is
connected, then build the user's first real page.

**Do not read the whole tree.** The map below is what you need. Open a file when you are about
to change it.

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

## Prove it runs

```bash
bun run dev
```

The dashboard's System Health widget calls `health.check` on the backend. If a Skelly backend
is running on `:3001`, it shows **ok**; if not, it shows **Failed** and that is expected — say
so rather than debugging it. `/` redirects to `/login`; any email and password gets you in
(auth is a stub for you to replace).

If there is no backend yet and the user wants one, use the `skelly-backend` skill first —
scaffold both under the same project root so `../backend` resolves.

## The map

```
src/
├─ App.tsx                       routes: / -> /login, /login, then /dashboard + /settings
│                                inside <AppLayout>
├─ main.tsx                      providers; the tRPC client URL (http://localhost:3001/trpc)
├─ lib/
│  ├─ trpc.ts                    createTRPCReact<AppRouter>() — the typed client
│  └─ app-router.d.ts            GENERATED backend contract; refresh with bun run sync:types
├─ types/app-nav.ts              AppNavItem / AppNavSection
├─ components/
│  ├─ layout/app-layout.tsx      sidebar shell; the layout route
│  ├─ layout/app-nav.tsx         the sidebar — NAV ITEMS ARE DECLARED INSIDE THIS COMPONENT
│  ├─ layout/app-breadcrumb.tsx  breadcrumb
│  └─ dashboard/health-status-widget.tsx   copy this to see how a query is consumed
└─ routes/                       login.tsx, dashboard.tsx, settings.tsx
```

- **Adding a nav item means editing the `APP_NAV` array inside `app-nav.tsx`**, not a config
  file. It is declared in the component body; that is the one non-obvious thing here.
- Data comes from `trpc.<router>.<procedure>.useQuery()` — types flow from the committed
  contract, so a procedure that does not exist is a compile error.
- Scripts: `bun run dev`, `bun run build` (typechecks, then builds), `bun run typecheck`,
  `bun run sync:types`.

## The first change

Whatever the user asked for, in this shape. A Notes page as the example:

1. **Page** — `src/routes/notes.tsx`. Copy the query pattern from `health-status-widget.tsx`:
   `const notes = trpc.notes.list.useQuery()`, then render loading, error and empty states.
   Use the shadcn primitives already in `components/ui/`.
2. **Route** — in `App.tsx`, add `<Route path="/notes" element={<Notes />} />` **inside** the
   `<Route element={<AppLayout />}>` block, so it gets the sidebar.
3. **Nav** — add an entry to the `APP_NAV` array in `app-nav.tsx`: `id`, `label`, `to`, and an
   `icon` imported from `lucide-react`.
4. **Prove it**: `bun run build` must pass (it typechecks), and the page must render at
   `/notes` with the nav item highlighted.

If the procedure does not exist on the backend yet, add it there first with the
`skelly-backend` skill, then run `bun run sync:types` here.

Commit when it works.

## Report when you finish

- Where it landed, and the command to start it.
- Every warning from step 5 and every drift hit from step 6.
- **Every `demo` entry, out loud, with its note.** This is the difference between the user
  knowing their landing page still advertises Skelly and finding out after they ship.
- That `LICENSE` was removed, so the project carries no licence until they add one.
- Offer to run the `run` command. Do not run it unprompted.
## Gotchas

- **The backend contract is a snapshot, not a live import.** When the backend's router changes,
  run `bun run sync:types` here and commit the result. After scaffolding it looks for
  `../backend`; set `BACKEND_DIR=/path/to/backend` if it lives elsewhere.
- **`bun run build` runs `tsc -b` first**, so a type error fails the build. That is the point —
  do not "fix" a red build by skipping the typecheck.
- **The backend URL is hardcoded** in `main.tsx` (`http://localhost:3001/trpc`). Move it to an
  env var when the user deploys.
- **The admin and the site both default to Vite's port 5173.** Running both at once, the second
  silently moves to 5174 and the backend's CORS will reject it. Give one an explicit port.
- Auth is a stub. There is no real session — do not present it as security.

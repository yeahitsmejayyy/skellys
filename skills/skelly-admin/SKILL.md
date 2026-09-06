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

## 1. Scaffold

Clone into `skelly-admin` inside the user's product folder, detached from Skelly's history:

```bash
git clone --depth 1 https://github.com/yeahitsmejayyy/skelly-admin.git skelly-admin
cd skelly-admin
rm -rf .git
git init -q && git add -A && git commit -qm "Start from a Skelly"
bun install
```

This repo typechecks and builds on its own — the backend's `AppRouter` type is committed here
as a generated file. It does not need a backend present to build.

## 2. Prove it runs

```bash
bun run dev
```

The dashboard's System Health widget calls `health.check` on the backend. If a Skelly backend
is running on `:3001`, it shows **ok**; if not, it shows **Failed** and that is expected — say
so rather than debugging it. `/` redirects to `/login`; any email and password gets you in
(auth is a stub for you to replace).

If there is no backend yet and the user wants one, use the `skelly-backend` skill first.

## 3. The map

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

## 4. The first change

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

## Gotchas

- **The backend contract is a snapshot, not a live import.** When the backend's router changes,
  run `bun run sync:types` here and commit the result. It looks for `../skelly-backend`; set
  `SKELLY_BACKEND=/path/to/skelly-backend` if it lives elsewhere.
- **`bun run build` runs `tsc -b` first**, so a type error fails the build. That is the point —
  do not "fix" a red build by skipping the typecheck.
- **The backend URL is hardcoded** in `main.tsx` (`http://localhost:3001/trpc`). Move it to an
  env var when the user deploys.
- **The admin and the site both default to Vite's port 5173.** Running both at once, the second
  silently moves to 5174 and the backend's CORS will reject it. Give one an explicit port.
- Auth is a stub. There is no real session — do not present it as security.

# Skellys

Backend, admin and site skeletons your agent installs as a skill. One command, up in minutes,
built to grow.

```bash
npx skills add yeahitsmejayyy/skellys
```

That installs all three skills at once. Your agent picks the right one when you ask for a
backend, an admin, or a landing page — you never have to name it.

The installer auto-detects your agent. To be explicit, append a flag:

```bash
npx skills add yeahitsmejayyy/skellys -a claude-code
npx skills add yeahitsmejayyy/skellys -a cursor
npx skills add yeahitsmejayyy/skellys -a codex
npx skills add yeahitsmejayyy/skellys -a hermes-agent
```

## What you get

| Skill | Starts | Stack |
|---|---|---|
| `skelly-backend` | an API with a database | Bun, SQLite, tRPC, Zod |
| `skelly-admin` | the signed-in portal you run your product from | React, Vite, Tailwind, shadcn/ui, tRPC |
| `skelly-site` | a marketing site | React, Vite, Tailwind, shadcn/ui, 14 typed sections |

Each skill clones its template, detaches it from Skelly's history so the repo is yours from the
first commit, proves it runs, and then builds your first real feature on it.

## They compose

Clone them side by side in one product folder and they wire together: the admin is typed
against the backend's router, and `bun run sync:types` in the admin refreshes that contract.
Keep the folder names (`skelly-backend`, `skelly-admin`, `skelly-site`) and it just works.

They are also fine alone. Take the one you need.

## The templates

- [skelly-backend](https://github.com/yeahitsmejayyy/skelly-backend)
- [skelly-admin](https://github.com/yeahitsmejayyy/skelly-admin)
- [skelly-site](https://github.com/yeahitsmejayyy/skelly-site)

Made with ♥ by [Jayyy](https://itsjayyy.com) · [skellys.vercel.app](https://skellys.vercel.app)

# Architecture

What this repository is, and why it is shaped the way it is.

---

## The shape

```
skellys/
├─ skills/
│  ├─ skelly-backend/SKILL.md
│  ├─ skelly-admin/SKILL.md
│  └─ skelly-site/SKILL.md
└─ scripts/
   ├─ check.sh          install checks; no model, runs in seconds
   └─ e2e.sh            one real agent run per skill
```

That is the whole thing. No build, no dependencies, no runtime. The unit of delivery is a
Markdown file, because that is what an agent reads.

---

## Why three skills instead of one

An agent loads a skill's entire text every time it uses it. One umbrella skill would mean
carrying instructions for a marketing site while building a backend, and a single
`description` would have to trigger correctly for three unrelated requests.

Three skills means the agent loads only what it needs, and each `description` can be written
for one job. The cost is about fifteen lines of scaffold procedure repeated three times,
which is cheaper than the alternative.

---

## What is in a SKILL.md

Each is the same five parts, in the same order:

| Part | Why it exists |
|---|---|
| **Frontmatter** | `name` and `description`. The description is the whole triggering mechanism — it decides whether the agent reaches for this skill when someone says "I need a backend". |
| **Scaffold** | Clone, detach, install, run. |
| **Map** | Where things live, in ten lines. |
| **First change** | A recipe for one representative feature. |
| **Gotchas** | The things that waste an hour if you do not know them. |

**The map is the point of the whole repository.** Left alone, an agent reads a template's
source tree before it changes anything, and that reading is most of what a scaffold costs.
The map replaces it. The gotchas exist for the same reason: each one is something a real
agent tripped over during testing — the admin's nav array being declared inside its
component, the site composing pages in `routes/home.tsx` rather than `App.tsx`, the backend
only booting from its own repository root.

Skills are kept under about 110 lines each. A skill long enough to be comprehensive is long
enough to be expensive.

---

## Clone and detach

Every skill clones shallowly, deletes `.git`, and runs `git init`:

```bash
git clone --depth 1 https://github.com/yeahitsmejayyy/skelly-backend.git skelly-backend
cd skelly-backend && rm -rf .git && git init -q && git add -A && git commit -qm "Start from a Skelly"
```

The result is your repository from its first commit: no Skelly history, no remote pointing
back at us, no fork relationship. You cannot pull our updates, which is deliberate — a
starter you keep syncing with is a framework, and this is not one.

---

## How the three compose

Cloned side by side in one folder, they wire together:

```
your-product/
├─ skelly-backend/     exports the AppRouter type
├─ skelly-admin/       imports a committed copy of it
└─ skelly-site/        independent
```

`skelly-admin` does not import the backend's source. The backend emits its router type
(`bun run types:emit`) and the admin commits a copy (`bun run sync:types`), so the admin
typechecks and builds with no backend present. That sync looks for `../skelly-backend`,
which is why the skills keep the folder names.

Each template is also fine alone. Take the one you need.

---

## Testing

Two scripts, because the two kinds of test have very different costs.

**`scripts/check.sh`** — no model. Lints each SKILL.md (name matches folder, description
present, under 150 lines) and installs the repository for all four agents the landing page
offers, asserting all three skills land where that agent reads them. Seconds.

**`scripts/e2e.sh <skill>`** — one real agent run in a throwaway directory, driven by a
natural prompt that never names the skill. If the agent does not reach for it, the
description is wrong, and that is the finding. Assertions run against the result — a live
server answering curl, a build that typechecks — never against the transcript, because a
transcript can claim anything.

It spends real usage, so it runs before a release rather than on every edit.

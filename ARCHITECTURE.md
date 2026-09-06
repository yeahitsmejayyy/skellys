# Architecture

What this repository is, and why it is shaped the way it is.

---

## The shape

```
skellys/
├─ skills/
│  ├─ skelly-backend/{SKILL.md, scaffold.json}
│  ├─ skelly-admin/{SKILL.md, scaffold.json}
│  └─ skelly-site/{SKILL.md, scaffold.json}
├─ scripts/
│  ├─ check.sh              install checks + drift guard; no model, seconds
│  ├─ e2e.sh                one real agent run per skill
│  └─ verify-manifest.mjs   the manifests against the live templates
└─ reference/               the plugin this grew out of, kept for its reasoning
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

## Scaffolding is data, not prose

Beside each `SKILL.md` sits a `scaffold.json`: the template's clone URL, its directory, the
command that starts it, and three lists — `rename`, `purge`, `demo`.

It is a separate file for two reasons. Prose invites an agent to improvise, and a list of
exact string replacements is the last place you want improvisation. And a machine can check
data: `scripts/verify-manifest.mjs` clones the live templates and asserts that every `from`
still exists upstream, and that no identity token survives a simulated rename. A template that
grows a new occurrence fails that check here, rather than in someone's project.

The manifest lives inside each skill directory rather than at the repository root because the
installer copies a skill directory as a unit. A shared file at the root would not travel with
the skill.

### The four roles of the word "skelly"

This is the thinking the manifests encode, and the reason a global find-and-replace is
forbidden:

| | What | What happens to it |
|---|---|---|
| **A. Identity tokens** | package names, the SQLite filename, nav labels | renamed, scoped to the exact file |
| **B. Files about Skelly** | README, SECURITY, ARCHITECTURE, the banner | deleted. Substitute the slug and read it back — "Acme is a skeleton, not a doctrine" is not a true sentence about anyone's project |
| **C. Demo content** | the landing page, the example schema | untouched, and reported out loud. It is the reference implementation the template exists to provide, and `skellyui.com` is a real domain rather than a token |
| **D. Author identity** | LICENSE, author metadata, avatar | deleted or blanked, never renamed. Substituting a slug into a copyright line transfers a false claim, not ownership |

Category D is the one a search for `skelly` never finds, because it carries the author without
ever spelling the word.

## Clone and detach

Every skill clones shallowly, strips `.git`, applies the manifest, and runs `git init` at the
project root. The result is your repository from its first commit: no Skelly history, no remote
pointing back at us, no fork relationship. You cannot pull our updates, which is deliberate —
a starter you keep syncing with is a framework, and this is not one.

`LICENSE` is deleted rather than rewritten, so a scaffolded project carries no licence until
you add one. The templates are MIT and, for projects scaffolded by these skills, the author
waives the notice-retention requirement.

---

## How the three compose

Scaffolded under one project root, they wire together:

```
acme-widgets/
├─ backend/     exports the AppRouter type
├─ admin/       imports a committed copy of it
└─ site/        independent
```

`skelly-admin` does not import the backend's source. The backend emits its router type
(`bun run types:emit`) and the admin commits a copy (`bun run sync:types`), so the admin
typechecks and builds with no backend present. That sync looks for `../backend`, which is
why the skills scaffold into fixed directory names under the project root.

Each template is also fine alone. Take the one you need.

---

## Testing

Two scripts, because the two kinds of test have very different costs.

**`scripts/check.sh`** — no model. Lints each SKILL.md (name matches folder, description
present, under 150 lines), runs the manifest drift guard, and installs the repository for all
four agents the landing page offers, asserting that all three skills — and their
`scaffold.json` files — land where that agent reads them. Seconds.

**`scripts/e2e.sh <skill>`** — one real agent run in a throwaway directory, driven by a
natural prompt that never names the skill. If the agent does not reach for it, the
description is wrong, and that is the finding. Assertions run against the result — a live
server answering curl, a build that typechecks — never against the transcript, because a
transcript can claim anything.

It spends real usage, so it runs before a release rather than on every edit.

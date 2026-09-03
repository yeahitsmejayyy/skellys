# skellys — plugin design

Date: 2026-09-02

A Claude Code plugin that scaffolds Skelly boilerplate templates into new projects.
One skill, driven by a manifest. Public distribution.

## Problem

Starting a project from a Skelly template is four manual steps, every time:

1. Clone the repo.
2. Remove `.git`.
3. Purge the codebase of the `skelly` slug and replace it with the project's.
4. Strip out the docs that describe Skelly rather than the new project.

Step 3 is the one that looks mechanical and isn't. Inspection of all three repos
(`skelly-backend`, `skelly-admin`, `skelly-site`) found ~45 occurrences of `skelly` across
~10 files, falling into three categories that need three different treatments:

| Category | Where it lives | Correct treatment |
|---|---|---|
| **A. Identity tokens** | `package.json` names, `skelly.db`, `<title>`, nav labels, healthcheck `app` field | Rename to the project's slug. |
| **B. Docs about Skelly** | `README.md`, `SECURITY.md`, `image.png` | Delete. Renaming produces text like "Acme is a skeleton, not a doctrine" and a security policy directing users to file issues on someone else's repo. |
| **C. Demo content** | `skelly-site/src/routes/home.tsx`, `src/seo/seo-defaults.tsx`, `skelly-backend/src/db/schema.sql` | Leave intact. It is the reference implementation the boilerplate exists to provide. Report it so the user knows what is still Skelly-flavored. |

Knowing B from C is judgment, not substitution. That is what makes this a skill rather than a script.

## Non-goals

- Cross-wiring admin to the backend's URL/port. Plausibly the next want, but unproven as
  repeated pain. Ship without it; let usage decide.
- Installing dependencies. The skill offers `bun install`; it does not run it unprompted.
- Per-template override files. A second mechanism the manifest does not yet need.
- A shell script. See *Why no script*.

## Architecture

```
skellys/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # repo is its own marketplace
└── skills/
    └── skelly/
        ├── SKILL.md         # judgment layer
        └── templates.json   # data layer
```

Two layers, one boundary. `SKILL.md` holds the procedure and the reasoning; `templates.json`
holds every fact about every template. Adding a fourth Skelly template is one JSON object and
no change to the prose.

The plugin is named `skellys`; the single skill inside it is named `skelly`.

Install path for users:

```
/plugin marketplace add yeahitsmejayyy/skellys
/plugin install skelly@skellys
```

### `templates.json`

```json
{
  "templates": [
    {
      "id": "backend",
      "repo": "https://github.com/yeahitsmejayyy/skelly-backend",
      "dir": "backend",
      "summary": "Local-first Bun + SQLite backend. tRPC by default, REST as the escape hatch.",
      "rename": [
        { "file": "package.json",            "from": "@skelly/backend", "to": "@{{slug}}/backend" },
        { "file": "src/db/client.ts",        "from": "skelly.db",       "to": "{{slug}}.db" },
        { "file": "src/db/client.ts",        "from": "@skelly/backend", "to": "@{{slug}}/backend" },
        { "file": "src/routes/healthCheck.ts","from": "skelly backend", "to": "{{slug}} backend" }
      ],
      "purge": ["README.md", "SECURITY.md", "image.png"],
      "demo": [
        { "path": "src/db/schema.sql", "note": "Ships an EXAMPLE TABLE `skelly_meta` and a Skelly header comment. Reference material — replace when you write your real schema." }
      ]
    },
    {
      "id": "admin",
      "repo": "https://github.com/yeahitsmejayyy/skelly-admin",
      "dir": "admin",
      "summary": "Vite + React admin portal. Talks to the backend over tRPC.",
      "rename": [
        { "file": "package.json",  "from": "@skelly/frontend", "to": "@{{slug}}/admin" },
        { "file": "index.html",    "from": "@skelly/admin",    "to": "@{{slug}}/admin" },
        { "file": "src/components/layout/app-nav.tsx", "from": "skelly-admin", "to": "{{slug}}-admin" }
      ],
      "purge": ["README.md", "SECURITY.md", "image.png"],
      "demo": []
    },
    {
      "id": "site",
      "repo": "https://github.com/yeahitsmejayyy/skelly-site",
      "dir": "site",
      "summary": "Vite + React marketing site skeleton.",
      "rename": [
        { "file": "package.json", "from": "@skelly/site", "to": "@{{slug}}/site" },
        { "file": "src/components/default.tsx", "from": "skelly-site", "to": "{{slug}}-site" }
      ],
      "purge": ["README.md", "SECURITY.md", "image.png"],
      "demo": [
        { "path": "src/seo/seo-defaults.tsx", "note": "Ships Skelly's meta description. MUST be edited before shipping — this is what search engines index." },
        { "path": "src/routes/home.tsx", "note": "~590 lines of Skelly marketing copy, including a `© 2026 skellyui.com` footer. This is the demo landing page you hack on." }
      ]
    }
  ]
}
```

Notes on the data:

- `admin/package.json` is genuinely named `@skelly/frontend`, not `@skelly/admin`. The manifest
  absorbs the inconsistency. It should be fixed upstream so the manifest stops carrying a wart.
- `rename` entries are file-scoped, not global. A substitution that is correct in `package.json`
  is not automatically correct in a comment block. Scoping removes the guesswork.
- Every template purges the same three files today. That is a coincidence of the current
  templates, not a rule — keep the field per-template.

### `SKILL.md`

Frontmatter description must trigger on the phrasings a user actually reaches for: "new project
from Skelly", "scaffold a backend", "start a landing page", "skelly site", "boilerplate".

Body covers: the three categories and why they differ, the pipeline below, the naming derivation,
and the git stance.

## Pipeline

Inputs: a project name, and one or more template ids.

Resolve naming first:

- `slug` = the project name, kebab-cased and lowercased. `"Acme Widgets"` → `acme-widgets`.
- `slug` is the only derived value. It fills every `{{slug}}` in the manifest, and it names the
  project root directory, created in the current working directory.
- Ask only when the derivation is genuinely ambiguous.

Then, per selected template:

1. `git clone --depth 1 <repo> <root>/<dir>`
2. `rm -rf <root>/<dir>/.git`
3. Delete each path in `purge`.
4. Apply each `rename` entry to its named file, using file-editing tools.
5. Write a stub `README.md`: project name, what this piece is, how to run it.

Then once, at the project root:

6. `git init` and `git add -A`. **Stop.** Hand the user a one-line commit message as text.
   Never run `git commit`.
7. Report every `demo` entry with its note, so the user knows exactly what is still
   Skelly-flavored and which parts must be edited before shipping. Offer to run `bun install`
   in each scaffolded directory; do not run it unprompted.

Step 7 is not a nicety. Without it the user ships a marketing site whose meta description
advertises someone else's boilerplate.

### Layout

```
acme/
├── backend/
├── admin/
└── site/
```

One project root; generic child folder names. A single-template run still produces
`acme/backend/`, so the shape does not change when a second template is added later. One
`git init` at the root covers all three.

## Why no script

The deterministic core is small enough that scripting it costs more than it saves. Total edit
surface is ~45 lines across ~10 files. A script would add a `jq` dependency for manifest parsing
and the BSD-versus-GNU `sed -i` portability trap, both on a plugin distributed to machines we do
not control. Applying the manifest's rules with the agent's own file-editing tools is
dependency-free and portable, and the agent is already required in the loop for the category-C
judgment.

Revisit if the edit surface grows past what is comfortable to apply by hand, or if a template
ever needs a genuine build step.

## Error handling

- **Clone fails** (network, renamed repo, rate limit): report the failing template and stop.
  Do not leave a half-scaffolded root.
- **Target directory exists and is non-empty**: stop and ask. Never overwrite.
- **A `rename` entry's file is missing, or `from` is not found**: warn, continue, and include it
  in the final report. This means the upstream template drifted from the manifest; a partial
  scaffold with a loud warning beats a hard failure.
- **Partial multi-template run**: report which templates succeeded and which did not. Leave
  successful ones in place.

## Testing

Manual, and done by the user — this is scaffolding, and the failure modes are things you see by
looking.

1. Scaffold each template alone into a scratch directory. Verify no `.git`, no `README.md`,
   `SECURITY.md`, or `image.png` from Skelly, and a stub README naming the project.
2. `grep -ri skelly` the result. Every remaining hit must correspond to a `demo` entry that was
   reported in step 7. Any unreported hit is a manifest gap.
3. Scaffold all three at once. Verify the `acme/{backend,admin,site}` layout and a single root
   `.git`.
4. Install and run each scaffolded template; confirm nothing broke in the rename.

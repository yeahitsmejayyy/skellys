# skellys Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public Claude Code plugin whose single skill scaffolds Skelly boilerplate templates into a new project, renaming identity tokens, deleting Skelly's own docs, and leaving demo content intact.

**Architecture:** One plugin, one skill, two layers. `SKILL.md` holds the procedure and the judgment (which occurrences of `skelly` get renamed, deleted, or left alone). `templates.json` holds every fact about every template. Adding a template is one JSON object and no prose change. There is no runtime script — the agent applies the manifest with its own file-editing tools, so the plugin has no dependency beyond `git`.

**Tech Stack:** Markdown + JSON. One Node ESM script for development-time manifest verification only.

**Spec:** `docs/superpowers/specs/2026-09-02-skellys-plugin-design.md`

## Global Constraints

- **License:** MIT, `Copyright (c) 2026 PJ Bell`. Match the existing Skelly repos exactly.
- **Author block:** `{ "name": "PJ Bell", "url": "https://github.com/yeahitsmejayyy" }`. Match `command-center`.
- **Plugin name:** `skellys`. Skill name: `skelly`. Marketplace name: `skellys`.
- **Scaffold-time dependencies:** `git` only. No `jq`, no `sed -i`, no Node. Development-time tooling may use Node.
- **Never run `git commit`.** Stage with `git add` and hand the user a one-line commit message as text. This applies to every task in this plan.
- **Only templating token is `{{slug}}`.** No other placeholders exist in `templates.json`.
- **`rename` rules are file-scoped.** Every rule names the exact file it applies to. Never global find-and-replace.

## Testing Approach

This plugin is markdown and JSON; there is no unit test harness and inventing one would be
scaffolding for its own sake. Verification is real and runnable, just not `pytest`:

- **JSON validity and schema** — `node -e` assertions.
- **Manifest-vs-upstream drift** — `scripts/verify-manifest.mjs` clones the live repos and asserts every `rename.from` still exists in its named file. This is the single most likely failure mode of the whole design, so it gets a real check.
- **End-to-end** — actually scaffold into a scratch directory and `grep -ri skelly` the result. Every surviving hit must correspond to a reported `demo` entry.

Each task ends with commands to run and the exact output to expect.

---

### Task 1: Plugin skeleton

Deliverable: the repo is a valid Claude Code plugin marketplace that installs locally, with zero skills in it yet.

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: an installable plugin named `skellys` whose skills live under `skills/`. Task 3 places `skills/skelly/SKILL.md` into that tree.

- [ ] **Step 1: Initialize the repository**

```bash
cd <repo root>
git init
```

- [ ] **Step 2: Create `.gitignore`**

```
.DS_Store
node_modules/
```

- [ ] **Step 3: Create `LICENSE`**

Copy the MIT text verbatim from any Skelly repo. Exact content:

```
MIT License

Copyright (c) 2026 PJ Bell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Create `.claude-plugin/plugin.json`**

```json
{
  "name": "skellys",
  "displayName": "skellys",
  "version": "0.1.0",
  "description": "Scaffold a new project from a Skelly boilerplate template — clone, cut loose, and rename, without mangling the parts that are deliberately still Skelly.",
  "author": {
    "name": "PJ Bell",
    "url": "https://github.com/yeahitsmejayyy"
  },
  "homepage": "https://github.com/yeahitsmejayyy/skellys",
  "repository": "https://github.com/yeahitsmejayyy/skellys",
  "license": "MIT",
  "keywords": [
    "boilerplate",
    "scaffold",
    "template",
    "starter",
    "skelly"
  ]
}
```

- [ ] **Step 5: Create `.claude-plugin/marketplace.json`**

The repo is its own marketplace, so `source` is `"./"` — same pattern as `command-center`.

```json
{
  "name": "skellys",
  "description": "skellys — scaffold new projects from the Skelly boilerplate templates.",
  "owner": {
    "name": "PJ Bell",
    "url": "https://github.com/yeahitsmejayyy"
  },
  "plugins": [
    {
      "name": "skellys",
      "source": "./",
      "description": "Scaffold a new project from a Skelly boilerplate template — clone, cut loose, and rename, without mangling the parts that are deliberately still Skelly.",
      "version": "0.1.0",
      "license": "MIT",
      "keywords": [
        "boilerplate",
        "scaffold",
        "template",
        "starter",
        "skelly"
      ]
    }
  ]
}
```

- [ ] **Step 6: Create `README.md`**

```markdown
# skellys

Scaffold a new project from a [Skelly](https://github.com/yeahitsmejayyy?tab=repositories&q=skelly)
boilerplate template.

## Install

```
/plugin marketplace add yeahitsmejayyy/skellys
/plugin install skellys@skellys
```

## Use

Ask for what you want:

> Start a new project called Acme Widgets with the backend and the site.

You get:

```
acme-widgets/
├── backend/
└── site/
```

Cloned, `.git` stripped, renamed to your slug, Skelly's own docs removed, and a fresh
`git init` at the root — staged, not committed.

## Templates

| id | repo | what it is |
|---|---|---|
| `backend` | [skelly-backend](https://github.com/yeahitsmejayyy/skelly-backend) | Local-first Bun + SQLite backend. tRPC by default, REST as the escape hatch. |
| `admin` | [skelly-admin](https://github.com/yeahitsmejayyy/skelly-admin) | Vite + React admin portal. Talks to the backend over tRPC. |
| `site` | [skelly-site](https://github.com/yeahitsmejayyy/skelly-site) | Vite + React marketing site skeleton. |

## What it does not rename

Each template ships demo content — a landing page, an example schema. That stays. It is the
reference implementation the boilerplate exists to provide, and the skill reports exactly what
is left so nothing Skelly-flavored reaches production by accident.

## Adding a template

One object in `skills/skelly/templates.json`. No prose changes. Run
`node scripts/verify-manifest.mjs` afterwards.

## License

MIT © 2026 PJ Bell
```

- [ ] **Step 7: Verify both manifests are valid JSON**

Run:

```bash
node -e 'for (const f of [".claude-plugin/plugin.json",".claude-plugin/marketplace.json"]) { const j=JSON.parse(require("fs").readFileSync(f,"utf8")); console.log(f, "ok", j.name); }'
```

Expected:

```
.claude-plugin/plugin.json ok skellys
.claude-plugin/marketplace.json ok skellys
```

- [ ] **Step 8: Verify the plugin installs from a local path**

In an interactive Claude Code session:

```
/plugin marketplace add <repo root>
```

Expected: the marketplace `skellys` is added and lists one plugin, `skellys`. It has no skills
yet — that is correct at this task.

- [ ] **Step 9: Stage, and hand over the commit message**

```bash
git add .gitignore LICENSE README.md .claude-plugin/
```

Do not run `git commit`. Hand the user this message as text:

```
chore: scaffold skellys plugin and marketplace manifests
```

---

### Task 2: The template manifest and its drift guard

Deliverable: `templates.json` describing all three templates, plus a verifier proving every rename rule still matches the live upstream repos.

**Files:**
- Create: `skills/skelly/templates.json`
- Create: `scripts/verify-manifest.mjs`

**Interfaces:**
- Consumes: the repo skeleton from Task 1.
- Produces: `templates.json` with the shape `{ templates: Template[] }`, where
  `Template = { id: string, repo: string, dir: string, summary: string, rename: RenameRule[], purge: string[], demo: DemoNote[] }`,
  `RenameRule = { file: string, from: string, to: string }`, and
  `DemoNote = { path: string, note: string }`.
  Task 3's `SKILL.md` reads exactly these field names.

- [ ] **Step 1: Create `skills/skelly/templates.json`**

Every `from` value below was read directly out of the live repos. `admin/package.json` really is
named `@skelly/frontend`, not `@skelly/admin` — that is an upstream inconsistency the manifest
absorbs.

```json
{
  "templates": [
    {
      "id": "backend",
      "repo": "https://github.com/yeahitsmejayyy/skelly-backend",
      "dir": "backend",
      "summary": "Local-first Bun + SQLite backend. tRPC by default, REST as the escape hatch.",
      "rename": [
        { "file": "package.json", "from": "@skelly/backend", "to": "@{{slug}}/backend" },
        { "file": "src/db/client.ts", "from": "skelly.db", "to": "{{slug}}.db" },
        { "file": "src/db/client.ts", "from": "@skelly/backend", "to": "@{{slug}}/backend" },
        { "file": "src/routes/healthCheck.ts", "from": "skelly backend", "to": "{{slug}} backend" }
      ],
      "purge": ["README.md", "SECURITY.md", "image.png"],
      "demo": [
        {
          "path": "src/db/schema.sql",
          "note": "Ships an EXAMPLE TABLE `skelly_meta` and a Skelly header comment. Reference material — replace it when you write your real schema."
        }
      ]
    },
    {
      "id": "admin",
      "repo": "https://github.com/yeahitsmejayyy/skelly-admin",
      "dir": "admin",
      "summary": "Vite + React admin portal. Talks to the backend over tRPC.",
      "rename": [
        { "file": "package.json", "from": "@skelly/frontend", "to": "@{{slug}}/admin" },
        { "file": "index.html", "from": "@skelly/admin", "to": "@{{slug}}/admin" },
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
        {
          "path": "src/seo/seo-defaults.tsx",
          "note": "Ships Skelly's meta description. MUST be edited before shipping — this is what search engines index."
        },
        {
          "path": "src/routes/home.tsx",
          "note": "~590 lines of Skelly marketing copy, including a `Copyright 2026 skellyui.com` footer. This is the demo landing page you hack on."
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create `scripts/verify-manifest.mjs`**

Development-time only. It may use Node because it never runs on a user's machine — the
scaffold-time `git`-only constraint does not apply here.

```js
#!/usr/bin/env node
// Verifies templates.json against the live upstream Skelly repos.
// Run after any upstream change: node scripts/verify-manifest.mjs

import { readFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const manifest = JSON.parse(
  readFileSync(new URL("../skills/skelly/templates.json", import.meta.url), "utf8")
);

const work = mkdtempSync(join(tmpdir(), "skelly-verify-"));
let failures = 0;

for (const t of manifest.templates) {
  const dir = join(work, t.id);
  console.log(`\n${t.id}  ${t.repo}`);
  execFileSync("git", ["clone", "--depth", "1", "--quiet", t.repo, dir]);

  for (const r of t.rename) {
    const path = join(dir, r.file);
    if (!existsSync(path)) {
      console.error(`  FAIL  ${r.file} does not exist upstream`);
      failures++;
    } else if (!readFileSync(path, "utf8").includes(r.from)) {
      console.error(`  FAIL  ${r.file} no longer contains "${r.from}"`);
      failures++;
    } else {
      console.log(`  ok    ${r.file}  "${r.from}"`);
    }
  }

  for (const p of t.purge) {
    if (existsSync(join(dir, p))) console.log(`  ok    purge ${p}`);
    else console.error(`  WARN  purge target ${p} not present upstream`);
  }

  for (const d of t.demo) {
    if (existsSync(join(dir, d.path))) console.log(`  ok    demo ${d.path}`);
    else console.error(`  WARN  demo path ${d.path} not present upstream`);
  }
}

rmSync(work, { recursive: true, force: true });

if (failures) {
  console.error(`\n${failures} rename rule(s) are stale. Update templates.json.`);
  process.exit(1);
}
console.log("\nmanifest matches upstream");
```

- [ ] **Step 3: Run the verifier and confirm it passes**

Run:

```bash
node scripts/verify-manifest.mjs
```

Expected: every line prefixed `ok`, no `FAIL`, and a final `manifest matches upstream`. Exit
code 0. Confirm with `echo $?`.

- [ ] **Step 4: Prove the verifier actually catches drift**

A check that cannot fail is not a check. Temporarily corrupt one rule and confirm it is caught.

Nothing is committed in this repo yet, so back the file up with `cp` rather than `git checkout`.

Run:

```bash
cp skills/skelly/templates.json /tmp/templates.json.bak
node -e 'const f="skills/skelly/templates.json";const fs=require("fs");const j=JSON.parse(fs.readFileSync(f,"utf8"));j.templates[0].rename[0].from="@skelly/NOPE";fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n");'
node scripts/verify-manifest.mjs; echo "exit=$?"
```

Expected: `FAIL  package.json no longer contains "@skelly/NOPE"` and `exit=1`.

Then restore and re-verify:

```bash
cp /tmp/templates.json.bak skills/skelly/templates.json
node scripts/verify-manifest.mjs; echo "exit=$?"
```

Expected: `manifest matches upstream` and `exit=0`. Do not continue until this passes.

- [ ] **Step 5: Stage, and hand over the commit message**

```bash
git add skills/skelly/templates.json scripts/verify-manifest.mjs
```

Do not run `git commit`. Hand the user this message as text:

```
feat: add skelly template manifest and upstream drift verifier
```

---

### Task 3: The skill

Deliverable: `SKILL.md` that triggers on natural phrasings and scaffolds one template correctly end to end.

**Files:**
- Create: `skills/skelly/SKILL.md`

**Interfaces:**
- Consumes: `skills/skelly/templates.json` from Task 2, reading the fields `id`, `repo`, `dir`, `summary`, `rename[].file`, `rename[].from`, `rename[].to`, `purge[]`, `demo[].path`, `demo[].note`.
- Produces: the user-facing behavior. Task 4 exercises it with multiple templates.

- [ ] **Step 1: Create `skills/skelly/SKILL.md`**

Exact content:

````markdown
---
name: skelly
description: Use when starting a new project from a Skelly boilerplate template - scaffolds skelly-backend, skelly-admin, and/or skelly-site into a project, cuts them loose from their origin, and renames them to the new project's slug. Triggers on "new project from Skelly", "scaffold a backend", "start a landing page", "skelly site", "skelly admin", "skelly backend", "boilerplate", "starter template".
---

# Scaffolding a Skelly template

Skelly templates are boilerplate repos. Scaffolding one means cloning it, cutting it loose from
its origin, and renaming it into the user's project — without mangling the parts that are
deliberately still Skelly.

## The one thing to get right

The word `skelly` appears in these repos in three roles. They are not interchangeable.

**A. Identity tokens** — package names, the SQLite filename, page titles, nav labels. Rename
these. `templates.json` lists every one, scoped to the file it lives in.

**B. Docs about Skelly** — `README.md`, `SECURITY.md`, `image.png`. Delete these. Renaming them
produces sentences like "Acme is a skeleton, not a doctrine", and a security policy directing
the user's users to file issues on someone else's repo.

**C. Demo content** — the site's landing page, the backend's example schema. Leave these
completely alone and report them at the end. They are the reference implementation the
boilerplate exists to provide. Renaming inside them is wrong: `skellyui.com` is a real domain,
not a token.

If you find yourself reaching for a global find-and-replace on `skelly`, stop. That is the
failure mode this skill exists to prevent.

## Procedure

### 1. Establish inputs

Read `templates.json` (next to this file) for the available template ids and their summaries.

Ask for the project name if it was not given. Ask which templates if it was not clear — offer
the ids with their summaries.

Derive `slug`: the project name, lowercased and kebab-cased. "Acme Widgets" becomes
`acme-widgets`. This is the only derived value and it fills every `{{slug}}` in the manifest.
Ask only if the derivation is genuinely ambiguous.

The project root is `./<slug>/`, created in the current working directory. If it already exists
and is non-empty, stop and ask.

### 2. Per template

For each selected template, in order:

1. `git clone --depth 1 <repo> <slug>/<dir>`
2. `rm -rf <slug>/<dir>/.git`
3. Delete every path listed in `purge`.
4. Apply every `rename` entry: in the file named by `file`, replace `from` with `to`, after
   substituting `{{slug}}`. Use your file-editing tools, not `sed` — `sed -i` differs between
   macOS and Linux, and the edit surface is small enough that it does not matter. If the file
   is missing, or `from` is not found, warn and keep going; record it for the report. That
   means the upstream template drifted from the manifest.
5. Write `<slug>/<dir>/README.md`: the project name as the heading, the template's `summary` as
   one line of description, and how to run it.

If a clone fails, report which template failed and stop. Do not leave a half-scaffolded root.
If some templates already succeeded, say which, and leave them in place.

### 3. Finish

Once, at the project root: `git init` and `git add -A`. **Do not run `git commit`.** Hand the
user a one-line commit message as text.

Then report:

- Which templates landed and where.
- Every warning from step 2.4.
- Every `demo` entry, with its `note`. Say this out loud. It is the difference between the user
  knowing their landing page still advertises Skelly and finding that out after they ship.
- Offer to run `bun install` in each scaffolded directory. Do not run it unprompted.
````

- [ ] **Step 2: Verify the frontmatter parses and the skill is discovered**

Run:

```bash
node -e 'const s=require("fs").readFileSync("skills/skelly/SKILL.md","utf8");const m=s.match(/^---\n([\s\S]*?)\n---\n/);if(!m)throw new Error("no frontmatter");const name=m[1].match(/^name:\s*(.+)$/m)[1].trim();const desc=m[1].match(/^description:\s*(.+)$/m)[1].trim();console.log("name:",name);console.log("description length:",desc.length);'
```

Expected: `name: skelly` and a description length well under 1024.

- [ ] **Step 3: Reinstall the plugin and confirm the skill appears**

In an interactive Claude Code session:

```
/plugin marketplace update skellys
/plugin install skellys@skellys
```

Then check the available-skills list contains `skellys:skelly`.

Expected: `skellys:skelly` is listed.

- [ ] **Step 4: End-to-end — scaffold one template**

In a scratch directory, ask Claude:

> Start a new project called Acme Widgets from the Skelly site template.

Expected on disk:

```
acme-widgets/
└── site/
```

- [ ] **Step 5: Verify the single-template result**

Run from inside the scratch directory:

```bash
test ! -e acme-widgets/site/.git && echo "ok: no .git in site"
test ! -e acme-widgets/site/SECURITY.md && echo "ok: SECURITY.md purged"
test ! -e acme-widgets/site/image.png && echo "ok: image.png purged"
grep -q 'acme-widgets' acme-widgets/site/package.json && echo "ok: package renamed"
grep -q 'acme-widgets-site' acme-widgets/site/src/components/default.tsx && echo "ok: component renamed"
test -f acme-widgets/site/README.md && grep -qi 'acme' acme-widgets/site/README.md && echo "ok: stub README written and names the project"
echo "--- surviving skelly hits ---"
grep -ril skelly acme-widgets/site --exclude-dir=node_modules
```

Expected: all six `ok:` lines print, and the surviving-hits list contains **only**
`src/seo/seo-defaults.tsx` and `src/routes/home.tsx` — the two `demo` entries. Any other file
in that list is a gap in `templates.json` rename rules; add the rule and re-run.

Also confirm Claude's report named both demo files with their notes, and that it did not run
`git commit`.

- [ ] **Step 6: Stage, and hand over the commit message**

```bash
git add skills/skelly/SKILL.md
```

Do not run `git commit`. Hand the user this message as text:

```
feat: add skelly scaffolding skill
```

---

### Task 4: Multi-template end to end

Deliverable: proof that the full-product path works — all three templates, one project root, one git repo.

**Files:**
- Modify: `skills/skelly/SKILL.md` and `skills/skelly/templates.json`, only if this task surfaces defects.

**Interfaces:**
- Consumes: everything from Tasks 1-3.
- Produces: nothing new. This task is the acceptance gate.

- [ ] **Step 1: Scaffold all three into a clean scratch directory**

From an empty scratch directory, ask Claude:

> Start a new project called Acme Widgets. I want the backend, the admin, and the site.

Expected on disk:

```
acme-widgets/
├── backend/
├── admin/
└── site/
```

- [ ] **Step 2: Verify layout and git state**

Run:

```bash
test -d acme-widgets/.git && echo "ok: root is a git repo"
test ! -e acme-widgets/backend/.git && echo "ok: backend .git stripped"
test ! -e acme-widgets/admin/.git && echo "ok: admin .git stripped"
test ! -e acme-widgets/site/.git && echo "ok: site .git stripped"
git -C acme-widgets log --oneline 2>&1 | head -1
git -C acme-widgets diff --cached --name-only | wc -l
```

Expected: four `ok:` lines. The `git log` line reports no commits — something like
`fatal: your current branch 'main' does not have any commits yet`. The staged-file count is
greater than zero. If there is a commit, the skill violated the never-commit constraint — fix
`SKILL.md` step 3 and re-run this task.

- [ ] **Step 3: Verify the rename across all three**

Run:

```bash
grep -q '@acme-widgets/backend' acme-widgets/backend/package.json && echo "ok: backend pkg"
grep -q 'acme-widgets.db' acme-widgets/backend/src/db/client.ts && echo "ok: backend db path"
grep -q 'acme-widgets backend' acme-widgets/backend/src/routes/healthCheck.ts && echo "ok: backend healthcheck"
grep -q '@acme-widgets/admin' acme-widgets/admin/package.json && echo "ok: admin pkg"
grep -q '@acme-widgets/admin' acme-widgets/admin/index.html && echo "ok: admin title"
grep -q 'acme-widgets-admin' acme-widgets/admin/src/components/layout/app-nav.tsx && echo "ok: admin nav"
grep -q '@acme-widgets/site' acme-widgets/site/package.json && echo "ok: site pkg"
grep -q 'acme-widgets-site' acme-widgets/site/src/components/default.tsx && echo "ok: site component"
```

Expected: all eight `ok:` lines print.

- [ ] **Step 4: Verify nothing purged survived, and nothing demo was destroyed**

Run:

```bash
find acme-widgets -name SECURITY.md -o -name image.png | wc -l
test -f acme-widgets/backend/src/db/schema.sql && grep -q 'skelly_meta' acme-widgets/backend/src/db/schema.sql && echo "ok: backend demo schema intact"
test -f acme-widgets/site/src/routes/home.tsx && grep -q 'skellyui.com' acme-widgets/site/src/routes/home.tsx && echo "ok: site demo page intact"
for d in backend admin site; do test -f "acme-widgets/$d/README.md" && grep -qi acme "acme-widgets/$d/README.md" && echo "ok: $d stub README"; done
echo "--- surviving skelly hits ---"
grep -ril skelly acme-widgets --exclude-dir=node_modules --exclude-dir=.git
```

Expected: the find count is `0`, and all five `ok:` lines print. The demo content must be
untouched, including `skellyui.com` — a real domain that must not have been renamed. The
surviving hits list contains only `backend/src/db/schema.sql`, `site/src/seo/seo-defaults.tsx`, and
`site/src/routes/home.tsx`.

- [ ] **Step 5: Verify each scaffolded template still runs**

Run in each directory:

```bash
cd acme-widgets/backend && bun install && bun run dev
```

Expected: `🚀 Server listening on: http://localhost:3001`. In another shell:

```bash
curl -s http://localhost:3001/trpc/health.check
```

Expected: JSON whose `app` field is `acme-widgets backend`, not `skelly backend`. Also confirm
`acme-widgets.db` was created in `acme-widgets/backend/`, not `skelly.db`.

Stop the server, then repeat for the other two:

```bash
cd acme-widgets/admin && bun install && bun run dev
cd acme-widgets/site  && bun install && bun run dev
```

Expected: Vite serves each. In `admin`, the browser tab title reads `💀 @acme-widgets/admin`.

Stop each server before moving on.

- [ ] **Step 6: Verify the collision guard**

Re-run the same scaffold request in the same directory, where `acme-widgets/` already exists
and is non-empty.

Expected: Claude stops and asks, and overwrites nothing. If it overwrites, fix `SKILL.md`
step 1 and re-run.

- [ ] **Step 7: Bump the version and stage**

Only if Tasks 1-4 all pass. Confirm the `version` field is identical in
`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`:

```bash
node -e 'const r=f=>JSON.parse(require("fs").readFileSync(f,"utf8"));const a=r(".claude-plugin/plugin.json").version,b=r(".claude-plugin/marketplace.json").plugins[0].version;console.log(a,b,a===b?"ok":"MISMATCH");'
```

Expected: `0.1.0 0.1.0 ok`.

```bash
git add -A
```

Do not run `git commit`. Hand the user this message as text:

```
test: verify multi-template scaffold end to end
```

- [ ] **Step 8: Clean up the scratch directory**

```bash
rm -rf acme-widgets
```

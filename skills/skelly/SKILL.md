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

If `admin` is selected without `backend`, tell the user first: admin's tRPC types import from a
sibling `backend/` directory, so `bun run typecheck` will fail until a backend is scaffolded
alongside it. Proceed if they still want it.

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

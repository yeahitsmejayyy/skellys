---
name: skelly
description: Use when starting a new project from a Skelly boilerplate template - scaffolds skelly-backend, skelly-admin, and/or skelly-site into a project, cuts them loose from their origin, and renames them to the new project's slug. Triggers on "new project from Skelly", "scaffold a backend", "start a landing page", "skelly site", "skelly admin", "skelly backend", "boilerplate", "starter template".
---

# Scaffolding a Skelly template

Skelly templates are boilerplate repos. Scaffolding one means cloning it, cutting it loose from
its origin, and renaming it into the user's project — without mangling the parts that are
deliberately still Skelly.

## The one thing to get right

The word `skelly` appears in these repos in three roles, and the author's identity appears in a
fourth without ever spelling `skelly` at all. They are not interchangeable.

**A. Identity tokens** — package names, the SQLite filename, page titles, nav labels. Rename
these. `templates.json` lists every one, scoped to the file it lives in.

**B. Files about Skelly** — any file whose subject is Skelly itself: its philosophy, its security
policy, its authorship. The test: substitute the slug, then read it back. Is it now a true
statement about the user's project? If not, delete the file rather than rename it. Today that is
`README.md`, `SECURITY.md`, `image.png` — renaming them produces sentences like "Acme is a
skeleton, not a doctrine", and a security policy directing the user's users to file issues on
someone else's repo. A `CONTRIBUTING.md`, a `CHANGELOG.md`, or a `docs/philosophy.md` would fail
the same test.

**C. Demo content** — the site's landing page, the backend's example schema. Leave these
completely alone and report them at the end. They are the reference implementation the
boilerplate exists to provide. Renaming inside them is wrong: `skellyui.com` is a real domain,
not a token.

**D. Author identity** — the licence, `author`/`repository`/`homepage` metadata, ownership files
under `.github/`. These carry the author without ever spelling `skelly`, so a search for the
token will not surface them. Delete or blank; never rename. Substituting the slug into a
copyright line does not transfer ownership, it transfers a false claim.

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
`acme-widgets`. Then constrain the result to `[a-z0-9]([a-z0-9-]*[a-z0-9])?` — drop every
character outside `[a-z0-9-]`, collapse runs of hyphens to one, and trim leading and trailing
hyphens. "Acme (US)" becomes `acme-us`. **If nothing survives, stop and ask the user for a
slug.** Never continue with an empty one: `slug` is interpolated into npm package names and into
a literal `rm -rf` path, so an unconstrained value is both a correctness bug and a hazard.

`slug` is the only derived value and it fills every `{{slug}}` in the manifest. Ask only if the
derivation is genuinely ambiguous.

The project root is `./<slug>/`, created in the current working directory. If it already exists
and is non-empty, stop and ask.

### 2. Per template

For each selected template, in order:

1. `git clone --depth 1 <repo> <slug>/<dir>`
2. `rm -rf <slug>/<dir>/.git`
3. Delete every path listed in `purge`.
4. Apply every `rename` entry: in the file named by `file`, replace **every occurrence of**
   `from` with `to`, after substituting `{{slug}}`. Use your file-editing tools, not `sed` —
   `sed -i` differs between macOS and Linux, and the edit surface is small enough that it does
   not matter. If the file is missing, or `from` is not found, warn and keep going; record it
   for the report. That means the upstream template drifted from the manifest.
5. Check for drift the manifest does not know about. Search `<slug>/<dir>/`
   case-insensitively for `skelly` and for `yeahitsmejayyy`, in file contents *and* in file and
   directory names. Subtract the paths listed in that template's `demo` — those are supposed to
   match. Anything left is manifest drift: the upstream repo grew an occurrence after the
   manifest was last verified. Classify each one with A/B/C/D above, report it, and say what you
   would do about it. Do not fix it silently, and do not reach for a global replace. Use your
   own search tool — this step adds no dependency.
6. Write `<slug>/<dir>/README.md`: the project name as the heading, the template's `summary` as
   one line of description, and the template's `run` value verbatim as the command to start it.
   Do not invent a command — step 2.3 deleted the upstream README that would have told you, and
   `run` is there precisely so you do not have to guess.

If a clone fails, report which template failed and stop. Do not attempt the remaining templates.
Leave everything that already landed on disk exactly as it is — do not delete the successful
templates, and do not delete the project root; it may be a directory the user already had. Name
the templates that succeeded and the ones that were never attempted, so the user can re-run or
finish by hand.

### 3. Finish

Once, at the project root: `git init` and `git add -A`. **Do not run `git commit`.** Hand the
user a one-line commit message as text.

Then report:

- Which templates landed and where.
- Every warning from step 2.4, and every drift hit from step 2.5.
- Every `demo` entry, with its `note`. Say this out loud. It is the difference between the user
  knowing their landing page still advertises Skelly and finding that out after they ship.
- That each template's `LICENSE` was removed, so the project carries no licence until they add
  one.
- Offer to run each template's `run` command in its scaffolded directory. Do not run it
  unprompted.

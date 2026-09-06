---
name: skelly-site
description: Start a new marketing site, landing page or product site from the Skelly site template — React, Vite, Tailwind, shadcn/ui, fourteen typed landing sections behind a registry. Use when someone needs a landing page or marketing site for a product, or wants to launch a page fast without designing sections from scratch.
---

# Skelly Site

A marketing site skeleton: React 19 on Vite, Tailwind v4, shadcn/ui, and fourteen landing
section types that are *data*, not markup. You clone it, prove it runs, then write the user's
real copy into it.

**Do not read the whole tree.** The map below is what you need — especially the part about
where a page is composed, which is not where you would guess.

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

## The map

```
src/
├─ App.tsx                    router only: / , /privacy , /terms — NOT where sections live
├─ routes/home.tsx            THE PAGE. A list of <Section> calls with data props (~600 lines)
├─ sections/
│  ├─ section.tsx             <Section type variant data /> — looks the component up
│  ├─ registry.ts             type + variant -> component
│  └─ types/<type>/<type>-1.ts   the data interface for each section
├─ components/site/<type>/<type>-1.tsx   the markup for each section
└─ seo/seo.tsx                <Seo title description /> per page
```

The fourteen types: `nav`, `hero`, `problem`, `solution`, `benefits`, `how-it-works`,
`features`, `who-its-for`, `social-proof`, `comparison`, `pricing`, `faq`, `lead-capture`,
`footer`. Each currently has one variant, `"1"`.

**A page is a list of sections.** `routes/home.tsx` renders `<Section type="hero" variant="1"
data={{...}} />` one after another. So:

- **Change copy** → edit the `data` prop in `home.tsx`. Nothing else.
- **Reorder the page** → move the `<Section>` block. Nothing else.
- **Remove a section** → delete the block.

You do not touch the section components to change what a page says.

Scripts: `bun run dev`, `bun run build` (typechecks first), `bun run preview`.

## The first change

The user's real copy, in `src/routes/home.tsx` alone:

1. **Open `home.tsx`** and read the `data` prop of the sections you are changing — each one's
   shape is defined in `sections/types/<type>/<type>-1.ts` if you need the fields (e.g. `Hero1Data`
   is `eyebrow?`, `headline`, `description?`, `cta?`).
2. **Write real copy** for the sections that carry the pitch: hero, then pricing, then whichever
   the user cares about. Replace every placeholder you touch — half-real copy reads worse than
   obvious lorem.
3. **Order the page** the way the argument runs. Moving `social-proof` above `pricing` is just
   moving its block.
4. **Update `<Seo>`** at the top of `home.tsx` with a real title and description.
5. **Prove it**: `bun run build` passes, and the dev server shows the new copy in the new order.

Commit when it works.

## Adding a new section design

When the user wants a second look for a section, add a variant rather than editing the existing
one: create `components/site/hero/hero-2.tsx` and `sections/types/hero/hero-2.ts`, register it
in `registry.ts` under `hero` as `"2"`, then switch the page with `variant="2"`. The old design
stays available.

## Report when you finish

- Where it landed, and the command to start it.
- Every warning from step 5 and every drift hit from step 6.
- **Every `demo` entry, out loud, with its note.** This is the difference between the user
  knowing their landing page still advertises Skelly and finding out after they ship.
- That `LICENSE` was removed, so the project carries no licence until they add one.
- Offer to run the `run` command. Do not run it unprompted.
## Gotchas

- **`App.tsx` is a router, not the page.** Sections are composed in `routes/home.tsx`. This is
  the single most common wrong turn in this template.
- **`home.tsx` is one long file of props by design.** Do not "refactor" it into components —
  the whole point is that copy and order live in one editable place.
- **Placeholder copy is everywhere**, including testimonials and FAQ entries that mention
  unrelated products. Anything the user will actually show must be rewritten or removed.
- **A missing type/variant renders a red "Missing section" box in dev** and nothing in
  production. If a section vanishes, check the registry key.
- **The site and the admin both default to Vite's port 5173.** Give one an explicit port if
  both run at once.

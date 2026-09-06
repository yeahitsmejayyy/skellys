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

## 1. Scaffold

Clone into `skelly-site` inside the user's product folder, detached from Skelly's history:

```bash
git clone --depth 1 https://github.com/yeahitsmejayyy/skelly-site.git skelly-site
cd skelly-site
rm -rf .git
git init -q && git add -A && git commit -qm "Start from a Skelly"
bun install
bun run dev
```

Show the user the running page before you change anything. It is full of placeholder copy —
that is the raw material, not a bug.

## 2. The map

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

## 3. The first change

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

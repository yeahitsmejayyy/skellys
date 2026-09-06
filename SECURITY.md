# Security Policy

Skellys is a set of **agent skills**: Markdown files that tell a coding agent how to
scaffold a project. There is no service, no runtime and no dependency to install. The
security surface is what the skills tell your agent to do.

---

## Supported Versions

Only `main` is supported. There are no releases, tags, or backports.

---

## What These Skills Instruct Your Agent To Do

Every skill in `skills/` does the same three things, and you can read the whole of any
one of them in two minutes:

1. **Clone a template over HTTPS** from `github.com/yeahitsmejayyy/skelly-{backend,admin,site}`,
   into a folder in your working directory.
2. **Delete the clone's `.git` and re-initialise it**, so the result is your repository with
   no Skelly history and no remote pointing at us.
3. **Run `bun install`, start a dev server, and make one change you asked for.**

That is the entire footprint. The skills write files inside the folder they create, install
that template's declared dependencies, and bind a local dev server. They do not touch
anything outside the working directory, read credentials, or send data anywhere.

---

## What To Check Before You Trust Them

Skills run with your agent's permissions. That is true of every skill from every author, so
the honest advice is to read them rather than to trust us:

* `skills/*/SKILL.md` — the full instructions, about 100 lines each.
* The templates themselves, which are what actually ends up in your project. Each has its
  own `SECURITY.md`.

If your agent proposes a command from one of these skills that does not match what the
SKILL.md says, stop and tell us — that is a bug or a compromise, and both matter.

---

## Known Sharp Edges

* **The templates are skeletons, not hardened services.** `skelly-admin` ships a login
  screen with no session behind it; `skelly-backend` runs open CORS to a localhost origin.
  Both are documented in their own repositories. Do not deploy either as-is.
* **Cloning executes nothing, but `bun install` does.** Dependencies come from each
  template's committed lockfile. Read it if that matters to you.

---

## Reporting

Open a [security advisory](https://github.com/yeahitsmejayyy/skellys/security/advisories/new)
or an issue. This is a personal project, so expect a human response rather than a fast one.

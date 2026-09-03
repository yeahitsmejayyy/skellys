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

`LICENSE` is not renamed either — it is deleted, so the scaffolded project is your own and does
not ship someone else's copyright line. The templates are MIT, and for projects scaffolded by
this plugin the author waives the notice-retention requirement: add your own licence, or none.

## Adding a template

One object in `skills/skelly/templates.json`. No prose changes. Run
`node scripts/verify-manifest.mjs` afterwards.

| field | what it holds |
|---|---|
| `id` | the name the user selects the template by. Unique across the manifest. |
| `repo` | the clone URL. |
| `dir` | the child directory under the project root. Unique across the manifest. |
| `summary` | one line, used when offering templates and in the generated stub README. |
| `run` | the command that starts it, quoted verbatim into the stub README. |
| `rename` | array of `{ file, from, to }`. File-scoped, never global; `to` may contain `{{slug}}`. |
| `purge` | array of paths deleted at scaffold time. |
| `demo` | array of `{ path, note }`. Deliberately kept; the `note` is read out to the user. |

## License

MIT © 2026 PJ Bell

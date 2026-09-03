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

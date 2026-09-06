#!/usr/bin/env bash
# Layer 2: one real Claude Code run per skill, in a throwaway folder with no templates near it.
# Spends real usage — run before a release, not on every edit.
#
#   ./scripts/e2e.sh backend|admin|site
#
# The prompt never names the skill: if the agent does not reach for it on its own,
# the description is wrong and that is the finding.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  backend) PROMPT="Start me a backend for a project called Acme Widgets. It is a notes app - I need to list and create notes." ;;
  admin)   PROMPT="Start me an admin dashboard for a project called Acme Widgets. It needs a Notes page." ;;
  site)    PROMPT="Start me a marketing site for Beacon, an uptime monitoring tool. Real hero and pricing copy, and put social proof above pricing." ;;
  *) echo "usage: $0 backend|admin|site"; exit 2 ;;
esac

DIR="$(mktemp -d)/run"; mkdir -p "$DIR"; cd "$DIR"
echo "▸ $DIR"
npx -y skills@latest add "$REPO" -a claude-code -y >/dev/null 2>&1

# bypassPermissions is safe here and only here: the folder is a throwaway temp dir.
time claude -p "$PROMPT" --permission-mode bypassPermissions > run.log 2>&1 || true

# Assert the endpoint, not the transcript.
fail=0
check() { if eval "$2" >/dev/null 2>&1; then echo "✓ $1"; else echo "✗ $1"; fail=1; fi; }

case "$1" in
  backend)
    check "scaffolded to acme-widgets/backend/"   "[ -d acme-widgets/backend/src ]"
    check "package renamed off @skelly"        "! grep -q '@skelly/' acme-widgets/backend/package.json"
    check "Skelly README purged"               "[ ! -f acme-widgets/backend/SECURITY.md ]"
    check "LICENSE removed"                    "[ ! -f acme-widgets/backend/LICENSE ]"
    check "history is the user's, not Skelly's" "[ \"\$(git -C acme-widgets/backend rev-list --count HEAD)\" = 1 ]"
    check "notes table in schema.sql"        "grep -qi 'notes' acme-widgets/backend/src/db/schema.sql"
    check "notes mounted in appRouter"       "grep -qi 'notes' acme-widgets/backend/src/appRouter.ts"
    ( cd acme-widgets/backend && bun run dev >/tmp/e2e-server.log 2>&1 & echo $! > /tmp/e2e.pid )
    # Poll until it is actually listening — a fixed sleep races the boot and fails the next check.
    for _ in $(seq 20); do curl -sf localhost:3001/trpc/health.check >/dev/null 2>&1 && break; sleep 1; done
    check "health.check answers"             "curl -sf localhost:3001/trpc/health.check | grep -q '\"status\"'"
    check "notes.list answers"               "curl -sf localhost:3001/trpc/notes.list"
    check "notes.create writes"              "curl -sf -X POST localhost:3001/trpc/notes.create -H 'content-type: application/json' -d '{\"title\":\"e2e\"}' | grep -q result"
    check "Zod rejects an empty title"       "[ \"\$(curl -s -o /dev/null -w '%{http_code}' -X POST localhost:3001/trpc/notes.create -H 'content-type: application/json' -d '{\"title\":\"\"}')\" = 400 ]"
    kill "$(cat /tmp/e2e.pid)" 2>/dev/null || true
    ;;
  admin)
    check "cloned into acme-widgets/admin/"        "[ -d acme-widgets/admin/src ]"
    check "history is the user's"            "[ \"\$(git -C acme-widgets/admin rev-list --count HEAD)\" = 1 ]"
    check "notes route registered"           "grep -qi 'notes' acme-widgets/admin/src/App.tsx"
    check "notes in the sidebar nav"         "grep -qi 'notes' acme-widgets/admin/src/components/layout/app-nav.tsx"
    check "build passes (typechecks)"        "(cd acme-widgets/admin && bun run build)"
    ;;
  site)
    check "cloned into beacon/site/"         "[ -d beacon/site/src ]"
    check "history is the user's"            "[ \"\$(git -C beacon/site rev-list --count HEAD)\" = 1 ]"
    check "placeholder hero copy replaced"   "! grep -q 'Hero Section' beacon/site/src/routes/home.tsx"
    check "social-proof above pricing"       "[ \"\$(grep -n 'social-proof' beacon/site/src/routes/home.tsx | head -1 | cut -d: -f1)\" -lt \"\$(grep -n '\"pricing\"' beacon/site/src/routes/home.tsx | head -1 | cut -d: -f1)\" ]"
    check "build passes (typechecks)"        "(cd beacon/site && bun run build)"
    ;;
esac

echo; echo "transcript: $DIR/run.log"
[ "$fail" = "0" ] && echo "✓ $1 end-to-end passed" || { echo "✗ $1 end-to-end failed"; exit 1; }

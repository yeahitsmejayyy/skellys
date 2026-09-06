#!/usr/bin/env bash
# Layer 1 + 3: no model involved, seconds to run.
# Proves the installer discovers all three skills and puts them where each agent reads them.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fail=0

# Every SKILL.md needs a name matching its folder and a description, and should stay small —
# the agent loads the whole file every time it uses the skill.
for f in "$REPO"/skills/*/SKILL.md; do
  dir="$(basename "$(dirname "$f")")"
  name="$(sed -n 's/^name: *//p' "$f" | head -1)"
  desc="$(sed -n 's/^description: *//p' "$f" | head -1)"
  lines="$(wc -l < "$f" | tr -d ' ')"
  [ "$name" = "$dir" ] || { echo "✗ $dir: name is '$name'"; fail=1; }
  [ -n "$desc" ] || { echo "✗ $dir: no description"; fail=1; }
  [ "$lines" -le 150 ] || { echo "✗ $dir: $lines lines (keep it under 150)"; fail=1; }
done

# Each skill ships a scaffold.json beside its SKILL.md; both must travel together.
for d in "$REPO"/skills/*/; do
  name="$(basename "$d")"
  [ -f "$d/scaffold.json" ] || { echo "✗ $name: no scaffold.json"; fail=1; }
done

# The rename/purge/demo manifests against the live upstream repos. This is the drift guard:
# a template that grows a new identity token fails here rather than in someone's scaffold.
if command -v node >/dev/null 2>&1; then
  if node "$REPO/scripts/verify-manifest.mjs" >/dev/null 2>&1; then
    echo "✓ manifests match upstream"
  else
    echo "✗ manifests drifted from upstream — run: node scripts/verify-manifest.mjs"; fail=1
  fi
else
  echo "· node not found, skipping the manifest drift check"
fi

# The four agents the landing page offers.
for agent in claude-code cursor codex hermes-agent; do
  d="$TMP/$agent"; mkdir -p "$d"
  ( cd "$d" && npx -y skills@latest add "$REPO" -a "$agent" -y >/dev/null 2>&1 )
  n="$(find "$d" -name SKILL.md | wc -l | tr -d ' ')"
  m="$(find "$d" -name scaffold.json | wc -l | tr -d ' ')"
  [ "$m" = "3" ] || { echo "✗ $agent: $m scaffold.json files installed, expected 3"; fail=1; }
  where="$(find "$d" -name SKILL.md -print -quit | sed "s|$d/||;s|/[^/]*/SKILL.md||")"
  if [ "$n" = "3" ]; then echo "✓ $agent -> $where"; else echo "✗ $agent: found $n skills, expected 3"; fail=1; fi
done

[ "$fail" = "0" ] && echo "✓ all checks passed" || { echo "✗ checks failed"; exit 1; }

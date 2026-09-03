#!/usr/bin/env node
// Verifies templates.json against the live upstream Skelly repos.
// Run after any upstream change: node scripts/verify-manifest.mjs

import { readFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

const manifest = JSON.parse(
  readFileSync(new URL("../skills/skelly/templates.json", import.meta.url), "utf8")
);

// Used only to resolve {{slug}} in `to` (and, defensively, `from`) values when
// simulating a rename in memory. Never written to disk.
const DUMMY_SLUG = "dummy-slug";
const fillSlug = (s) => s.split("{{slug}}").join(DUMMY_SLUG);

// Every file under `dir` (excluding .git/ and node_modules/) that still
// contains "skelly", case-insensitively. `-l` makes grep report binary files
// by name only, so it never dumps binary content to the console.
function findSkellyFiles(dir) {
  try {
    const out = execFileSync(
      "grep",
      ["-ril", "skelly", dir, "--exclude-dir=.git", "--exclude-dir=node_modules"],
      { stdio: ["ignore", "pipe", "ignore"] }
    ).toString();
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch (err) {
    if (err.status === 1) return []; // grep found no matches — not an error
    throw err;
  }
}

const work = mkdtempSync(join(tmpdir(), "skelly-verify-"));
let failures = 0;
let staleRenameCount = 0;
let unaccountedCount = 0;
let cloneFailureCount = 0;

try {
  for (const t of manifest.templates) {
    const dir = join(work, t.id);
    console.log(`\n${t.id}  ${t.repo}`);

    try {
      execFileSync("git", ["clone", "--depth", "1", "--quiet", t.repo, dir], { stdio: "pipe" });
    } catch {
      console.error(`  FAIL  could not clone ${t.repo}`);
      failures++;
      cloneFailureCount++;
      break;
    }

    for (const r of t.rename) {
      const path = join(dir, r.file);
      if (!existsSync(path)) {
        console.error(`  FAIL  ${r.file} does not exist upstream`);
        failures++;
        staleRenameCount++;
      } else if (!readFileSync(path, "utf8").includes(r.from)) {
        console.error(`  FAIL  ${r.file} no longer contains "${r.from}"`);
        failures++;
        staleRenameCount++;
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

    // Drift guard: catch NEW skelly occurrences that no rule covers, not just
    // stale ones that an existing rule no longer matches. Check purge/demo
    // membership first so binary files (image.png) never get read as text.
    const purgeSet = new Set(t.purge);
    const demoSet = new Set(t.demo.map((d) => d.path));

    for (const abs of findSkellyFiles(dir)) {
      const rel = relative(dir, abs);

      if (purgeSet.has(rel) || demoSet.has(rel)) {
        console.log(`  ok    accounted for ${rel}`);
        continue;
      }

      let content = readFileSync(abs, "utf8");
      for (const r of t.rename) {
        if (r.file !== rel) continue;
        content = content.split(fillSlug(r.from)).join(fillSlug(r.to));
      }

      if (/skelly/i.test(content)) {
        console.error(`  FAIL  unaccounted skelly in ${rel}`);
        failures++;
        unaccountedCount++;
      } else {
        console.log(`  ok    accounted for ${rel}`);
      }
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  const reasons = [];
  if (staleRenameCount) reasons.push(`${staleRenameCount} rename rule(s) are stale`);
  if (unaccountedCount) reasons.push(`${unaccountedCount} skelly occurrence(s) are unaccounted for`);
  if (cloneFailureCount) reasons.push(`${cloneFailureCount} template(s) failed to clone`);
  const needsManifestUpdate = staleRenameCount > 0 || unaccountedCount > 0;
  console.error(`\n${reasons.join("; ")}.${needsManifestUpdate ? " Update templates.json." : ""}`);
  process.exit(1);
}
console.log("\nmanifest matches upstream");

#!/usr/bin/env node
// Verifies each skill's scaffold.json against the live upstream Skelly repos.
// Run after any upstream change: node scripts/verify-manifest.mjs
//
// Limitation: this script only asserts that no identity token SURVIVES a
// simulated rename. It never compares one rule's `to` against another's, so two
// files that must agree (package.json's name and bun.lock's copy of it) can
// drift apart and still pass. "manifest matches upstream" is not "the manifest
// is internally consistent" — that part is still held by care, not by a guard.

import { readFileSync, existsSync, rmSync, mkdtempSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

// One manifest per skill, each next to its SKILL.md, because the installer copies a skill
// directory as a unit — a shared file at the repo root would not travel with the skill.
const SKILLS = ["skelly-backend", "skelly-admin", "skelly-site"];
const manifest = { templates: [] };
for (const skill of SKILLS) {
  const path = new URL(`../skills/${skill}/scaffold.json`, import.meta.url);
  try {
    manifest.templates.push(JSON.parse(readFileSync(path, "utf8")));
  } catch (err) {
    console.error(`skills/${skill}/scaffold.json is not valid JSON: ${err.message}`);
    process.exit(1);
  }
}

// The author's identity in these repos is not coextensive with the string
// "skelly" — the GitHub handle carries it too, and neither spells out the
// email that also identifies the author, so all three patterns feed the same
// accounting.
const IDENTITY_PATTERNS = ["skelly", "yeahitsmejayyy", "itsjayyy"];
// Patterns are also fed to `grep -e` as POSIX BREs (see findIdentityFiles),
// so a pattern containing a JS/BRE metacharacter would mean two different
// things to the two consumers. Escaping here only protects the JS RegExp
// side; today's patterns are plain alphanumerics so this is a no-op, but it
// keeps the documented extension point from silently over-matching the day
// someone adds a pattern with `.`, `+`, `?`, or `|` in it.
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const IDENTITY_RE = new RegExp(IDENTITY_PATTERNS.map(escapeRegExp).join("|"), "i");

// Used only to resolve {{slug}} in `to` (and, defensively, `from`) values when
// simulating a rename in memory. Never written to disk.
const DUMMY_SLUG = "dummy-slug";
const fillSlug = (s) => s.split("{{slug}}").join(DUMMY_SLUG);

// A purge entry written "src/" matches neither branch of `covered()` below:
// the exact-match test wants "src", and the prefix test builds "src//" which
// never matches a real relative path. Normalize at ingest so a trailing
// slash is never load-bearing.
if (Array.isArray(manifest.templates)) {
  for (const t of manifest.templates) {
    if (t && Array.isArray(t.purge)) {
      t.purge = t.purge.map((p) => (typeof p === "string" ? p.replace(/\/+$/, "") : p));
    }
  }
}

// --- structural validation -------------------------------------------------
// "One object in templates.json" is the documented extension point, so a
// malformed object should produce a sentence, not a TypeError from deep inside
// the clone loop.
function validateManifest(m) {
  const errors = [];

  if (!m || !Array.isArray(m.templates) || m.templates.length === 0) {
    errors.push('"templates" must be a non-empty array');
    return errors;
  }

  const seenIds = new Set();
  const seenDirs = new Set();

  m.templates.forEach((t, i) => {
    const where =
      t && typeof t.id === "string" && t.id ? `template "${t.id}"` : `template #${i}`;

    if (!t || typeof t !== "object" || Array.isArray(t)) {
      errors.push(`${where}: must be an object`);
      return;
    }

    for (const f of ["id", "repo", "dir", "summary", "run"]) {
      if (typeof t[f] !== "string" || !t[f].trim()) {
        errors.push(`${where}: missing or empty string field "${f}"`);
      }
    }
    for (const f of ["rename", "purge", "demo"]) {
      if (!Array.isArray(t[f])) errors.push(`${where}: missing array field "${f}"`);
    }

    if (Array.isArray(t.rename)) {
      t.rename.forEach((r, j) => {
        for (const f of ["file", "from", "to"]) {
          if (!r || typeof r[f] !== "string" || !r[f]) {
            errors.push(`${where}: rename[${j}] missing or empty string field "${f}"`);
          }
        }
      });
    }
    if (Array.isArray(t.purge)) {
      t.purge.forEach((p, j) => {
        if (typeof p !== "string" || !p) {
          errors.push(`${where}: purge[${j}] must be a non-empty string`);
        }
      });
    }
    if (Array.isArray(t.demo)) {
      t.demo.forEach((d, j) => {
        for (const f of ["path", "note"]) {
          if (!d || typeof d[f] !== "string" || !d[f]) {
            errors.push(`${where}: demo[${j}] missing or empty string field "${f}"`);
          }
        }
      });
    }

    if (typeof t.id === "string" && t.id) {
      if (seenIds.has(t.id)) errors.push(`duplicate template id "${t.id}"`);
      seenIds.add(t.id);
    }
    if (typeof t.dir === "string" && t.dir) {
      if (seenDirs.has(t.dir)) errors.push(`duplicate template dir "${t.dir}"`);
      seenDirs.add(t.dir);
    }

    if (Array.isArray(t.rename) && Array.isArray(t.purge)) {
      const purgeEntries = t.purge.filter((p) => typeof p === "string");
      const purged = new Set(purgeEntries);
      for (const r of t.rename) {
        if (!r || typeof r.file !== "string") continue;
        if (purged.has(r.file)) {
          errors.push(`${where}: "${r.file}" is listed in both rename and purge`);
          continue;
        }
        // `covered()` in the upstream check treats a purge entry as a
        // directory prefix, so a rename target that merely lives UNDER a
        // purged directory is just as much a collision as an exact-path
        // match — it will be deleted before the rename can ever run, and
        // would otherwise pass every identity check as "accounted for"
        // without being examined.
        const nestingPurgeDir = purgeEntries.find((p) => r.file.startsWith(`${p}/`));
        if (nestingPurgeDir) {
          errors.push(
            `${where}: rename file "${r.file}" is inside purged directory "${nestingPurgeDir}"`
          );
        }
      }
    }
  });

  return errors;
}

const structuralErrors = validateManifest(manifest);
if (structuralErrors.length) {
  console.error("templates.json is structurally invalid:");
  for (const e of structuralErrors) console.error(`  FAIL  ${e}`);
  console.error(`\n${structuralErrors.length} structural problem(s). Fix templates.json.`);
  process.exit(1);
}

// --- upstream checks -------------------------------------------------------

// Every file under `dir` (excluding .git/ and node_modules/) that still
// contains one of the identity patterns, case-insensitively. `-l` makes grep
// report binary files by name only, so it never dumps binary content.
function findIdentityFiles(dir) {
  const args = ["-ril"];
  for (const p of IDENTITY_PATTERNS) args.push("-e", p);
  args.push(dir, "--exclude-dir=.git", "--exclude-dir=node_modules");
  try {
    const out = execFileSync("grep", args, { stdio: ["ignore", "pipe", "ignore"] }).toString();
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch (err) {
    if (err.status === 1) return []; // grep found no matches — not an error
    throw err;
  }
}

// grep -ril matches contents only. A file or directory whose NAME carries the
// identity but whose body never mentions it passes clean otherwise.
function findIdentityPaths(dir) {
  const hits = [];
  const walk = (abs) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const child = join(abs, entry.name);
      if (IDENTITY_RE.test(entry.name)) hits.push(relative(dir, child));
      if (entry.isDirectory()) walk(child);
    }
  };
  walk(dir);
  return hits;
}

const work = mkdtempSync(join(tmpdir(), "skelly-verify-"));
let failures = 0;
let staleRenameCount = 0;
let unaccountedCount = 0;
let cloneFailureCount = 0;
let skippedTemplates = [];

try {
  for (const [index, t] of manifest.templates.entries()) {
    const dir = join(work, t.id);
    console.log(`\n${t.id}  ${t.repo}`);

    try {
      execFileSync("git", ["clone", "--depth", "1", "--quiet", t.repo, dir], { stdio: "pipe" });
    } catch {
      console.error(`  FAIL  could not clone ${t.repo}`);
      failures++;
      cloneFailureCount++;
      skippedTemplates = manifest.templates.slice(index + 1).map((s) => s.id);
      break;
    }

    for (const r of t.rename) {
      const path = join(dir, r.file);
      if (!existsSync(path)) {
        console.error(`  FAIL  ${r.file} does not exist upstream`);
        failures++;
        staleRenameCount++;
        continue;
      }
      const hits = readFileSync(path, "utf8").split(r.from).length - 1;
      if (hits === 0) {
        console.error(`  FAIL  ${r.file} no longer contains "${r.from}"`);
        failures++;
        staleRenameCount++;
      } else {
        console.log(`  ok    ${r.file}  "${r.from}"`);
        // Not a failure: the scaffold replaces every occurrence. Worth saying
        // out loud so a manifest author knows the rule is multi-hit.
        if (hits > 1) {
          console.log(`  info  ${r.file}  "${r.from}" occurs ${hits} times; all are replaced`);
        }
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

    // Drift guard: catch NEW identity occurrences that no rule covers, not just
    // stale ones that an existing rule no longer matches. Check purge/demo
    // membership first so binary files (image.png) never get read as text.
    const purgeSet = new Set(t.purge);
    const demoSet = new Set(t.demo.map((d) => d.path));
    const covered = (rel) =>
      purgeSet.has(rel) ||
      demoSet.has(rel) ||
      [...purgeSet, ...demoSet].some((p) => rel.startsWith(`${p}/`));

    for (const abs of findIdentityFiles(dir)) {
      const rel = relative(dir, abs);

      if (covered(rel)) {
        console.log(`  ok    accounted for ${rel}`);
        continue;
      }

      let content = readFileSync(abs, "utf8");
      for (const r of t.rename) {
        if (r.file !== rel) continue;
        content = content.split(fillSlug(r.from)).join(fillSlug(r.to));
      }

      if (IDENTITY_RE.test(content)) {
        console.error(`  FAIL  unaccounted identity token in ${rel}`);
        failures++;
        unaccountedCount++;
      } else {
        console.log(`  ok    accounted for ${rel}`);
      }
    }

    for (const rel of findIdentityPaths(dir)) {
      if (covered(rel)) {
        console.log(`  ok    accounted for path ${rel}`);
        continue;
      }
      console.error(`  FAIL  unaccounted identity token in the path ${rel}`);
      failures++;
      unaccountedCount++;
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (skippedTemplates.length) {
  console.error(
    `\nNot checked because the run aborted: ${skippedTemplates.join(", ")}. ` +
      `Their manifest entries are unverified, not verified-clean.`
  );
}

if (failures) {
  const reasons = [];
  if (staleRenameCount) reasons.push(`${staleRenameCount} rename rule(s) are stale`);
  if (unaccountedCount) reasons.push(`${unaccountedCount} identity occurrence(s) are unaccounted for`);
  if (cloneFailureCount) reasons.push(`${cloneFailureCount} template(s) failed to clone`);
  const needsManifestUpdate = staleRenameCount > 0 || unaccountedCount > 0;
  console.error(`\n${reasons.join("; ")}.${needsManifestUpdate ? " Update templates.json." : ""}`);
  process.exit(1);
}
console.log("\nmanifest matches upstream");

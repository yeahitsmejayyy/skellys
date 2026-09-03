#!/usr/bin/env node
// Verifies templates.json against the live upstream Skelly repos.
// Run after any upstream change: node scripts/verify-manifest.mjs

import { readFileSync, existsSync, rmSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const manifest = JSON.parse(
  readFileSync(new URL("../skills/skelly/templates.json", import.meta.url), "utf8")
);

const work = mkdtempSync(join(tmpdir(), "skelly-verify-"));
let failures = 0;

try {
  for (const t of manifest.templates) {
    const dir = join(work, t.id);
    console.log(`\n${t.id}  ${t.repo}`);

    try {
      execFileSync("git", ["clone", "--depth", "1", "--quiet", t.repo, dir], { stdio: "pipe" });
    } catch {
      console.error(`  FAIL  could not clone ${t.repo}`);
      failures++;
      break;
    }

    for (const r of t.rename) {
      const path = join(dir, r.file);
      if (!existsSync(path)) {
        console.error(`  FAIL  ${r.file} does not exist upstream`);
        failures++;
      } else if (!readFileSync(path, "utf8").includes(r.from)) {
        console.error(`  FAIL  ${r.file} no longer contains "${r.from}"`);
        failures++;
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
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} rename rule(s) are stale. Update templates.json.`);
  process.exit(1);
}
console.log("\nmanifest matches upstream");
